#!/usr/bin/env node
// Focused CDP driver for the final local Electron smoke test. Keeping the
// mutation modes explicit prevents an inspection run from accidentally
// submitting a message through the user's signed-in account.

import fs from "node:fs";
import path from "node:path";

const endpoint = process.env.CODEX_RENDERER_DEBUG_ENDPOINT ?? "http://127.0.0.1:9223";
const [mode = "inspect", argument = ""] = process.argv.slice(2);
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = pages.find((candidate) =>
  candidate.type === "page" && candidate.url.startsWith("app://-/") && !candidate.url.includes("initialRoute="),
);
if (page == null) throw new Error(`No primary app renderer at ${endpoint}`);

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const protocolEvents = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id == null && ["Runtime.exceptionThrown", "Runtime.consoleAPICalled", "Log.entryAdded"].includes(message.method)) {
    protocolEvents.push(message);
  }
  const waiter = pending.get(message.id);
  if (waiter == null) return;
  pending.delete(message.id);
  if (message.error != null) waiter.reject(new Error(message.error.message));
  else waiter.resolve(message.result);
});

function command(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { reject, resolve }));
}

function protocolEventDetails(event) {
  if (event.method === "Log.entryAdded") {
    const entry = event.params?.entry ?? {};
    return { method: event.method, level: entry.level ?? "", text: entry.text ?? "", url: entry.url ?? "", stackTrace: entry.stackTrace ?? null };
  }
  if (event.method === "Runtime.exceptionThrown") {
    const exception = event.params?.exceptionDetails ?? {};
    return {
      method: event.method,
      text: exception.exception?.description ?? exception.text ?? "",
      url: exception.url ?? "",
      lineNumber: exception.lineNumber ?? null,
      columnNumber: exception.columnNumber ?? null,
      stackTrace: exception.stackTrace ?? exception.exception?.preview ?? null,
    };
  }
  const args = event.params?.args ?? [];
  return {
    method: event.method,
    type: event.params?.type ?? "",
    text: args.map((value) => value.value ?? value.description ?? value.unserializableValue ?? JSON.stringify(value.preview ?? {})).join(" "),
    stackTrace: event.params?.stackTrace ?? null,
  };
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails != null) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

await command("Runtime.enable");
await command("Page.bringToFront");

