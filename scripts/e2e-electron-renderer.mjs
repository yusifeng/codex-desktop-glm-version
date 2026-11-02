#!/usr/bin/env node
// Focused CDP driver for the final local Electron smoke test. Keeping the
// mutation modes explicit prevents an inspection run from accidentally
// submitting a message through the user's signed-in account.

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
        document.querySelector('[aria-label="打开个人资料菜单"], [aria-label="Open profile menu"]') != null
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
  const assertHealthy = async (name) => {
    const bodyText = await evaluate(`document.body?.innerText ?? ''`);
    const recoveryText = ['ChatGPT hit a snag', 'ChatGPT 遇到了问题', 'Something went wrong. Try again to continue', '出了点问题。请重试以继续'];
    if (recoveryText.some((text) => bodyText.includes(text))) throw new Error(`${name} entered the recovery error boundary`);
    checkpoints.push({ name, bodyTail: bodyText.slice(-1200) });
  };

  await waitForAppReady();
  if (!(await evaluate(`document.querySelector('#settings-search') != null`))) {
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

  await clickText('Git');
  await waitForBodyText(['分支前缀', 'Branch prefix']);
  await assertHealthy('settings/git');

  await clickText('Worktrees');
  await waitForBodyText(['工作树根目录', 'Worktree root']);
  await assertHealthy('settings/worktrees');

  await clickText('浏览器');
  await waitForBodyText(['In-app browser', '管理你的 Browser Use']);
  await assertHealthy('settings/browser');

  if (await evaluate(`document.querySelector('nav[aria-label="应用导航"]') != null`)) {
    await evaluate(`(() => {
      const target = [...document.querySelector('nav[aria-label="应用导航"]').querySelectorAll('button')].find((button) =>
        button.innerText?.trim() === '聊天'
      );
      if (target == null) throw new Error('Chat navigation button not found');
      target.click();
    })()`);
  } else {
    await clickText('返回应用');
  }
  await waitForBodyText('新对话');
  await clickText(conversationTitle);
  await waitForSelector('[data-local-conversation-page]');
  await waitForSelector('[data-conversation-block="assistant-message"]');
  await assertHealthy('conversation/history');

  await evaluate(`(() => {
    const button = document.querySelector('[aria-label="添加文件等内容"]');
    if (button == null) throw new Error('Add-context button not found');
    button.click();
  })()`);
  await waitForBodyText('Control the in-app browser');
  await assertHealthy('conversation/add-context');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });

  console.log(JSON.stringify({ mode, checkpoints: checkpoints.map(({ name }) => name) }, null, 2));
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
    assistantReply = assistantMessages.find((text) => text.replaceAll('\\', '').includes(normalizedMarker)) ??
      conversationUnits.find((text) => text.includes('ChatGPT 说：') && text.replaceAll('\\', '').includes(normalizedMarker)) ??
      null;
    if (assistantReply == null) await new Promise((resolve) => setTimeout(resolve, 500));
  } while (assistantReply == null && Date.now() < replyDeadline);
  if (assistantReply == null) throw new Error(`Timed out waiting for assistant reply marker: ${marker}; assistant messages=${JSON.stringify(assistantMessages.slice(-5))}; conversation units=${JSON.stringify(conversationUnits.slice(-5))}; body tail=${JSON.stringify(bodyText.slice(-2000))}`);

  const fatalEvents = protocolEvents.filter((event) => {
    const eventText = event.method === 'Log.entryAdded'
      ? event.params?.entry?.text ?? ''
      : (event.params?.args ?? []).map((value) => value.value ?? value.description ?? '').join(' ');
    if (/Statsig|cloudflare_challenge|DEPRECATED_ENDPOINT|ResizeObserver loop completed with undelivered notifications/u.test(eventText)) return false;
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method === 'Log.entryAdded') return event.params?.entry?.level === 'error';
    if (event.method !== 'Runtime.consoleAPICalled' || event.params?.type !== 'error') return false;
    return true;
  });
  if (fatalEvents.length > 0) {
    const details = fatalEvents.map((event) => event.method === 'Log.entryAdded'
      ? { text: event.params?.entry?.text ?? '', url: event.params?.entry?.url ?? '' }
      : { text: (event.params?.args ?? []).map((value) => value.value ?? value.description ?? '').join(' '), url: '' }
    ).slice(0, 10);
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
  const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
  const browserTargets = targets
    .filter((target) => target.type === "page" && target.url === requestedUrl)
    .map((target) => ({ title: target.title, type: target.type, url: target.url }));
  if (browserTargets.length === 0) throw new Error(`No browser target committed ${requestedUrl}`);
  console.log(JSON.stringify({
    mode,
    requestedUrl,
    address: state.address,
    browserTargets,
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
