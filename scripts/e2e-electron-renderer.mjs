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
      exceptionPreview: exception.exception?.preview ?? null,
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
  const waitForClickableStartingWith = async (text, timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    do {
      const found = await evaluate(`([...document.querySelectorAll('button, a, [role="button"], [role="tab"], [role="menuitem"]')]
        .some((element) => element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(text)}))`);
      if (found) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error(`Timed out waiting for clickable element starting with: ${text}`);
  };
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
  const openMenuBySelector = async (selector, timeoutMs = 10_000) => {
    const point = await evaluate(`(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (target == null) throw new Error('Menu trigger not found: ' + ${JSON.stringify(selector)});
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    const deadline = Date.now() + timeoutMs;
    do {
      const open = await evaluate(`(() => {
        const target = document.querySelector(${JSON.stringify(selector)});
        const menu = [...document.querySelectorAll('[role="menu"]')].find((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        const triggerOpen = target?.getAttribute('aria-expanded') === 'true' || target?.dataset.state === 'open';
        return triggerOpen && menu != null;
      })()`);
      if (open) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (Date.now() < deadline);
    throw new Error(`Timed out opening menu: ${selector}`);
  };
  const closeMenuWithEscape = async (selector, timeoutMs = 10_000) => {
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    const deadline = Date.now() + timeoutMs;
    do {
      if (await evaluate(`(() => {
        const target = document.querySelector(${JSON.stringify(selector)});
        const triggerOpen = target?.getAttribute('aria-expanded') === 'true' || target?.dataset.state === 'open';
        const visibleMenu = [...document.querySelectorAll('[role="menu"]')].some((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        return !triggerOpen && !visibleMenu;
      })()`)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (Date.now() < deadline);
    throw new Error(`Timed out closing menu: ${selector}`);
  };
  const clickVisibleMenuItem = async (text) => {
    const point = await evaluate(`(() => {
      const target = [...document.querySelectorAll('[role="menuitem"]')].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(text)} &&
          rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
      if (target == null) throw new Error('Visible menu item not found: ' + ${JSON.stringify(text)});
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  };
  const waitForBodyText = async (expected, timeoutMs = 15_000) => {
    const texts = Array.isArray(expected) ? expected : [expected];
    const recoveryText = ['ChatGPT hit a snag', 'ChatGPT 遇到了问题', 'Something went wrong. Try again to continue', '出了点问题。请重试以继续'];
    const deadline = Date.now() + timeoutMs;
    do {
      const bodyText = await evaluate(`(document.body?.innerText ?? '') + ' ' + (document.body?.textContent ?? '')`);
      if (texts.some((text) => bodyText.includes(text))) return bodyText;
      if (recoveryText.some((text) => bodyText.includes(text))) {
        const diagnostics = protocolEvents
          .filter((event) =>
            event.method === 'Runtime.exceptionThrown' ||
            event.params?.type === 'error' ||
            event.params?.entry?.level === 'error'
          )
          .slice(-5)
          .map(protocolEventDetails)
          .map(({ stackTrace: _stackTrace, ...detail }) => detail);
        throw new Error(`App entered the recovery error boundary while waiting for: ${texts.join(' | ')}\n${JSON.stringify(diagnostics, null, 2)}`);
      }
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
    if (!expectations.preservePointer && expectations.textRootSelector !== '[role="menu"]') {
      const viewport = await evaluate(`({ width: window.innerWidth, height: window.innerHeight })`);
      await command('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.max(1, viewport.width / 2),
        y: 1,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    await waitForVisualStability();
    const result = await evaluate(`(() => {
      const bodyText = document.body?.innerText ?? '';
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' &&
          rect.width > 0 && rect.height > 0 &&
          rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight;
      };
      const contentRoot = document.body;
      const textRootSelector = ${JSON.stringify(expectations.textRootSelector ?? null)};
      const textRoots = textRootSelector == null
        ? [contentRoot]
        : [...document.querySelectorAll(textRootSelector)].filter(visible);
      const visibleText = textRootSelector == null ? bodyText : textRoots.flatMap((root) => {
        const rootRect = root.getBoundingClientRect();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const texts = [];
        for (let node = walker.nextNode(); node != null; node = walker.nextNode()) {
          const text = node.textContent?.trim();
          if (!text || !visible(node.parentElement)) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const intersectsRoot = [...range.getClientRects()].some((rect) =>
            rect.width > 0 && rect.height > 0 &&
            rect.right > rootRect.left && rect.left < rootRect.right &&
            rect.bottom > rootRect.top && rect.top < rootRect.bottom &&
            rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight
          );
          if (intersectsRoot) texts.push(text);
        }
        return texts;
      }).join(' ');
      const interactive = [...contentRoot.querySelectorAll('button, input, textarea, select, [role="switch"], [role="tab"], [role="combobox"]')].filter(visible);
      const brokenImages = [...contentRoot.querySelectorAll('img')].filter((image) => visible(image) && image.complete && image.naturalWidth === 0);
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
      return {
        bodyText,
        visibleText,
        brokenImages: brokenImages.length,
        controlText: interactive.map((element) => [
          element.getAttribute('aria-label'),
          element.getAttribute('placeholder'),
          element.innerText,
          'value' in element ? element.value : null,
        ].filter(Boolean).join(' ')).join('\\n'),
        documentWidth,
        interactiveCount: interactive.length,
        viewportWidth: window.innerWidth,
      };
    })()`);
    const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const screenshotPath = path.join(screenshotDirectory, `${name.replaceAll('/', '-')}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    for (const text of expectations.text) {
      if (!result.visibleText.includes(text) && (expectations.textRootSelector == null && !result.controlText.includes(text))) {
        throw new Error(`${name} is missing visual content: ${text}`);
      }
    }
    if (expectations.alternativeTextSets != null) {
      const haystack = `${result.visibleText}\n${result.controlText}`;
      const matchedAlternative = expectations.alternativeTextSets.some((texts) =>
        texts.every((text) => haystack.includes(text))
      );
      if (!matchedAlternative) {
        throw new Error(`${name} does not match any valid visual state: ${JSON.stringify(expectations.alternativeTextSets)}`);
      }
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
    checkpoints.push({ name, screenshotPath });
  };
  const assertCompactVisualPage = async (name, expectations, viewport = { width: 900, height: 650 }) => {
    try {
      await command('Emulation.setDeviceMetricsOverride', {
        ...viewport,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await assertVisualPage(`${name}-compact-${viewport.width}x${viewport.height}`, expectations);
    } finally {
      await command('Emulation.clearDeviceMetricsOverride');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
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
  const assertReversibleListControl = async ({ itemText, role }) => {
    const marker = 'data-packaged-e2e-list-control';
    const before = await evaluate(`(() => {
      const item = [...document.querySelectorAll('[role="listitem"]')].find((element) =>
        element.innerText?.split('\\n').map((text) => text.trim()).includes(${JSON.stringify(itemText)})
      );
      if (item == null) throw new Error('List item not found: ' + ${JSON.stringify(itemText)});
      const control = item.querySelector(${JSON.stringify(`[role="${role}"]`)});
      if (control == null) throw new Error('List control not found: ' + ${JSON.stringify(`${itemText} (${role})`)});
      control.setAttribute(${JSON.stringify(marker)}, 'true');
      const state = control.getAttribute('aria-checked');
      if (state == null) throw new Error('List control has no aria-checked state');
      control.click();
      return state;
    })()`);
    const waitForState = async (expectedState, timeoutMs = 5_000) => {
      const deadline = Date.now() + timeoutMs;
      do {
        const state = await evaluate(`document.querySelector('[${marker}="true"]')?.getAttribute('aria-checked') ?? null`);
        if (state === expectedState) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } while (Date.now() < deadline);
      throw new Error(`${itemText} ${role} did not reach state ${expectedState}`);
    };
    const changed = before === 'true' ? 'false' : 'true';
    try {
      await waitForState(changed);
    } finally {
      const current = await evaluate(`document.querySelector('[${marker}="true"]')?.getAttribute('aria-checked') ?? null`);
      if (current !== before) {
        await evaluate(`document.querySelector('[${marker}="true"]')?.click()`);
        await waitForState(before);
      }
      await evaluate(`document.querySelector('[${marker}="true"]')?.removeAttribute(${JSON.stringify(marker)})`);
    }
    checkpoints.push({ name: 'app/explore-customize-toggle', itemText, role, before, changed, restored: before });
  };

  await waitForAppReady();
  const customizeOverlayAlreadyOpen = await evaluate(`(document.body?.innerText ?? '').includes('调整活动的顺序')`);
  if (customizeOverlayAlreadyOpen) {
    await clickText('完成');
    await waitForBodyText('新对话');
  }
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
  const coveredSettingsNavigationLabels = new Set([
    '常规', '通知', '导入', '个人资料', '外观', '家长控制', 'Trusted contact', '语音',
    '配置', '个性化', '宠物', '键盘快捷键', '使用情况和计费', '电脑操控',
    '计算机历史记录', '应用快照', '插件', '浏览器', '钩子', '连接', 'Git', '环境',
    'Worktrees', '已归档的聊天',
  ]);
  const visibleSettingsNavigationLabels = await evaluate(`(() => {
    const navigation = document.querySelector('#settings-search')?.closest('nav');
    if (navigation == null) throw new Error('Settings navigation not found');
    return [...navigation.querySelectorAll('button[aria-label]')]
      .map((button) => button.getAttribute('aria-label'))
      .filter(Boolean);
  })()`);
  const uncoveredSettingsNavigationLabels = visibleSettingsNavigationLabels.filter(
    (label) => label !== '账户' && !coveredSettingsNavigationLabels.has(label),
  );
  if (uncoveredSettingsNavigationLabels.length > 0) {
    throw new Error(`Visible settings routes lack E2E coverage: ${uncoveredSettingsNavigationLabels.join(', ')}`);
  }
  if (!visibleSettingsNavigationLabels.includes('账户')) {
    throw new Error('The external account settings entry is missing');
  }
  checkpoints.push({
    name: 'settings/navigation-coverage',
    covered: [...coveredSettingsNavigationLabels],
    external: ['账户'],
  });
  await clickText('常规');
  await waitForBodyText(['默认权限', 'Send messages']);
  await assertHealthy('settings/general');
  await assertVisualPage('settings/general', {
    text: ['默认权限', '默认文件打开位置', '发送快捷键', '跟进处理方式'],
    forbidden: ['Preferences\nDefault editor\nSend messages'],
    minimumInteractive: 12,
  });
  await assertCompactVisualPage('settings/general', {
    text: ['默认权限', '默认文件打开位置', '发送快捷键'],
    minimumInteractive: 10,
  });
  await assertReversibleSwitch('在菜单栏中显示');

  await clickText('外观');
  await waitForBodyText(['强调色', 'Accent color']);
  await assertVisualPage('settings/appearance', {
    text: ['主题', 'UI 字体', '代码字体', '减少动态效果'],
    minimumInteractive: 14,
  });
  await assertCompactVisualPage('settings/appearance', {
    text: ['主题', 'UI 字体', '代码字体'],
    minimumInteractive: 12,
  });

  await clickText('个性化');
  await waitForBodyText(['Codex 说明', 'Codex instructions']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/personalization', {
    text: ['Codex 说明', 'Codex 记忆', '保存'],
    forbidden: ['Personalization\nInstructions\nMemory'],
    minimumInteractive: 4,
  });
  await assertCompactVisualPage('settings/personalization', {
    text: ['Codex 说明', 'Codex 记忆', '保存'],
    minimumInteractive: 4,
  });

  await clickText('连接');
  await waitForBodyText(['控制这台 Mac', 'Control this Mac']);
  await assertVisualPage('settings/connections', {
    text: ['控制这台 Mac', '控制其他设备', 'SSH', '允许连接'],
    forbidden: ['Remote connections\nRefreshAdd connection'],
    minimumInteractive: 5,
  });
  await assertCompactVisualPage('settings/connections', {
    text: ['控制这台 Mac', '控制其他设备', 'SSH'],
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
    { label: '通知', name: 'notifications', text: ['ChatGPT', 'Codex', '个性化提示'], minimumInteractive: 10 },
    { label: '导入', name: 'import', text: ['自动同步', '从其他 AI 应用导入', '导入历史'], minimumInteractive: 3 },
    { label: '个人资料', name: 'profile', readyText: ['邀请好友', 'Invite friends'], text: ['Token 活动', '活动洞察', '最常用的插件'], minimumInteractive: 5 },
    { label: '家长控制', name: 'parental-controls', text: ['Add family member'], unavailableText: ['无法加载你的家庭信息', '重试'], minimumInteractive: 2 },
    { label: 'Trusted contact', name: 'trusted-contact', text: ['Add contact'], unavailableText: ['Trusted contact', '重试'], minimumInteractive: 2 },
    { label: '语音', name: 'voice', text: ['麦克风', '语音聊天', '听写'], minimumInteractive: 8 },
    { label: '宠物', name: 'pets', text: ['我的宠物', '创建虚拟宠物'], minimumInteractive: 8 },
    { label: '键盘快捷键', name: 'keyboard-shortcuts', text: ['搜索快捷键', '全部重置为默认值'], minimumInteractive: 12 },
    { label: '电脑操控', name: 'computer-use', text: ['任意应用', 'Google Chrome', '始终允许的应用'], minimumInteractive: 8 },
    { label: '计算机历史记录', name: 'computer-history', text: ['让 ChatGPT 关注你的工作', '开启'], minimumInteractive: 2 },
    { label: '应用快照', name: 'appshots', text: ['Appshot 发送目标', '播放音效'], minimumInteractive: 4 },
    { label: '已归档的聊天', name: 'archived-chats', text: ['搜索已归档聊天', '全部删除'], minimumInteractive: 10 },
    {
      label: '使用情况和计费',
      name: 'usage-and-billing',
      readyText: ['当前套餐', 'Your plan', 'Plan limits'],
      text: ['额度余额', '当前余额', '使用限额重置'],
      minimumInteractive: 10,
      readyTimeoutMs: 60_000,
    },
  ]) {
    await clickText(page.label);
    await waitForSelectorGone('[role="menu"]');
    if (page.readyText != null) await waitForBodyText(page.readyText, page.readyTimeoutMs ?? 30_000);
    else await new Promise((resolve) => setTimeout(resolve, 250));
    if (page.unavailableText != null) {
      await waitForBodyText([...page.text, ...page.unavailableText], page.readyTimeoutMs ?? 30_000);
    }
    await waitForSettingsPageToSettle();
    if (page.name === 'notifications') {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const hasLoadError = await evaluate(`(document.body?.innerText ?? '').includes('无法加载 ChatGPT 通知设置')`);
        if (!hasLoadError) break;
        await clickText('重试');
        await new Promise((resolve) => setTimeout(resolve, 1_500));
        await waitForSettingsPageToSettle();
      }
      const notificationSettingsLoaded = await evaluate(`
        (document.body?.innerText ?? '').includes('Codex') &&
        (document.body?.innerText ?? '').includes('个性化提示')
      `);
      if (!notificationSettingsLoaded) {
        checkpoints.push({ name: 'settings/notifications-network-unavailable' });
      }
      page.alternativeTextSets = [
        ['ChatGPT', 'Codex', '个性化提示'],
        ['ChatGPT', '无法加载 ChatGPT 通知设置', '重试'],
      ];
    }
    if (page.unavailableText != null) {
      const expectedContentLoaded = await evaluate(`
        (document.body?.innerText ?? '').includes(${JSON.stringify(page.text[0])})
      `);
      if (!expectedContentLoaded) {
        checkpoints.push({ name: `settings/${page.name}-network-unavailable` });
      }
      page.alternativeTextSets = [page.text, page.unavailableText];
    }
    await assertVisualPage(`settings/${page.name}`, {
      text: [page.label, ...(page.alternativeTextSets == null ? page.text : [])],
      alternativeTextSets: page.alternativeTextSets,
      minimumInteractive: page.minimumInteractive,
    });
    if (page.name === 'usage-and-billing') {
      await assertCompactVisualPage('settings/usage-and-billing', {
        text: ['额度余额', '当前余额', '使用限额重置'],
        minimumInteractive: 8,
      });
      await clickText('分析');
      await waitForBodyText(['总用量历史记录', 'Total usage history'], 60_000);
      await waitForSettingsPageToSettle(60_000);
      await assertVisualPage('settings/usage-and-billing-analytics', {
        text: ['总用量历史记录', '聊天用量排行', '工具活动', '消息'],
        forbidden: ['正在加载聊天用量', 'Loading chat usage'],
        minimumInteractive: 12,
        allowHorizontalOverflow: true,
      });
      await clickText('Overview');
      await waitForBodyText(['当前套餐', 'Your plan', 'Plan limits'], 60_000);
    }
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
  await assertCompactVisualPage('settings/plugins', {
    text: ['浏览目录', '插件', 'GitHub'],
    minimumInteractive: 5,
  });
  const pluginSettingsTabs = [
    { label: '应用', name: 'apps', text: ['搜索应用'], minimumInteractive: 10 },
    { label: 'MCP', name: 'mcp', text: ['搜索 MCP 服务器', '服务器', 'MCP Apps'], minimumInteractive: 8 },
    { label: '技能', name: 'skills', text: ['搜索技能'], minimumInteractive: 7 },
    { label: '插件', name: 'plugins', text: ['搜索插件'], minimumInteractive: 4 },
  ];
  const visiblePluginSettingsTabs = await evaluate(`
    [...document.querySelectorAll('[role="tab"]')]
      .map((element) => element.innerText?.trim().split('\\n')[0])
      .filter(Boolean)
  `);
  const knownPluginSettingsTabs = new Set(pluginSettingsTabs.map((tab) => tab.label));
  const uncoveredPluginSettingsTabs = visiblePluginSettingsTabs.filter(
    (label) => !knownPluginSettingsTabs.has(label),
  );
  if (uncoveredPluginSettingsTabs.length > 0) {
    throw new Error(`Visible plugin settings tabs lack E2E coverage: ${uncoveredPluginSettingsTabs.join(', ')}`);
  }
  checkpoints.push({
    name: 'settings/plugins-navigation-coverage',
    covered: visiblePluginSettingsTabs,
  });
  for (const tab of pluginSettingsTabs) {
    await waitForClickableStartingWith(tab.label);
    await clickTextStartingWith(tab.label);
    await waitForSettingsPageToSettle();
    await assertVisualPage(`settings/plugins-${tab.name}`, {
      text: [tab.label, ...tab.text],
      minimumInteractive: tab.minimumInteractive,
      allowHorizontalOverflow: true,
    });
  }

  await clickText('钩子');
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/hooks', {
    text: ['钩子', '了解更多', '未找到钩子'],
    minimumInteractive: 2,
  });

  await clickText('环境');
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/environment', {
    text: ['环境', 'Cloud', 'Local', 'Personal vault', 'Create'],
    minimumInteractive: 5,
  });

  await clickText('Git');
  await waitForBodyText(['分支前缀', 'Branch prefix']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/git', {
    text: ['Git', '分支前缀', 'Pull Request 合并方法', '提交说明'],
    minimumInteractive: 7,
  });
  await assertCompactVisualPage('settings/git', {
    text: ['Git', '分支前缀', 'Pull Request 合并方法'],
    minimumInteractive: 7,
  });

  await clickText('Worktrees');
  await waitForBodyText(['工作树根目录', 'Worktree root']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/worktrees', {
    text: ['Worktrees', '工作树根目录', '自动删除旧工作树', '自动删除限制'],
    minimumInteractive: 8,
  });
  await assertCompactVisualPage('settings/worktrees', {
    text: ['Worktrees', '工作树根目录', '自动删除旧工作树'],
    minimumInteractive: 8,
  });

  await clickText('浏览器');
  await waitForBodyText(['In-app browser', '管理你的 Browser Use']);
  await waitForSettingsPageToSettle();
  await assertVisualPage('settings/browser', {
    text: ['浏览器', '网页 URL 和链接打开位置', '浏览数据', '自动填充和密码'],
    minimumInteractive: 10,
  });
  await assertCompactVisualPage('settings/browser', {
    text: ['浏览器', '网页 URL 和链接打开位置', '浏览数据'],
    minimumInteractive: 9,
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
  await assertCompactVisualPage('app/shell', {
    text: ['新对话'],
    minimumInteractive: 8,
  }, { width: 1100, height: 720 });

  for (const popup of [
    {
      selector: '[aria-label="打开个人资料菜单"], [aria-label="Open profile menu"]',
      name: 'profile-menu',
      text: ['使用情况', '设置', '退出登录'],
      minimumInteractive: 12,
    },
    {
      selector: '[aria-label^="切换模式"], [aria-label^="Switch mode"]',
      name: 'mode-menu',
      text: ['ChatGPT', 'Codex'],
      minimumInteractive: 10,
    },
    {
      selector: '[aria-label="打开帮助菜单"], [aria-label="Open help menu"]',
      name: 'help-menu',
      text: ['新功能', '键盘快捷键', '帮助'],
      minimumInteractive: 10,
    },
    {
      selector: '[data-composer-navigation-target="permissions"]',
      name: 'composer-permissions-menu',
      text: ['应如何批准 ChatGPT 操作？', '请求批准', '帮我批准', '完全访问权限'],
      minimumInteractive: 10,
    },
    {
      selector: '[data-composer-navigation-target="reasoning"]',
      name: 'composer-model-menu',
      text: ['GPT-5.6 Sol', '中'],
      minimumInteractive: 14,
    },
  ]) {
    await openMenuBySelector(popup.selector);
    await waitForBodyText(popup.text);
    await assertVisualPage(`app/${popup.name}`, {
      text: popup.text,
      textRootSelector: '[role="menu"]',
      minimumInteractive: popup.minimumInteractive,
      allowHorizontalOverflow: true,
    });
    if (popup.name === 'composer-model-menu') {
      await clickAriaWithMouse('选择模型');
      const expandedDeadline = Date.now() + 10_000;
      do {
        const expanded = await evaluate(`(() => {
          const menu = [...document.querySelectorAll('[role="menu"]')].find((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 200;
          });
          return menu?.innerText?.includes('GPT-6.1 Sol') ?? false;
        })()`);
        if (expanded) break;
        if (Date.now() >= expandedDeadline) throw new Error('Timed out expanding the model selector');
        await new Promise((resolve) => setTimeout(resolve, 100));
      } while (true);
      await assertVisualPage('app/composer-model-list', {
        text: ['推荐模型集', 'GPT-6.1 Sol', 'GPT-6 Astra', 'GPT-5.6 Sol'],
        textRootSelector: '[role="menu"]',
        minimumInteractive: 14,
        allowHorizontalOverflow: true,
      });
      await clickAriaWithMouse('选择模型');
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    await closeMenuWithEscape(popup.selector);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const modeSelector = '[aria-label^="切换模式"], [aria-label^="Switch mode"]';
  const originalMode = await evaluate(`(() => {
    const label = document.querySelector(${JSON.stringify(modeSelector)})?.getAttribute('aria-label') ?? '';
    return label.includes('ChatGPT') ? 'ChatGPT' : 'Codex';
  })()`);
  const alternateMode = originalMode === 'Codex' ? 'ChatGPT' : 'Codex';
  try {
    await openMenuBySelector(modeSelector);
    await clickVisibleMenuItem(alternateMode);
    const alternateModeDeadline = Date.now() + 15_000;
    do {
      const active = await evaluate(`document.querySelector(${JSON.stringify(modeSelector)})?.getAttribute('aria-label') ?? ''`);
      if (active.includes(alternateMode)) break;
      if (Date.now() >= alternateModeDeadline) throw new Error(`Timed out switching to ${alternateMode} mode`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (true);
    await assertVisualPage(`app/${alternateMode.toLowerCase()}-mode`, {
      text: [alternateMode, '新对话'],
      minimumInteractive: 8,
      allowHorizontalOverflow: true,
    });
    if (alternateMode === 'ChatGPT') {
      const originalChatGptHomeTab = await evaluate(`(() =>
        [...document.querySelectorAll('button[aria-pressed]')]
          .find((button) => button.getAttribute('aria-pressed') === 'true' && ['聊天', '工作'].includes(button.innerText?.trim()))
          ?.innerText?.trim() ?? null
      )()`);
      const selectChatGptHomeTab = async (label) => {
        await evaluate(`(() => {
          const target = [...document.querySelectorAll('button[aria-pressed]')]
            .find((button) => button.innerText?.trim() === ${JSON.stringify(label)});
          if (target == null) throw new Error(${JSON.stringify('ChatGPT home tab not found: ')} + ${JSON.stringify(label)});
          target.click();
        })()`);
        const deadline = Date.now() + 15_000;
        do {
          const selected = await evaluate(`(() =>
            [...document.querySelectorAll('button[aria-pressed]')]
              .find((button) => button.innerText?.trim() === ${JSON.stringify(label)})
              ?.getAttribute('aria-pressed') === 'true'
          )()`);
          if (selected) return;
          if (Date.now() >= deadline) throw new Error(`Timed out selecting ChatGPT home tab: ${label}`);
          await new Promise((resolve) => setTimeout(resolve, 100));
        } while (true);
      };
      try {
        await selectChatGptHomeTab('聊天');
        await assertVisualPage('app/chatgpt-chat-tab', {
          text: ['聊天', '新对话'],
          minimumInteractive: 8,
          allowHorizontalOverflow: true,
        });
        await assertCompactVisualPage('app/chatgpt-chat-tab', {
          text: ['聊天', '新对话'],
          minimumInteractive: 8,
        });
        await selectChatGptHomeTab('工作');
        await assertVisualPage('app/chatgpt-work-tab', {
          text: ['工作', '我们要做什么？', '选择项目', '插件'],
          minimumInteractive: 8,
          allowHorizontalOverflow: true,
        });
        await assertCompactVisualPage('app/chatgpt-work-tab', {
          text: ['工作', '我们要做什么？', '选择项目', '插件'],
          minimumInteractive: 8,
        });
      } finally {
        if (originalChatGptHomeTab != null) await selectChatGptHomeTab(originalChatGptHomeTab);
      }
    }
  } finally {
    const active = await evaluate(`document.querySelector(${JSON.stringify(modeSelector)})?.getAttribute('aria-label') ?? ''`);
    if (!active.includes(originalMode)) {
      await openMenuBySelector(modeSelector);
      await clickVisibleMenuItem(originalMode);
      const restoredModeDeadline = Date.now() + 15_000;
      do {
        const restored = await evaluate(`document.querySelector(${JSON.stringify(modeSelector)})?.getAttribute('aria-label') ?? ''`);
        if (restored.includes(originalMode)) break;
        if (Date.now() >= restoredModeDeadline) throw new Error(`Timed out restoring ${originalMode} mode`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } while (true);
    }
  }
  checkpoints.push({ name: 'app/mode-switch-restored', originalMode, alternateMode });

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
    preservePointer: true,
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
    // Meetings is account/feature-flag gated and is absent for some signed-in users.
    { label: 'Meetings', name: 'meetings', readyText: 'Connect Google Calendar', text: ['Connect Google Calendar'], minimumInteractive: 2, optional: true },
    { label: '站点', name: 'sites', readyText: '“站点”使用前须知', text: ['创建并发布网站时', '继续'], minimumInteractive: 3 },
    { label: 'Pull Request', name: 'pull-requests', readyText: '搜索 Pull Request', text: ['全部', '正在审查', '由我创建'], minimumInteractive: 6, compact: true },
    { label: '定时任务', name: 'automations', readyText: '搜索已安排任务', text: ['全部', '已开启', '已暂停', '已完成'], minimumInteractive: 7, compact: true },
    { label: '插件', name: 'plugins', readyText: '热门', text: ['已安装', '公开', '个人'], minimumInteractive: 10, compact: true },
  ];
  const visibleExploreLabels = await evaluate(`
    [...document.querySelectorAll('[role="menuitem"]')].map((element) => element.innerText?.trim()).filter(Boolean)
  `);
  const knownExploreLabels = new Set([...explorePages.map((page) => page.label), '自定义']);
  const uncoveredExploreLabels = visibleExploreLabels.filter((label) => !knownExploreLabels.has(label));
  if (uncoveredExploreLabels.length > 0) {
    throw new Error(`Visible Explore routes lack E2E coverage: ${uncoveredExploreLabels.join(', ')}`);
  }
  checkpoints.push({
    name: 'app/explore-navigation-coverage',
    covered: visibleExploreLabels,
  });
  if (visibleExploreLabels.includes('自定义')) {
    await clickText('自定义');
    await waitForSelectorGone('[role="menu"]');
    await waitForBodyText('调整活动的顺序');
    await assertReversibleListControl({ itemText: 'Pull Request', role: 'checkbox' });
    await assertVisualPage('app/explore-customize', {
      text: ['自定义', '完成', '调整活动的顺序', '调整项目的顺序'],
      minimumInteractive: 8,
      allowHorizontalOverflow: true,
    });
    await clickText('完成');
    await waitForBodyText('新对话');
    await openExploreMenu();
  }
  const enabledExplorePages = explorePages.filter((page) => !page.optional || visibleExploreLabels.includes(page.label));
  for (const [pageIndex, page] of enabledExplorePages.entries()) {
    await clickText(page.label);
    await waitForSelectorGone('[role="menu"]');
    await waitForBodyText(page.readyText, 30_000);
    if (page.name === 'meetings') {
      await waitForBodyText(['No meeting notes found', "Couldn't load meetings"], 60_000);
    }
    await waitForSettingsPageToSettle();
    await assertVisualPage(`app/${page.name}`, {
      text: [page.label, ...page.text],
      forbidden: page.name === 'meetings' ? ['Loading meetings', '正在加载会议'] : [],
      minimumInteractive: page.minimumInteractive,
      allowHorizontalOverflow: true,
    });
    if (page.compact) {
      await assertCompactVisualPage(`app/${page.name}`, {
        text: [page.label, ...page.text],
        minimumInteractive: Math.max(5, page.minimumInteractive - 2),
        allowHorizontalOverflow: true,
      });
    }
    await navigateToChat(page.name);
    if (pageIndex < enabledExplorePages.length - 1) await openExploreMenu();
  }

  const projectsPageAvailable = await evaluate(`(() => {
    const target = [...document.querySelectorAll('nav button')].find((button) => button.innerText?.trim() === '项目');
    if (target == null) return false;
    if (target.hasAttribute('data-app-action-sidebar-section-toggle')) return false;
    target.click();
    return true;
  })()`);
  if (projectsPageAvailable) {
    await waitForBodyText('搜索项目', 30_000);
    await assertVisualPage('app/projects', {
      text: ['项目', '搜索项目', '名称', '已更新'],
      minimumInteractive: 10,
    });
    await assertCompactVisualPage('app/projects', {
      text: ['项目', '搜索项目', '名称', '已更新'],
      minimumInteractive: 8,
    });
  }

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
  if (activityLabel != null) {
    await clickAriaWithMouse(activityLabel);
    await waitForBodyText('优先级', 30_000);
    await assertVisualPage('app/activity', {
      text: ['活动', '优先级', '未读'],
      minimumInteractive: 8,
    });
  }
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
  await assertCompactVisualPage('conversation/history', {
    text: [conversationTitle],
    minimumInteractive: 8,
    // The collapsed release summary remains translated off-canvas here too.
    allowHorizontalOverflow: true,
  }, { width: 1100, height: 720 });

  await evaluate(`(() => {
    const button = document.querySelector('[aria-label="添加文件等内容"]');
    if (button == null) throw new Error('Add-context button not found');
    button.click();
  })()`);
  await waitForBodyText('Control the in-app browser');
  await assertVisualPage('conversation/add-context', {
    text: ['文件和文件夹', 'Control the in-app browser'],
    textRootSelector: '[role="menu"]',
    minimumInteractive: 8,
    allowHorizontalOverflow: true,
  });
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });

  console.log(JSON.stringify({ mode, screenshotDirectory, checkpoints: checkpoints.map(({ name }) => name) }, null, 2));
} else if (mode === "settings-interactions") {
  const interactionScreenshotDirectory = process.env.CODEX_E2E_SCREENSHOT_DIR ?? "/tmp/codex-packaged-e2e/screenshots";
  fs.mkdirSync(interactionScreenshotDirectory, { recursive: true });
  const captureInteractionScreenshot = async (name) => {
    const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const screenshotPath = path.join(interactionScreenshotDirectory, `${name.replaceAll('/', '-')}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    return screenshotPath;
  };
  const waitUntil = async (description, predicate, timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    do {
      const value = await predicate();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    throw new Error(`Timed out waiting for ${description}`);
  };
  const clickText = (text) => evaluate(`(() => {
    const target = [...document.querySelectorAll('button, a, [role="button"], [role="menuitem"]')].find((element) =>
      element.getAttribute('aria-label') === ${JSON.stringify(text)} ||
      element.innerText?.trim() === ${JSON.stringify(text)} ||
      element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(text)}
    );
    if (target == null) throw new Error(${JSON.stringify("No clickable element: ")} + ${JSON.stringify(text)});
    target.click();
    return true;
  })()`);
  const clickTextWithMouse = async (text) => {
    const point = await evaluate(`(() => {
      const target = [...document.querySelectorAll('button, a, [role="button"], [role="menuitem"]')].find((element) =>
        element.getAttribute('aria-label') === ${JSON.stringify(text)} ||
        element.innerText?.trim() === ${JSON.stringify(text)} ||
        element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(text)}
      );
      if (target == null) throw new Error(${JSON.stringify("No mouse-clickable element: ")} + ${JSON.stringify(text)});
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, hit: hit?.outerHTML?.slice(0, 300) ?? null };
    })()`);
    const coordinates = { x: point.x, y: point.y };
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...coordinates });
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...coordinates });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...coordinates });
    return point;
  };
  const openMenuWithMouse = async (text) => {
    const attempts = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const open = await evaluate(`
        [...document.querySelectorAll('button[aria-haspopup="menu"]')].some((element) =>
          element.innerText?.trim() === ${JSON.stringify(text)} && element.getAttribute('aria-expanded') === 'true'
        )
      `);
      if (open) return;
      attempts.push(await clickTextWithMouse(text));
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    throw new Error(`Menu did not open after real mouse retries: ${text}; ${JSON.stringify(attempts)}`);
  };
  if (!(await evaluate(`document.querySelector('#settings-search') != null`))) {
    const profileMenuLabel = await evaluate(`
      document.querySelector('[aria-label="打开个人资料菜单"]') != null ? '打开个人资料菜单' :
      document.querySelector('[aria-label="Open profile menu"]') != null ? 'Open profile menu' : null
    `);
    if (profileMenuLabel == null) throw new Error('Profile menu button not found');
    await clickTextWithMouse(profileMenuLabel);
    await waitUntil("settings menu item", () => evaluate(`
      [...document.querySelectorAll('button, [role="menuitem"]')].some((element) =>
        element.innerText?.trim() === '设置' || element.innerText?.trim().split('\\n')[0] === '设置'
      )
    `));
    await clickText("设置");
  }
  await waitUntil("settings shell", () => evaluate(`document.querySelector('#settings-search') != null`));
  await evaluate(`(() => {
    const input = document.querySelector('#settings-search');
    if (input.value === '') return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
  })()`);
  await waitUntil("settings search reset", () => evaluate(`document.querySelector('#settings-search')?.value === ''`));
  await clickText("常规");
  await waitUntil("general settings controls", () => evaluate(`document.querySelector('[aria-label="纯文本编辑器"]') != null`));
  protocolEvents.length = 0;
  const assertNoInteractionException = async (step) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const exceptions = protocolEvents.filter((event) => event.method === "Runtime.exceptionThrown").map(protocolEventDetails);
    if (exceptions.length > 0) throw new Error(`Renderer exceptions after ${step}: ${JSON.stringify(exceptions)}`);
  };

  const switchLabels = ["在菜单栏中显示 ChatGPT", "运行时防止系统休眠", "纯文本编辑器"];
  const initialSwitchStates = new Map();
  const readSwitch = (label) => evaluate(`document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]')?.getAttribute('aria-checked') ?? null`);
  const toggleSwitch = (label) => evaluate(`(() => {
    const target = document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]');
    if (target == null) throw new Error(${JSON.stringify("Switch not found: ")} + ${JSON.stringify(label)});
    target.click();
    return true;
  })()`);
  const restored = [];
  const deepChecks = [];
  const assertReversibleCurrentSwitch = async (label, description) => {
    await waitUntil(`${label} switch to be present`, () => evaluate(`
      document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]') != null
    `));
    const initial = await evaluate(`(() => {
      const target = document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]');
      if (target == null) throw new Error(${JSON.stringify("Switch not found: ")} + ${JSON.stringify(label)});
      const state = target.getAttribute('aria-checked');
      target.click();
      return state;
    })()`);
    if (!['true', 'false'].includes(initial)) throw new Error(`Switch has no boolean state: ${label}=${initial}`);
    try {
      await waitUntil(`${label} to change`, async () => (await readSwitch(label)) !== initial);
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    } finally {
      await waitUntil(`${label} switch to remain present`, () => evaluate(`
        document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]') != null
      `));
      if ((await readSwitch(label)) !== initial) await toggleSwitch(label);
      await waitUntil(`${label} to restore`, async () => (await readSwitch(label)) === initial);
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      if ((await readSwitch(label)) !== initial) throw new Error(`${label} did not remain restored after settling`);
    }
    deepChecks.push(description);
    await assertNoInteractionException(description);
  };
  const assertPopupOpensAndCloses = async (buttonText, description) => {
    await clickTextWithMouse(buttonText);
    await waitUntil(`${buttonText} popup to open`, () => evaluate(`
      [...document.querySelectorAll('button[aria-haspopup]')].some((element) =>
        element.innerText?.trim() === ${JSON.stringify(buttonText)} && element.getAttribute('aria-expanded') === 'true'
      ) && document.querySelector('[role="menu"], [role="listbox"]') != null
    `));
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await waitUntil(`${buttonText} popup to close`, () => evaluate(`
      ![...document.querySelectorAll('button[aria-haspopup]')].some((element) =>
        element.innerText?.trim() === ${JSON.stringify(buttonText)} && element.getAttribute('aria-expanded') === 'true'
      )
    `));
    deepChecks.push(description);
    await assertNoInteractionException(description);
  };
  try {
    for (const label of switchLabels) {
      const initial = await readSwitch(label);
      if (!['true', 'false'].includes(initial)) throw new Error(`Switch has no boolean state: ${label}=${initial}`);
      initialSwitchStates.set(label, initial);
      await toggleSwitch(label);
      await waitUntil(`${label} to change`, async () => (await readSwitch(label)) !== initial);
      await toggleSwitch(label);
      await waitUntil(`${label} to restore`, async () => (await readSwitch(label)) === initial);
      restored.push(label);
      await assertNoInteractionException(`restoring ${label}`);
    }

    const searchInput = await evaluate(`document.querySelector('#settings-search') != null`);
    if (!searchInput) throw new Error('Settings search input disappeared');
    await evaluate(`(() => {
      const input = document.querySelector('#settings-search');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '浏览器');
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '浏览器' }));
    })()`);
    await waitUntil("browser settings search result", () => evaluate(`
      document.querySelector('#settings-search')?.value === '浏览器' &&
      [...document.querySelectorAll('[data-list-navigation-item="true"]')].some((element) =>
        (element.getAttribute('aria-label') ?? element.innerText ?? '').includes('浏览器')
      )
    `));
    await evaluate(`(() => {
      const input = document.querySelector('#settings-search');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '');
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
    })()`);
    await waitUntil("settings search to clear", () => evaluate(`document.querySelector('#settings-search')?.value === ''`));
    await assertNoInteractionException("settings search");
    // The search-results layer exits with a transition after the input clears.
    // Wait for it to stop intercepting the real pointer used by the menu test.
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    await openMenuWithMouse("按 Enter 键");
    await waitUntil("send shortcut menu", () => evaluate(`
      [...document.querySelectorAll('button[aria-haspopup="menu"]')].some((element) =>
        element.innerText?.trim() === '按 Enter 键' && element.getAttribute('aria-expanded') === 'true'
      ) && (document.body?.innerText ?? '').includes('总是使用 ⌘ + Enter')
    `));
    await clickTextWithMouse("外观");
    await waitUntil("appearance settings after open menu navigation", () => evaluate(`
      document.querySelector('[aria-label="主题"]') != null ||
      (document.body?.innerText ?? '').includes('强调色')
    `));
    await assertNoInteractionException("open menu route navigation");
    await clickText("常规");
    await waitUntil("general settings after route regression", () => evaluate(`
      document.querySelector('[aria-label="纯文本编辑器"]') != null
    `));

    await clickText("个性化");
    await waitUntil("Codex instructions editor", () => evaluate(`
      document.querySelector('textarea#personal-agents-editor:not([disabled])') != null
    `));
    const originalCodexInstructions = await evaluate(`document.querySelector('textarea#personal-agents-editor')?.value ?? null`);
    if (originalCodexInstructions == null) throw new Error('Codex instructions value is unavailable');
    const codexInstructionsProbe = `${originalCodexInstructions}${originalCodexInstructions ? '\n' : ''}[temporary e2e personalization probe]`;
    const setCodexInstructions = (value) => evaluate(`(() => {
      const textarea = document.querySelector('textarea#personal-agents-editor');
      if (!(textarea instanceof HTMLTextAreaElement)) throw new Error('Codex instructions editor not found');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, ${JSON.stringify(value)});
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null }));
      return textarea.value;
    })()`);
    const findCodexInstructionsSave = () => evaluate(`(() => {
      const textarea = document.querySelector('textarea#personal-agents-editor');
      if (textarea == null) return null;
      for (let ancestor = textarea.parentElement; ancestor != null; ancestor = ancestor.parentElement) {
        const buttons = [...ancestor.querySelectorAll('button')]
          .filter((button) => button.innerText?.trim() === '保存');
        if (buttons.length === 1) return { disabled: buttons[0].disabled };
      }
      return null;
    })()`);
    const clickCodexInstructionsSave = () => evaluate(`(() => {
      const textarea = document.querySelector('textarea#personal-agents-editor');
      if (textarea == null) throw new Error('Codex instructions editor not found');
      for (let ancestor = textarea.parentElement; ancestor != null; ancestor = ancestor.parentElement) {
        const buttons = [...ancestor.querySelectorAll('button')]
          .filter((button) => button.innerText?.trim() === '保存');
        if (buttons.length === 1) {
          if (buttons[0].disabled) throw new Error('Codex instructions save is disabled');
          buttons[0].click();
          return true;
        }
      }
      throw new Error('Codex instructions save button not found');
    })()`);
    try {
      await setCodexInstructions(codexInstructionsProbe);
      await waitUntil("Codex instructions save enabled", async () => (await findCodexInstructionsSave())?.disabled === false);
      await clickCodexInstructionsSave();
      await waitUntil("Codex instructions probe saved", async () =>
        (await findCodexInstructionsSave())?.disabled === true &&
        await evaluate(`document.querySelector('textarea#personal-agents-editor')?.value === ${JSON.stringify(codexInstructionsProbe)}`)
      );
      await clickText("外观");
      await waitUntil("appearance during Codex instructions remount", () => evaluate(`
        document.querySelector('[aria-label="使用指针光标"]') != null
      `));
      await clickText("个性化");
      await waitUntil("persisted Codex instructions probe", () => evaluate(`
        document.querySelector('textarea#personal-agents-editor')?.value === ${JSON.stringify(codexInstructionsProbe)}
      `));
      deepChecks.push("Codex instructions save persistence across remount");
    } finally {
      await waitUntil("Codex instructions editor for restore", () => evaluate(`
        document.querySelector('textarea#personal-agents-editor:not([disabled])') != null
      `));
      if (await evaluate(`document.querySelector('textarea#personal-agents-editor')?.value !== ${JSON.stringify(originalCodexInstructions)}`)) {
        await setCodexInstructions(originalCodexInstructions);
        await waitUntil("Codex instructions restore save enabled", async () => (await findCodexInstructionsSave())?.disabled === false);
        await clickCodexInstructionsSave();
        await waitUntil("Codex instructions restored", async () =>
          (await findCodexInstructionsSave())?.disabled === true &&
          await evaluate(`document.querySelector('textarea#personal-agents-editor')?.value === ${JSON.stringify(originalCodexInstructions)}`)
        );
      }
    }
    await assertNoInteractionException("restoring Codex instructions");

    await clickText("外观");
    await waitUntil("appearance controls", () => evaluate(`
      document.querySelector('[role="switch"][aria-label="使用指针光标"]') != null &&
      document.querySelector('input[type="radio"][aria-label="浅色"]') != null
    `));
    for (const label of ["使用指针光标", "字体平滑"]) {
      const initial = await readSwitch(label);
      if (!['true', 'false'].includes(initial)) throw new Error(`Appearance switch has no boolean state: ${label}=${initial}`);
      await toggleSwitch(label);
      await waitUntil(`${label} appearance change`, async () => (await readSwitch(label)) !== initial);
      await toggleSwitch(label);
      await waitUntil(`${label} appearance restore`, async () => (await readSwitch(label)) === initial);
      deepChecks.push(`appearance switch: ${label}`);
      await assertNoInteractionException(`restoring appearance switch ${label}`);
    }
    const themeResult = await evaluate(`(() => {
      const radios = [...document.querySelectorAll('input[type="radio"][aria-label]')]
        .filter((element) => ['系统', '浅色', '深色'].includes(element.getAttribute('aria-label')));
      const initial = radios.find((element) => element.checked);
      const dark = radios.find((element) => element.getAttribute('aria-label') === '深色');
      if (initial == null || dark == null) throw new Error('Theme radio state is incomplete');
      const result = { initial: initial.getAttribute('aria-label'), target: '深色' };
      if (!dark.checked) dark.click();
      return result;
    })()`);
    try {
      await waitUntil("dark theme selection", () => evaluate(`
        document.querySelector('input[type="radio"][aria-label="深色"]')?.checked === true
      `));
      await new Promise((resolve) => setTimeout(resolve, 500));
      const darkSurface = await evaluate(`(() => {
        const parse = (color) => color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/)?.slice(1).map(Number) ?? null;
        const elements = [document.documentElement, document.body, document.querySelector('main'), document.querySelector('[data-settings-page]')].filter(Boolean);
        const colors = elements.map((element) => getComputedStyle(element).backgroundColor).map(parse).filter(Boolean);
        return { colors, hasDarkSurface: colors.some(([red, green, blue]) => (red + green + blue) / 3 < 96) };
      })()`);
      if (!darkSurface.hasDarkSurface) throw new Error(`Dark theme did not produce a dark surface: ${JSON.stringify(darkSurface.colors)}`);
      const darkScreenshotPath = await captureInteractionScreenshot('settings/appearance-dark');
      deepChecks.push(`appearance dark theme visual: ${darkScreenshotPath}`);
    } finally {
      if (themeResult.initial !== '深色') {
        await evaluate(`document.querySelector('input[type="radio"][aria-label=${JSON.stringify(themeResult.initial)}]')?.click()`);
        await waitUntil("theme selection restore", () => evaluate(`
          document.querySelector('input[type="radio"][aria-label=${JSON.stringify(themeResult.initial)}]')?.checked === true
        `));
      }
    }
    await waitUntil("theme selection stable", () => evaluate(`
      document.querySelector('input[type="radio"][aria-label=${JSON.stringify(themeResult.initial)}]')?.checked === true
    `));
    deepChecks.push(`appearance theme: ${themeResult.initial} -> ${themeResult.target} -> ${themeResult.initial}`);
    await assertNoInteractionException("restoring theme selection");

    await clickText("浏览器");
    await waitUntil("browser settings controls", () => evaluate(`
      document.querySelector('[role="switch"][aria-label="下载前询问保存位置"]') != null
    `));
    {
      const label = "下载前询问保存位置";
      const initial = await readSwitch(label);
      await toggleSwitch(label);
      await waitUntil(`${label} browser change`, async () => (await readSwitch(label)) !== initial);
      await toggleSwitch(label);
      await waitUntil(`${label} browser restore`, async () => (await readSwitch(label)) === initial);
      deepChecks.push(`browser switch: ${label}`);
      await assertNoInteractionException(`restoring browser switch ${label}`);
    }

    await clickText("语音");
    await waitUntil("voice controls", () => evaluate(`
      [...document.querySelectorAll('button[aria-haspopup]')].some((element) => element.innerText?.trim() === '系统默认') &&
      document.querySelector('[role="switch"][aria-label="为语音聊天启用屏幕上下文"]') != null
    `));
    await assertPopupOpensAndCloses("系统默认", "voice microphone popup");

    await clickText("电脑操控");
    await waitUntil("computer-use controls", () => evaluate(`
      document.querySelector('[role="switch"][aria-label="显示或隐藏 @Chrome 浏览器引用"]') != null
    `));
    await assertReversibleCurrentSwitch("显示或隐藏 @Chrome 浏览器引用", "computer-use Chrome visibility switch");

    await clickText("应用快照");
    await waitUntil("appshot controls", () => evaluate(`
      document.querySelector('[role="switch"][aria-label="播放 Appshot 音效"]') != null
    `));
    await assertReversibleCurrentSwitch("播放 Appshot 音效", "Appshot sound switch");

    await clickText("钩子");
    await waitUntil("hooks reload control", () => evaluate(`document.querySelector('button[aria-label="重新加载钩子"]') != null`));
    await evaluate(`document.querySelector('button[aria-label="重新加载钩子"]')?.click()`);
    await waitUntil("hooks reload completion", () => evaluate(`
      document.querySelector('button[aria-label="重新加载钩子"]') != null &&
      !document.querySelector('button[aria-label="重新加载钩子"]').disabled
    `));
    deepChecks.push("hooks reload");
    await assertNoInteractionException("hooks reload");

    await clickText("计算机历史记录");
    await waitUntil("computer history carousel", () => evaluate(`document.querySelector('button[aria-label="下一示例"]') != null`));
    await evaluate(`document.querySelector('button[aria-label="下一示例"]')?.click()`);
    await assertNoInteractionException("computer history carousel");
    deepChecks.push("computer history carousel");

    await clickText("使用情况和计费");
    await waitUntil("usage analytics tab", () => evaluate(`
      [...document.querySelectorAll('[role="tab"]')].some((element) => element.innerText?.trim() === '分析')
    `), 60_000);
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find((element) => element.innerText?.trim() === '分析'))?.click()`);
    await waitUntil("usage analytics content", () => evaluate(`(document.body?.innerText ?? '').includes('总用量历史记录')`), 60_000);
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find((element) => element.innerText?.trim() === 'Overview'))?.click()`);
    await waitUntil("usage overview restore", () => evaluate(`(document.body?.innerText ?? '').includes('当前套餐')`), 60_000);
    deepChecks.push("usage analytics tab");
    await assertNoInteractionException("usage analytics tab");

    await clickText("Git");
    await waitUntil("Git settings controls", () => evaluate(`
      document.querySelector('input[aria-label="分支前缀"]') != null &&
      document.querySelector('textarea[aria-label="提交指令"]') != null
    `));
    const gitOriginal = await evaluate(`(() => ({
      branchPrefix: document.querySelector('input[aria-label="分支前缀"]').value,
      commitInstructions: document.querySelector('textarea[aria-label="提交指令"]').value,
    }))()`);
    const gitProbe = {
      branchPrefix: `${gitOriginal.branchPrefix}e2e-probe/`,
      commitInstructions: `${gitOriginal.commitInstructions}${gitOriginal.commitInstructions ? '\n' : ''}[temporary e2e probe]`,
    };
    const setGitField = (selector, value) => evaluate(`(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (target == null) throw new Error('Git field not found: ' + ${JSON.stringify(selector)});
      target.focus();
      const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(target, ${JSON.stringify(value)});
      target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.blur();
      return true;
    })()`);
    try {
      await setGitField('input[aria-label="分支前缀"]', gitProbe.branchPrefix);
      await setGitField('textarea[aria-label="提交指令"]', gitProbe.commitInstructions);
      await waitUntil("Git probe values", () => evaluate(`
        document.querySelector('input[aria-label="分支前缀"]')?.value === ${JSON.stringify(gitProbe.branchPrefix)} &&
        document.querySelector('textarea[aria-label="提交指令"]')?.value === ${JSON.stringify(gitProbe.commitInstructions)}
      `));
      // Instruction textareas auto-save after 3 seconds; the branch prefix saves on blur.
      await new Promise((resolve) => setTimeout(resolve, 3_750));
      await clickText("外观");
      await waitUntil("appearance during Git remount", () => evaluate(`document.querySelector('[aria-label="使用指针光标"]') != null`));
      await clickText("Git");
      await waitUntil("persisted Git probe values", () => evaluate(`
        document.querySelector('input[aria-label="分支前缀"]')?.value === ${JSON.stringify(gitProbe.branchPrefix)} &&
        document.querySelector('textarea[aria-label="提交指令"]')?.value === ${JSON.stringify(gitProbe.commitInstructions)}
      `));
      deepChecks.push("Git input persistence across remount");
    } finally {
      await setGitField('input[aria-label="分支前缀"]', gitOriginal.branchPrefix);
      await setGitField('textarea[aria-label="提交指令"]', gitOriginal.commitInstructions);
      await waitUntil("Git fields restore", () => evaluate(`
        document.querySelector('input[aria-label="分支前缀"]')?.value === ${JSON.stringify(gitOriginal.branchPrefix)} &&
        document.querySelector('textarea[aria-label="提交指令"]')?.value === ${JSON.stringify(gitOriginal.commitInstructions)}
      `));
      await new Promise((resolve) => setTimeout(resolve, 3_750));
    }
    await assertNoInteractionException("restoring Git settings");

    await clickText("连接");
    await waitUntil("connection settings tabs", () => evaluate(`
      [...document.querySelectorAll('button')].some((element) => element.innerText?.trim() === 'SSH')
    `));
    await clickText("SSH");
    await waitUntil("SSH add button", () => evaluate(`
      [...document.querySelectorAll('button')].some((element) => element.innerText?.trim() === '添加')
    `));
    await clickText("添加");
    await waitUntil("SSH discovery dialog", () => evaluate(`document.querySelector('[role="dialog"]') != null`));
    try {
      const selectableHost = await evaluate(`(() => {
        const checkbox = [...document.querySelectorAll('[role="dialog"] [role="checkbox"][aria-label^="选择"]')]
          .find((element) => element.getAttribute('aria-checked') === 'false');
        if (checkbox == null) return null;
        return checkbox.getAttribute('aria-label');
      })()`);
      if (selectableHost != null) {
        await evaluate(`document.querySelector('[role="checkbox"][aria-label=${JSON.stringify(selectableHost)}]')?.click()`);
        await waitUntil("SSH host selection", () => evaluate(`
          document.querySelector('[role="checkbox"][aria-label=${JSON.stringify(selectableHost)}]')?.getAttribute('aria-checked') === 'true'
        `));
        await waitUntil("SSH add enabled", () => evaluate(`
          [...document.querySelectorAll('[role="dialog"] button[type="submit"]')]
            .some((element) => element.innerText?.trim() === '添加' && !element.disabled)
        `));
        await evaluate(`document.querySelector('[role="checkbox"][aria-label=${JSON.stringify(selectableHost)}]')?.click()`);
        await waitUntil("SSH host selection restore", () => evaluate(`
          document.querySelector('[role="checkbox"][aria-label=${JSON.stringify(selectableHost)}]')?.getAttribute('aria-checked') === 'false'
        `));
        deepChecks.push(`SSH discovery selection: ${selectableHost}`);
      }
    } finally {
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
      await waitUntil("SSH dialog close", () => evaluate(`document.querySelector('[role="dialog"]') == null`));
    }
    await assertNoInteractionException("SSH discovery dialog interaction");

    await clickText("键盘快捷键");
    await waitUntil("keyboard shortcut search", () => evaluate(`
      document.querySelector('input[placeholder="搜索快捷键"]') != null
    `));
    const setInputValue = (selector, value) => evaluate(`(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!(input instanceof HTMLInputElement)) throw new Error('Input not found: ' + ${JSON.stringify(selector)});
      input.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: ${JSON.stringify(value.length === 0 ? "deleteContentBackward" : "insertText")},
        data: ${JSON.stringify(value.length === 0 ? null : value)},
      }));
      return input.value;
    })()`);
    await setInputValue('input[placeholder="搜索快捷键"]', '归档聊天');
    await waitUntil("filtered keyboard shortcut", () => evaluate(`(() => {
      const input = document.querySelector('input[placeholder="搜索快捷键"]');
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return input?.value === '归档聊天' && [...document.querySelectorAll('div, p, span')]
        .some((element) => element.childElementCount === 0 && element.innerText?.trim() === '归档聊天' && visible(element));
    })()`));
    await setInputValue('input[placeholder="搜索快捷键"]', '');
    await waitUntil("keyboard shortcut search restore", () => evaluate(`
      document.querySelector('input[placeholder="搜索快捷键"]')?.value === ''
    `));
    deepChecks.push("keyboard shortcut filtering");
    await assertNoInteractionException("keyboard shortcut filtering");

    await clickText("插件");
    await waitUntil("plugin settings tabs", () => evaluate(`
      ['插件', '应用', 'MCP', '技能'].every((label) =>
        [...document.querySelectorAll('button')].some((button) =>
          new RegExp('^' + label + '\\\\s+\\\\d+$').test(button.innerText?.trim() ?? '')
        )
      )
    `));
    for (const tab of [
      { label: '应用', placeholder: '搜索应用' },
      { label: 'MCP', placeholder: '搜索 MCP 服务器' },
      { label: '技能', placeholder: '搜索技能' },
      { label: '插件', placeholder: '搜索插件' },
    ]) {
      await evaluate(`(() => {
        const button = [...document.querySelectorAll('button')]
          .find((element) => new RegExp('^' + ${JSON.stringify(tab.label)} + '\\\\s+\\\\d+$')
            .test(element.innerText?.trim() ?? ''));
        if (button == null) throw new Error('Plugin tab not found: ' + ${JSON.stringify(tab.label)});
        button.click();
      })()`);
      await waitUntil(`${tab.label} plugin tab`, () => evaluate(`
        document.querySelector('input[placeholder=${JSON.stringify(tab.placeholder)}]') != null
      `));
    }
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')]
        .find((element) => /^应用\\s+\\d+$/.test(element.innerText?.trim() ?? ''));
      button?.click();
    })()`);
    await waitUntil("apps plugin search", () => evaluate(`document.querySelector('input[placeholder="搜索应用"]') != null`));
    await setInputValue('input[placeholder="搜索应用"]', 'GitHub');
    await waitUntil("filtered plugin app", () => evaluate(`
      document.querySelector('input[placeholder="搜索应用"]')?.value === 'GitHub' &&
      (document.body?.innerText ?? '').includes('GitHub')
    `));
    await setInputValue('input[placeholder="搜索应用"]', '');
    await waitUntil("plugin app search restore", () => evaluate(`
      document.querySelector('input[placeholder="搜索应用"]')?.value === ''
    `));
    deepChecks.push("plugin tabs and app filtering");
    await assertNoInteractionException("plugin tabs and app filtering");

    await clickText("Worktrees");
    await waitUntil("Worktrees controls", () => evaluate(`
      document.querySelector('[role="switch"][aria-label="创建工作树前始终获取上游更新"]') != null &&
      document.querySelector('button[aria-label="刷新"]') != null
    `));
    {
      const label = "创建工作树前始终获取上游更新";
      const initial = await readSwitch(label);
      await toggleSwitch(label);
      await waitUntil(`${label} worktree change`, async () => (await readSwitch(label)) !== initial);
      await waitUntil(`${label} worktree save`, () => evaluate(`
        document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]')?.disabled === false
      `));
      await toggleSwitch(label);
      await waitUntil(`${label} worktree restore`, async () => (await readSwitch(label)) === initial);
      await waitUntil(`${label} worktree restore save`, () => evaluate(`
        document.querySelector('[role="switch"][aria-label=${JSON.stringify(label)}]')?.disabled === false
      `));
      deepChecks.push(`Worktrees switch: ${label}`);
    }
    await evaluate(`document.querySelector('button[aria-label="刷新"]')?.click()`);
    await waitUntil("Worktrees refresh completion", () => evaluate(`
      document.querySelector('button[aria-label="刷新"]') != null &&
      !document.querySelector('button[aria-label="刷新"]').disabled
    `));
    deepChecks.push("Worktrees refresh");
    await assertNoInteractionException("Worktrees settings interaction");
  } finally {
    if (initialSwitchStates.size > 0 && await evaluate(`document.querySelector('[aria-label="常规"]') != null`)) {
      await clickText("常规");
      await waitUntil("general settings for emergency restore", () => evaluate(`
        document.querySelector('[aria-label="纯文本编辑器"]') != null
      `));
    }
    for (const [label, initial] of initialSwitchStates) {
      if ((await readSwitch(label)) !== initial) {
        await toggleSwitch(label);
        await waitUntil(`${label} emergency restore`, async () => (await readSwitch(label)) === initial);
      }
    }
  }
  const exceptions = protocolEvents.filter((event) => event.method === "Runtime.exceptionThrown").map(protocolEventDetails);
  if (exceptions.length > 0) throw new Error(`Renderer exceptions during settings interactions: ${JSON.stringify(exceptions)}`);
  console.log(JSON.stringify({ mode, restored, deepChecks, search: "passed", menu: "passed", exceptions }, null, 2));
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
  await new Promise((resolve) => setTimeout(resolve, 200));
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
    target.scrollIntoView({ block: 'center', inline: 'nearest' });
    const rect = target.getBoundingClientRect();
    return {
      ariaLabel: target.getAttribute('aria-label'),
      tagName: target.tagName,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  })()`);
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: result.x, y: result.y });
  await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: result.x, y: result.y });
  await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: result.x, y: result.y });
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
  const details = protocolEvents.map(protocolEventDetails);
  const exceptions = details.filter((event) => event.method === "Runtime.exceptionThrown");
  const errors = details.filter((event) =>
    event.method === "Log.entryAdded" ? event.level === "error" : event.method === "Runtime.consoleAPICalled" && event.type === "error"
  );
  const warnings = details.filter((event) =>
    event.method === "Log.entryAdded" ? event.level === "warning" : event.method === "Runtime.consoleAPICalled" && event.type === "warning"
  );
  const warningSummary = [...new Set(warnings.map((event) => event.text))];
  console.log(JSON.stringify({ mode, exceptions, errors, warningCount: warnings.length, warningSummary }, null, 2));
  if (exceptions.length > 0 || errors.length > 0) {
    throw new Error(`Renderer runtime errors detected: ${JSON.stringify({ exceptions, errors })}`);
  }
} else if (mode === "dump-overlays") {
  console.log(JSON.stringify(await evaluate(`(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    return [...document.querySelectorAll('[role="menu"], [role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          controls: [...element.querySelectorAll('button, a, [role="menuitem"], [role="option"], [role="radio"]')]
            .filter(visible)
            .map((control) => ({ ariaLabel: control.getAttribute('aria-label'), role: control.getAttribute('role'), text: control.innerText?.trim() ?? '' })),
          rect: { height: rect.height, width: rect.width, x: rect.x, y: rect.y },
          role: element.getAttribute('role'),
          text: element.innerText?.trim() ?? '',
        };
      });
  })()`), null, 2));
} else if (mode === "inspect") {
  console.log(JSON.stringify(await composerState(), null, 2));
} else if (mode === "dump-controls") {
  console.log(JSON.stringify(await evaluate(`(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    return [...document.querySelectorAll('button, input, textarea, select, [role="switch"], [role="tab"], [role="combobox"]')]
      .filter(visible)
      .map((element) => ({
        ariaChecked: element.getAttribute('aria-checked'),
        ariaLabel: element.getAttribute('aria-label'),
        ariaPressed: element.getAttribute('aria-pressed'),
        dataState: element.getAttribute('data-state'),
        disabled: element.matches(':disabled, [aria-disabled="true"]'),
        role: element.getAttribute('role'),
        tagName: element.tagName,
        text: element.innerText?.trim().slice(0, 160) ?? '',
        type: element.getAttribute('type'),
        value: 'value' in element ? element.value : null,
      }));
  })()`), null, 2));
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