if (mode === "smoke-readonly") {
  const checkpoints = [];
  const screenshotDirectory = process.env.CODEX_E2E_SCREENSHOT_DIR ?? "/tmp/codex-packaged-e2e/screenshots";
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  const conversationTitle = process.env.CODEX_E2E_CONVERSATION_TITLE ?? "回应问候";
  const clickText = async (text) => evaluate(`(() => {
    const candidates = [...document.querySelectorAll('button, a, [role="button"], [role="option"], [role="menuitem"]')]
      .sort((left, right) => Number(right.hasAttribute('data-list-navigation-item')) - Number(left.hasAttribute('data-list-navigation-item')));
    const target = candidates.find((element) =>
      element.getAttribute('aria-label') === ${JSON.stringify(text)} ||
      element.getAttribute('data-app-action-sidebar-thread-title') === ${JSON.stringify(text)} ||
      element.innerText?.trim() === ${JSON.stringify(text)} || element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(text)}
    );
    if (target == null) throw new Error(${JSON.stringify("No clickable element: ")} + ${JSON.stringify(text)});
    target.click();
    return { tagName: target.tagName, text: target.innerText?.trim() ?? '' };
  })()`);
  const clickOneOf = async (texts) => evaluate(`(() => {
    const texts = ${JSON.stringify([])}.concat(${JSON.stringify(texts)});
    const target = [...document.querySelectorAll('button, a, [role="button"], [role="tab"], [role="menuitem"]')].find((element) =>
      texts.includes(element.getAttribute('aria-label')) || texts.includes(element.innerText?.trim())
    );
    if (target == null) throw new Error('No clickable element matching: ' + texts.join(' | '));
    target.click();
    return { tagName: target.tagName, text: target.innerText?.trim() ?? '' };
  })()`);
  const clickTextStartingWith = async (text) => evaluate(`(() => {
    const target = [...document.querySelectorAll('button, a, [role="button"], [role="tab"], [role="menuitem"]')]
      .filter((element) => element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(text)})
      .sort((left, right) => Number(left.getAttribute('aria-label') != null) - Number(right.getAttribute('aria-label') != null))[0];
    if (target == null) throw new Error(${JSON.stringify("No clickable element starting with: ")} + ${JSON.stringify(text)});
    target.click();
    return { tagName: target.tagName, text: target.innerText?.trim() ?? '' };
  })()`);
  const clickAriaWithMouse = async (label) => {
    const point = await evaluate(`(() => {
      const target = document.querySelector('[aria-label=${JSON.stringify(label)}]');
      if (target == null) throw new Error(${JSON.stringify("No aria-labelled element: ")} + ${JSON.stringify(label)});
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  };
  const waitForBodyText = async (expected, timeoutMs = 15_000) => {
    const texts = Array.isArray(expected) ? expected : [expected];
    const deadline = Date.now() + timeoutMs;
    do {
      const bodyText = await evaluate(`(document.body?.innerText ?? '') + ' ' + (document.body?.textContent ?? '')`);
      if (texts.some((text) => bodyText.includes(text))) return bodyText;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error(`Timed out waiting for body text: ${texts.join(' | ')}`);
  };
  const waitForAppReady = async (timeoutMs = 60_000) => {
    const deadline = Date.now() + timeoutMs;
    do {
      const ready = await evaluate(`
        document.querySelector('#settings-search') != null ||
        document.querySelector('[aria-label="打开个人资料菜单"], [aria-label="Open profile menu"]') != null ||
        (document.querySelector('nav') != null && (document.body?.innerText?.trim().length ?? 0) > 20)
      `);
      if (ready) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error('Timed out waiting for the app shell');
  };
  const waitForSelector = async (selector, timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    do {
      if (await evaluate(`document.querySelector(${JSON.stringify(selector)}) != null`)) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error(`Timed out waiting for selector: ${selector}`);
  };
  const waitForSelectorGone = async (selector, timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    do {
      if (!(await evaluate(`document.querySelector(${JSON.stringify(selector)}) != null`))) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error(`Timed out waiting for selector to disappear: ${selector}`);
  };
  const waitForSettingsPageToSettle = async (timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    do {
      const settled = await evaluate(`(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const loadingLeaves = [...document.querySelectorAll('span, p, div')].filter((element) =>
          element.childElementCount === 0 && visible(element) &&
          (/^正在加载(?:\s|.)+/.test(element.innerText?.trim() ?? '') || /^Loading(?:\s|$).+/i.test(element.innerText?.trim() ?? ''))
        );
        return loadingLeaves.length === 0;
      })()`);
      if (settled) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error('Settings page remained on its loading placeholder');
  };
  const assertHealthy = async (name) => {
    const bodyText = await evaluate(`document.body?.innerText ?? ''`);
    const recoveryText = ['ChatGPT hit a snag', 'ChatGPT 遇到了问题', 'Something went wrong. Try again to continue', '出了点问题。请重试以继续'];
    if (recoveryText.some((text) => bodyText.includes(text))) throw new Error(`${name} entered the recovery error boundary`);
    checkpoints.push({ name, bodyTail: bodyText.slice(-1200) });
  };
  const waitForVisualStability = async (timeoutMs = 2_000) => {
    const deadline = Date.now() + timeoutMs;
    let quietSamples = 0;
    do {
      const finiteAnimations = await evaluate(`document.getAnimations().filter((animation) => {
          if (animation.playState !== 'running') return false;
          const iterations = animation.effect?.getTiming?.().iterations;
          return iterations !== Infinity;
        }).length`);
      quietSamples = finiteAnimations === 0 ? quietSamples + 1 : 0;
      if (quietSamples >= 3) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    } while (Date.now() < deadline);
    // Some application surfaces continuously recreate finite emphasis
    // animations. The timeout still prevents capturing the initial route
    // transition without turning a harmless ambient animation into a failure.
  };
  const assertVisualPage = async (name, expectations) => {
    await waitForVisualStability();
    const result = await evaluate(`(() => {
      const bodyText = document.body?.innerText ?? '';
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const contentRoot = document.body;
      const interactive = [...contentRoot.querySelectorAll('button, input, textarea, select, [role="switch"], [role="tab"], [role="combobox"]')].filter(visible);
      const brokenImages = [...contentRoot.querySelectorAll('img')].filter((image) => visible(image) && image.complete && image.naturalWidth === 0);
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
      return {
        bodyText,
        brokenImages: brokenImages.length,
        documentWidth,
        interactiveCount: interactive.length,
        viewportWidth: window.innerWidth,
      };
    })()`);
    for (const text of expectations.text) {
      if (!result.bodyText.includes(text)) throw new Error(`${name} is missing visual content: ${text}`);
    }
    for (const text of expectations.forbidden ?? []) {
      if (result.bodyText.includes(text)) throw new Error(`${name} still contains the skeletal placeholder: ${text}`);
    }
    if (result.interactiveCount < expectations.minimumInteractive) {
      throw new Error(`${name} has only ${result.interactiveCount} visible controls; expected at least ${expectations.minimumInteractive}`);
    }
    if (result.brokenImages !== 0) throw new Error(`${name} contains ${result.brokenImages} broken image(s)`);
    if (!expectations.allowHorizontalOverflow && result.documentWidth > result.viewportWidth + 2) {
      throw new Error(`${name} horizontally overflows: ${result.documentWidth}px > ${result.viewportWidth}px`);
    }
    const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const screenshotPath = path.join(screenshotDirectory, `${name.replaceAll('/', '-')}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    checkpoints.push({ name, screenshotPath });
  };
  const assertReversibleSwitch = async (labelText) => {
    const before = await evaluate(`(() => {
      const label = [...document.querySelectorAll('label, p, span, div')]
        .filter((element) => element.childElementCount <= 4)
        .find((element) => element.innerText?.trim() === ${JSON.stringify(labelText)});
      if (label == null) throw new Error('Switch label not found: ' + ${JSON.stringify(labelText)});
      let container = label;
      let control = null;
      for (let depth = 0; depth < 6 && container != null; depth += 1, container = container.parentElement) {
        control = container.querySelector('[role="switch"], button[aria-checked]');
        if (control != null) break;
      }
      if (control == null) throw new Error('Switch control not found: ' + ${JSON.stringify(labelText)});
      control.dataset.packagedE2eSwitch = 'true';
      const before = control.getAttribute('aria-checked') ?? control.dataset.state;
      control.click();
      return before;
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const after = await evaluate(`(() => {
      const control = document.querySelector('[data-packaged-e2e-switch="true"]');
      const state = control?.getAttribute('aria-checked') ?? control?.dataset.state;
      control?.click();
      return state;
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const restored = await evaluate(`(() => {
      const control = document.querySelector('[data-packaged-e2e-switch="true"]');
      const state = control?.getAttribute('aria-checked') ?? control?.dataset.state;
      control?.removeAttribute('data-packaged-e2e-switch');
      return state;
    })()`);
    if (after === before) throw new Error(`${labelText} switch did not change state`);
    if (restored !== before) throw new Error(`${labelText} switch did not restore its original state`);
  };

  await waitForAppReady();
  if (!(await evaluate(`document.querySelector('#settings-search') != null`))) {
    if (!(await evaluate(`document.querySelector('[aria-label="打开个人资料菜单"], [aria-label="Open profile menu"]') != null`))) {
      await evaluate(`(() => {
        const target = [...document.querySelectorAll('button')].find((button) =>
          ['聊天', '新对话'].includes(button.innerText?.trim())
        );
        if (target == null) throw new Error('Chat navigation button not found before settings');
        target.click();
      })()`);
      await waitForSelector('[aria-label="打开个人资料菜单"], [aria-label="Open profile menu"]');
    }
    const profileMenuLabel = await evaluate(`
      document.querySelector('[aria-label="打开个人资料菜单"]') != null ? '打开个人资料菜单' : 'Open profile menu'
    `);
    const settingsMenuVisible = await evaluate(`
      [...document.querySelectorAll('[role="menuitem"]')].some((element) =>
        ['设置', 'Settings'].includes(element.innerText?.trim().split('\\n')[0])
      )
    `);
    if (!settingsMenuVisible) await clickAriaWithMouse(profileMenuLabel);
    const settingsDeadline = Date.now() + 20_000;
    let settingsClicked = false;
    let attempt = 0;
    while (!settingsClicked && Date.now() < settingsDeadline) {
      settingsClicked = await evaluate(`(() => {
        const target = [...document.querySelectorAll('button, a, [role="button"], [role="menuitem"]')].find((element) =>
          ['设置', 'Settings'].includes(element.innerText?.trim().split('\\n')[0])
        );
        if (target == null) return false;
        target.click();
        return true;
      })()`);
      if (!settingsClicked) {
        if (++attempt % 8 === 0) {
          await evaluate(`document.querySelector('[aria-label="打开个人资料菜单"], [aria-label="Open profile menu"]')?.click()`);
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (!settingsClicked) throw new Error('Settings menu item did not appear');
  }
  await waitForBodyText('搜索设置');
  await clickText('常规');
  await waitForBodyText(['默认权限', 'Send messages']);
  await assertHealthy('settings/general');
  await assertVisualPage('settings/general', {
    text: ['默认权限', '默认文件打开位置', '发送快捷键', '跟进处理方式'],
    forbidden: ['Preferences\nDefault editor\nSend messages'],
    minimumInteractive: 12,
  });
  await assertReversibleSwitch('在菜单栏中显示');

  await clickText('外观');
  await waitForBodyText(['强调色', 'Accent color']);
  await assertVisualPage('settings/appearance', {
    text: ['主题', 'UI 字体', '代码字体', '减少动态效果'],
    minimumInteractive: 14,
  });

  await clickText('个性化');
  await waitForBodyText(['Codex 说明', 'Codex instructions']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/personalization', {
    text: ['Codex 说明', 'Codex 记忆', '保存'],
    forbidden: ['Personalization\nInstructions\nMemory'],
    minimumInteractive: 4,
  });

  await clickText('连接');
  await waitForBodyText(['控制这台 Mac', 'Control this Mac']);
  await assertVisualPage('settings/connections', {
    text: ['控制这台 Mac', '控制其他设备', 'SSH', '允许连接'],
    forbidden: ['Remote connections\nRefreshAdd connection'],
    minimumInteractive: 5,
  });
  await clickText('控制其他设备');
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/connections-control-other-devices', {
    text: ['控制其他设备'],
    minimumInteractive: 3,
  });
  await clickText('SSH');
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/connections-ssh', {
    text: ['SSH'],
    minimumInteractive: 3,
  });
  await clickOneOf(['添加', 'Add']);
  await waitForSelector('[role="dialog"]');
  await assertVisualPage('settings/connections-add-ssh-dialog', {
    text: ['SSH'],
    minimumInteractive: 5,
  });
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await new Promise((resolve) => setTimeout(resolve, 250));

  for (const page of [
    { label: '通知', name: 'notifications' },
    { label: '导入', name: 'import' },
    { label: '个人资料', name: 'profile' },
    { label: '家长控制', name: 'parental-controls' },
    { label: 'Trusted contact', name: 'trusted-contact' },
    { label: '语音', name: 'voice' },
    { label: '宠物', name: 'pets' },
    { label: '键盘快捷键', name: 'keyboard-shortcuts' },
    { label: '电脑操控', name: 'computer-use' },
    { label: '计算机历史记录', name: 'computer-history' },
    { label: '应用快照', name: 'appshots' },
    { label: '已归档的聊天', name: 'archived-chats' },
  ]) {
    await clickText(page.label);
    await waitForSelectorGone('[role="menu"]');
    await new Promise((resolve) => setTimeout(resolve, 250));
    await waitForSettingsPageToSettle();
    await assertVisualPage(`settings/${page.name}`, {
      text: [page.label],
      minimumInteractive: 1,
    });
  }

  await clickText('配置');
  await waitForBodyText(['智能体默认设置', 'Agent defaults']);
  await assertVisualPage('settings/configuration', {
    text: ['批准策略', '沙盒设置', '网页搜索'],
    minimumInteractive: 7,
  });

  await clickText('插件');
  await waitForBodyText(['管理插件、技能和 MCP', 'Manage plugins, skills, and MCP']);
  await assertVisualPage('settings/plugins', {
    text: ['浏览目录', '搜索插件'],
    minimumInteractive: 5,
  });
  for (const tab of [
    { label: '应用', name: 'apps' },
    { label: 'MCP', name: 'mcp' },
    { label: '技能', name: 'skills' },
    { label: '插件', name: 'plugins' },
  ]) {
    await clickTextStartingWith(tab.label);
    await waitForSettingsPageToSettle();
    await assertVisualPage(`settings/plugins-${tab.name}`, {
      text: [tab.label],
      minimumInteractive: 3,
      allowHorizontalOverflow: true,
    });
  }

  await clickText('钩子');
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/hooks', {
    text: ['钩子'],
    minimumInteractive: 1,
  });

  await clickText('环境');
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/environment', {
    text: ['环境'],
    minimumInteractive: 1,
  });

  await clickText('Git');
  await waitForBodyText(['分支前缀', 'Branch prefix']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/git', {
    text: ['Git'],
    minimumInteractive: 1,
  });

  await clickText('Worktrees');
  await waitForBodyText(['工作树根目录', 'Worktree root']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/worktrees', {
    text: ['Worktrees'],
    minimumInteractive: 1,
  });

  await clickText('浏览器');
  await waitForBodyText(['In-app browser', '管理你的 Browser Use']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/browser', {
    text: ['浏览器'],
    minimumInteractive: 2,
  });

  if (await evaluate(`[...document.querySelectorAll('button, a')].some((element) => element.innerText?.trim() === '返回应用')`)) {
    await clickText('返回应用');
  } else {
    await evaluate(`(() => {
      const target = [...document.querySelectorAll('button')].find((button) =>
        ['聊天', '新对话'].includes(button.innerText?.trim())
      );
      if (target == null) throw new Error('New chat navigation button not found after settings');
      target.click();
    })()`);
  }
  await waitForBodyText('新对话');
  await waitForBodyText('探索');
  await assertVisualPage('app/shell', {
    text: ['新对话'],
    minimumInteractive: 8,
    allowHorizontalOverflow: true,
  });

  const explorePoint = await evaluate(`(() => {
    const target = [...document.querySelectorAll('nav button')].find((button) => button.innerText?.trim() === '探索');
    if (target == null) throw new Error('Explore navigation button not found');
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...explorePoint });
  await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...explorePoint });
  await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...explorePoint });
  await waitForSelector('[role="menu"]');
  await waitForBodyText(['Pull Request', '定时任务'], 30_000);
  await assertVisualPage('app/explore', {
    text: ['Pull Request', '站点', '定时任务', '插件'],
    minimumInteractive: 10,
    allowHorizontalOverflow: true,
  });
  const navigateToChat = async (context) => {
    await evaluate(`(() => {
      const target = [...document.querySelectorAll('nav button')].find((button) =>
        ['聊天', '新对话'].includes(button.innerText?.trim())
      );
      if (target == null) throw new Error(${JSON.stringify('Chat navigation button not found after ')} + ${JSON.stringify(context)});
      target.click();
    })()`);
    await waitForBodyText('新对话');
  };
  const openExploreMenu = async () => {
    const point = await evaluate(`(() => {
      const target = [...document.querySelectorAll('nav button')].find((button) => button.innerText?.trim() === '探索');
      if (target == null) throw new Error('Explore navigation button not found');
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    await waitForSelector('[role="menu"]');
    await waitForBodyText(['Pull Request', '定时任务'], 30_000);
  };
  const explorePages = [
    { label: 'Meetings', name: 'meetings', readyText: 'Connect Google Calendar' },
    { label: '站点', name: 'sites', readyText: '“站点”使用前须知' },
    { label: 'Pull Request', name: 'pull-requests', readyText: '搜索 Pull Request' },
    { label: '定时任务', name: 'automations', readyText: '搜索已安排任务' },
    { label: '插件', name: 'plugins', readyText: '热门' },
  ];
  for (const [pageIndex, page] of explorePages.entries()) {
    await clickText(page.label);
    await waitForSelectorGone('[role="menu"]');
    await waitForBodyText(page.readyText, 30_000);
    if (page.name === 'meetings') {
      await waitForBodyText(['No meeting notes found', "Couldn't load meetings"], 60_000);
    }
    await waitForSettingsPageToSettle();
    await assertVisualPage(`app/${page.name}`, {
      text: [page.label],
      forbidden: page.name === 'meetings' ? ['Loading meetings', '正在加载会议'] : [],
      minimumInteractive: 1,
      allowHorizontalOverflow: true,
    });
    await navigateToChat(page.name);
    if (pageIndex < explorePages.length - 1) await openExploreMenu();
  }

  await evaluate(`(() => {
    const target = [...document.querySelectorAll('nav button')].find((button) => button.innerText?.trim() === '项目');
    if (target == null) throw new Error('Projects navigation button not found');
    target.click();
  })()`);
  await waitForBodyText('搜索项目', 30_000);
  await assertVisualPage('app/projects', {
    text: ['项目', '搜索项目', '名称', '已更新'],
    minimumInteractive: 10,
  });

  await evaluate(`(() => {
    const target = [...document.querySelectorAll('nav button')].find((button) =>
      ['聊天', '新对话'].includes(button.innerText?.trim())
    );
    if (target == null) throw new Error('Chat navigation button not found');
    target.click();
  })()`);
  await waitForBodyText('新对话');
  await clickAriaWithMouse('搜索');
  await waitForSelector('[role="dialog"]');
  await assertVisualPage('app/search-command-menu', {
    text: ['命令菜单', '搜索命令和过往对话记录'],
    minimumInteractive: 3,
  });
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await new Promise((resolve) => setTimeout(resolve, 250));

  const activityLabel = await evaluate(`(() =>
    [...document.querySelectorAll('[aria-label]')]
      .map((element) => element.getAttribute('aria-label'))
      .find((label) => label?.startsWith('查看活动')) ?? null
  )()`);
  if (activityLabel == null) throw new Error('Activity navigation button not found');
  await clickAriaWithMouse(activityLabel);
  await waitForBodyText('优先级', 30_000);
  await assertVisualPage('app/activity', {
    text: ['活动', '优先级', '未读'],
    minimumInteractive: 8,
  });
  await evaluate(`(() => {
    const target = [...document.querySelectorAll('nav button')].find((button) =>
      ['聊天', '新对话'].includes(button.innerText?.trim())
    );
    if (target == null) throw new Error('Chat navigation button not found after activity');
    target.click();
  })()`);
  await waitForBodyText('新对话');
  await clickText(conversationTitle);
  await waitForSelector('[data-content-search-unit-key]');
  const assistantUnitDeadline = Date.now() + 30_000;
  let hasAssistantUnit = false;
  let conversationUnitTexts = [];
  do {
    conversationUnitTexts = await evaluate(`
      [...document.querySelectorAll('[data-content-search-unit-key]')].map((element) =>
        element.innerText || element.textContent || element.getAttribute('aria-label') || ''
      )
    `);
    hasAssistantUnit = conversationUnitTexts.some((text) => text.includes('ChatGPT 说：') || text.includes('ChatGPT said:'));
    if (!hasAssistantUnit) await new Promise((resolve) => setTimeout(resolve, 250));
  } while (!hasAssistantUnit && Date.now() < assistantUnitDeadline);
  if (!hasAssistantUnit) throw new Error(`Conversation history did not render an assistant unit: ${JSON.stringify(conversationUnitTexts.slice(-10))}`);
  await assertHealthy('conversation/history');
  await assertVisualPage('conversation/history-visual', {
    text: [conversationTitle],
    minimumInteractive: 8,
    // The release summary panel is translated off-canvas while collapsed;
    // it intentionally remains measurable until its exit transition ends.
    allowHorizontalOverflow: true,
  });

  await evaluate(`(() => {
    const button = document.querySelector('[aria-label="添加文件等内容"]');
    if (button == null) throw new Error('Add-context button not found');
    button.click();
  })()`);
  await waitForBodyText('Control the in-app browser');
  await assertHealthy('conversation/add-context');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });

  console.log(JSON.stringify({ mode, screenshotDirectory, checkpoints: checkpoints.map(({ name }) => name) }, null, 2));
} else if (mode === "fill" || mode === "append") {
  if (argument.length === 0) throw new Error(`${mode} requires non-empty message text`);
  const result = await evaluate(`(() => {
    const editor = document.querySelector('[contenteditable="true"][aria-label="随心输入"]');
    if (editor == null) throw new Error('Composer editor not found');
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    if (${JSON.stringify(mode)} === 'append') range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    const inserted = document.execCommand('insertText', false, ${JSON.stringify(argument)});
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(argument)} }));
    return { inserted, text: editor.innerText, html: editor.innerHTML };
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 250));
  console.log(JSON.stringify({ mode, result, state: await composerState() }, null, 2));
} else if (mode === "send") {
  const result = await evaluate(`(() => {
    const editor = document.querySelector('[contenteditable="true"][aria-label="随心输入"]');
    const container = editor?.closest('[data-composer-body]');
    const button = [...(container?.querySelectorAll('button') ?? [])].find((candidate) =>
      ['发送', '发送消息', 'Send', 'Send message'].includes(candidate.getAttribute('aria-label'))
    );
    if (button == null) throw new Error('Enabled send button not found');
    if (button.disabled) throw new Error('Send button is disabled');
    const text = editor.innerText;
    button.click();
    return { clicked: true, text };
  })()`);
  console.log(JSON.stringify({ mode, result }, null, 2));
} else if (mode === "send-reply") {
  const marker = argument.length > 0 ? argument : `E2E_REPLY_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
  const prompt = process.env.CODEX_E2E_PROMPT?.replaceAll('{marker}', marker) ?? `只回复：${marker}`;
  await command("Log.enable");
  // Log.enable can replay entries that predate this CDP session. Only failures
  // emitted by the send/reply operation belong to this checkpoint.
  await new Promise((resolve) => setTimeout(resolve, 100));
  protocolEvents.length = 0;
  const fillResult = await evaluate(`(() => {
    const editor = document.querySelector('[contenteditable="true"][aria-label="随心输入"]');
    if (editor == null) throw new Error('Composer editor not found');
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    const inserted = document.execCommand('insertText', false, ${JSON.stringify(prompt)});
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(prompt)} }));
    return { inserted, text: editor.innerText };
  })()`);
  const sendDeadline = Date.now() + 10_000;
  let sendResult = null;
  do {
    sendResult = await evaluate(`(() => {
      const editor = document.querySelector('[contenteditable="true"][aria-label="随心输入"]');
      const container = editor?.closest('[data-composer-body]');
      const button = [...(container?.querySelectorAll('button') ?? [])].find((candidate) =>
        ['发送', '发送消息', 'Send', 'Send message'].includes(candidate.getAttribute('aria-label'))
      );
      if (button == null || button.disabled) return null;
      const text = editor.innerText;
      button.click();
      return { clicked: true, text };
    })()`);
    if (sendResult == null) await new Promise((resolve) => setTimeout(resolve, 100));
  } while (sendResult == null && Date.now() < sendDeadline);
  if (sendResult == null) throw new Error('Enabled send button did not appear');

  const replyDeadline = Date.now() + 300_000;
  let assistantReply = null;
  let assistantMessages = [];
  let conversationUnits = [];
  let bodyText = '';
  do {
    assistantMessages = await evaluate(`[...document.querySelectorAll('[data-conversation-block="assistant-message"]')].map((element) => element.innerText || element.textContent || '')`);
    conversationUnits = await evaluate(`[...document.querySelectorAll('[data-content-search-unit-key]')].map((element) => element.innerText || element.textContent || '')`);
    bodyText = await evaluate(`document.body?.innerText ?? ''`);
    const normalizedMarker = marker.replaceAll('\\', '');
    assistantReply = assistantMessages.find((text) =>
      text.replaceAll('\\', '').includes(normalizedMarker) && !/回复已开始|Reply started/i.test(text)
    ) ?? conversationUnits.find((text) =>
      (text.includes('ChatGPT 说：') || text.includes('ChatGPT said:')) &&
      text.replaceAll('\\', '').includes(normalizedMarker) && !/回复已开始|Reply started/i.test(text)
    ) ??
      null;
    if (assistantReply == null) await new Promise((resolve) => setTimeout(resolve, 500));
  } while (assistantReply == null && Date.now() < replyDeadline);
  if (assistantReply == null) throw new Error(`Timed out waiting for assistant reply marker: ${marker}; assistant messages=${JSON.stringify(assistantMessages.slice(-5))}; conversation units=${JSON.stringify(conversationUnits.slice(-5))}; body tail=${JSON.stringify(bodyText.slice(-2000))}`);

  const fatalEvents = protocolEvents.filter((event) => {
    const eventText = protocolEventDetails(event).text;
    if (/Statsig|cloudflare_challenge|DEPRECATED_ENDPOINT|ResizeObserver loop completed with undelivered notifications/u.test(eventText)) return false;
    if (/t3\.gstatic\.com\/faviconV2/u.test(event.params?.entry?.url ?? '') && /404/u.test(eventText)) return false;
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method === 'Log.entryAdded') return event.params?.entry?.level === 'error';
    if (event.method !== 'Runtime.consoleAPICalled' || event.params?.type !== 'error') return false;
    return true;
  });
  if (fatalEvents.length > 0) {
    const details = fatalEvents.map(protocolEventDetails).slice(0, 10);
    throw new Error(`Renderer emitted ${fatalEvents.length} fatal protocol event(s): ${JSON.stringify(details)}`);
  }
  console.log(JSON.stringify({ mode, marker, prompt, fillResult, sendResult, assistantReply, assistantMessageCount: assistantMessages.length }, null, 2));
} else if (mode === "open-text") {
  if (argument.length === 0) throw new Error("open-text requires visible text");
  const result = await evaluate(`(() => {
    const candidates = [...document.querySelectorAll('button, a, [role="button"], [role="option"], [role="menuitem"]')]
      .sort((left, right) => Number(right.hasAttribute('data-list-navigation-item')) - Number(left.hasAttribute('data-list-navigation-item')));
    const target = candidates.find((element) =>
      element.getAttribute('aria-label') === ${JSON.stringify(argument)} ||
      element.getAttribute('data-app-action-sidebar-thread-title') === ${JSON.stringify(argument)} ||
      element.innerText?.trim() === ${JSON.stringify(argument)} || element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(argument)}
    );
    if (target == null) throw new Error('No clickable element with the requested text');
    target.scrollIntoView({ block: 'center', inline: 'nearest' });
    const rect = target.getBoundingClientRect();
    return { clicked: false, tagName: target.tagName, text: target.innerText, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: result.x, y: result.y });
  await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: result.x, y: result.y });
  await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: result.x, y: result.y });
  result.clicked = true;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(JSON.stringify({
    mode,
    result,
    page: await evaluate(`(() => ({ url: location.href, bodyText: document.body?.innerText?.slice(-10000) ?? '' }))()`),
  }, null, 2));
} else if (mode === "list-clickables") {
  console.log(JSON.stringify(await evaluate(`(() => [...document.querySelectorAll('button, a, [role="button"], [role="option"], [role="menuitem"]')].map((element, index) => ({
    index,
    ariaLabel: element.getAttribute('aria-label'),
    text: element.innerText?.trim().slice(0, 160) ?? '',
    title: element.getAttribute('title'),
  })).filter((entry) => entry.ariaLabel || entry.text || entry.title))()`), null, 2));
} else if (mode === "iab-navigation") {
  const requestedUrl = argument.length > 0 ? argument : "https://example.com/";
  const selector = '[data-browser-sidebar-address-input="true"]';
  const appReadyDeadline = Date.now() + 60_000;
  while (!(await evaluate(`document.querySelector('[data-codex-composer], [contenteditable="true"][aria-label="随心输入"]') != null`)) && Date.now() < appReadyDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!(await evaluate(`document.querySelector(${JSON.stringify(selector)}) != null`))) {
    await evaluate(`(async () => {
      const bridge = window.electronBridge;
      if (bridge?.sendMessageFromView == null) throw new Error('Electron message bridge is unavailable');
      await bridge.sendMessageFromView({ type: 'open-browser-tab', source: 'packaged_e2e', initiator: 'side_panel_menu' });
    })()`);
  }
  const openDeadline = Date.now() + 30_000;
  while (!(await evaluate(`document.querySelector(${JSON.stringify(selector)}) != null`)) && Date.now() < openDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!(await evaluate(`document.querySelector(${JSON.stringify(selector)}) != null`))) {
    throw new Error("IAB address input did not appear");
  }
  await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    input.focus();
    input.select();
  })()`);
  await command("Input.insertText", { text: requestedUrl });
  await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });

  const navigationDeadline = Date.now() + 60_000;
  let state;
  do {
    state = await evaluate(`(() => ({
      address: document.querySelector(${JSON.stringify(selector)})?.value ?? null,
      bodyText: document.body?.innerText ?? '',
    }))()`);
    if (state.address?.includes("example.com") && !state.bodyText.includes("标签页内容无法显示")) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  } while (Date.now() < navigationDeadline);
  if (!state.address?.includes("example.com")) throw new Error(`IAB navigation did not commit: ${JSON.stringify(state)}`);
  if (state.bodyText.includes("标签页内容无法显示")) throw new Error("IAB rendered its error boundary");
  const targetDeadline = Date.now() + 30_000;
  let browserTargets = [];
  do {
    const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
    browserTargets = targets.filter((target) => target.type === "page" && target.url === requestedUrl);
    if (browserTargets.length === 0) await new Promise((resolve) => setTimeout(resolve, 250));
  } while (browserTargets.length === 0 && Date.now() < targetDeadline);
  if (browserTargets.length === 0) throw new Error(`No browser target committed ${requestedUrl}`);
  const browserTarget = browserTargets[0];
  const browserSocket = new WebSocket(browserTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    browserSocket.addEventListener("open", resolve, { once: true });
    browserSocket.addEventListener("error", reject, { once: true });
  });
  let browserCommandId = 0;
  const browserPending = new Map();
  const browserExceptions = [];
  browserSocket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params?.exceptionDetails ?? {};
      browserExceptions.push(details.exception?.description ?? details.text ?? "Unknown browser exception");
    }
    const waiter = browserPending.get(message.id);
    if (waiter == null) return;
    browserPending.delete(message.id);
    if (message.error != null) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const browserCommand = (method, params = {}) => {
    const id = ++browserCommandId;
    browserSocket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => browserPending.set(id, { resolve, reject }));
  };
  await browserCommand("Runtime.enable");
  for (const [x, y] of [[10, 10], [100, 100], [300, 200], [600, 400], [200, 500]]) {
    await browserCommand("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  browserSocket.close();
  if (browserExceptions.length > 0) {
    throw new Error(`IAB browser preload raised runtime exceptions: ${JSON.stringify(browserExceptions)}`);
  }
  console.log(JSON.stringify({
    mode,
    requestedUrl,
    address: state.address,
    browserTargets: browserTargets.map((target) => ({ title: target.title, type: target.type, url: target.url })),
    browserExceptions,
  }, null, 2));
} else if (mode === "find-text") {
  if (argument.length === 0) throw new Error("find-text requires visible text");
  console.log(JSON.stringify(await evaluate(`(() => [...document.querySelectorAll('button, a, [role="button"], [role="option"], [role="menuitem"]')]
    .filter((element) => (element.innerText ?? '').includes(${JSON.stringify(argument)}))
    .map((element) => ({
      ariaLabel: element.getAttribute('aria-label'),
      outerHTML: element.outerHTML,
      role: element.getAttribute('role'),
      tagName: element.tagName,
      text: element.innerText?.trim() ?? '',
    })))()`), null, 2));
} else if (mode === "open-aria") {
  if (argument.length === 0) throw new Error("open-aria requires an aria-label");
  const result = await evaluate(`(() => {
    const target = [...document.querySelectorAll('button, a, [role="button"], [role="option"], [role="menuitem"]')].find((element) =>
      element.getAttribute('aria-label') === ${JSON.stringify(argument)}
    );
    if (target == null) throw new Error('No clickable element with the requested aria-label');
    target.click();
    return { clicked: true, tagName: target.tagName, ariaLabel: target.getAttribute('aria-label') };
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(JSON.stringify({
    mode,
    result,
    page: await evaluate(`(() => ({ url: location.href, bodyText: document.body?.innerText?.slice(-10000) ?? '' }))()`),
  }, null, 2));
} else if (mode === "wait") {
  if (argument.length === 0) throw new Error("wait requires a response marker");
  const deadline = Date.now() + 120_000;
  let state;
  do {
    state = await evaluate(`(() => ({
      bodyText: document.body?.innerText ?? '',
      composerText: document.querySelector('[contenteditable="true"][aria-label="随心输入"]')?.innerText ?? null,
      conversationUnits: [...document.querySelectorAll('[data-content-search-unit-key]')].map((element) => element.innerText || element.textContent || ''),
      assistantMessages: [...document.querySelectorAll('[data-conversation-block="assistant-message"]')].map((element) => element.innerText || element.textContent || ''),
    }))()`);
    const normalizedMarker = argument.replaceAll('\\', '');
    const assistantReply = state.assistantMessages.find((text) => text.replaceAll('\\', '').includes(normalizedMarker)) ??
      state.conversationUnits.find((text) => text.includes('ChatGPT 说：') && text.replaceAll('\\', '').includes(normalizedMarker)) ??
      null;
    if (assistantReply != null) {
      console.log(JSON.stringify({ mode, assistantReply, conversationUnits: state.conversationUnits }, null, 2));
      socket.close();
      process.exit(0);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for response marker: ${argument}; assistant messages=${JSON.stringify(state?.assistantMessages?.slice(-5) ?? [])}; conversation units=${JSON.stringify(state?.conversationUnits?.slice(-5) ?? [])}; body tail=${JSON.stringify(state?.bodyText?.slice(-2000) ?? '')}`);
} else if (mode === "watch-errors") {
  const durationMs = argument.length === 0 ? 120_000 : Number(argument);
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error("watch-errors duration must be a positive number");
  await command("Log.enable");
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  console.log(JSON.stringify({ mode, protocolEvents }, null, 2));
} else if (mode === "inspect") {
  console.log(JSON.stringify(await composerState(), null, 2));
} else if (mode === "dump-conversation") {
  console.log(JSON.stringify(await evaluate(`(() => ({
    bodyText: document.body?.innerText ?? '',
    conversationUnits: [...document.querySelectorAll('[data-content-search-unit-key]')].map((element) => element.innerText || element.textContent || ''),
    assistantMessages: [...document.querySelectorAll('[data-conversation-block="assistant-message"]')].map((element) => element.innerText || element.textContent || ''),
    userMessages: [...document.querySelectorAll('[data-conversation-block="user-message"]')].map((element) => element.innerText || element.textContent || ''),
  }))()`), null, 2));
} else {
  throw new Error(`Unknown mode: ${mode}`);
}

await closeSocket();
process.exit(0);

async function closeSocket() {
  if (socket.readyState === WebSocket.CLOSED) return;
  const closed = new Promise((resolve) => socket.addEventListener('close', resolve, { once: true }));
  socket.close();
  await Promise.race([
    closed,
    new Promise((resolve) => setTimeout(resolve, 1_000)),
  ]);
}

async function composerState() {
  return evaluate(`(() => {
    const editor = document.querySelector('[contenteditable="true"][aria-label="随心输入"]');
    const container = editor?.closest('[data-composer-body]');
    return {
      editorText: editor?.innerText ?? null,
      buttons: [...(container?.querySelectorAll('button') ?? [])].map((button) => ({
        ariaLabel: button.getAttribute('aria-label'),
        disabled: button.disabled,
        text: button.innerText,
      })),
    };
  })()`);
}
