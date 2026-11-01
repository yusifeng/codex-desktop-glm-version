#!/usr/bin/env node
// Read-only CDP probe for the locally rebuilt Electron renderer. This gives
// E2E diagnostics even when macOS accessibility automation intentionally
// refuses to bind to the ChatGPT/Codex application bundle.

const endpoint = process.env.CODEX_RENDERER_DEBUG_ENDPOINT ?? "http://127.0.0.1:9223";
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = pages.find((candidate) => candidate.type === "page" && candidate.url === "app://-/index.html");
if (page == null) throw new Error(`No app://-/index.html renderer at ${endpoint}`);

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const diagnostics = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id == null) {
    if (message.method === "Runtime.exceptionThrown") {
      diagnostics.push({
        method: message.method,
        text: message.params.exceptionDetails?.text,
        description: message.params.exceptionDetails?.exception?.description,
        stackTrace: message.params.exceptionDetails?.stackTrace,
      });
    } else if (message.method === "Log.entryAdded" && message.params.entry.level !== "verbose") {
      diagnostics.push({ method: message.method, ...message.params.entry });
    } else if (message.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(message.params.type)) {
      diagnostics.push({
        method: message.method,
        type: message.params.type,
        args: message.params.args.map((argument) => argument.value ?? argument.description),
        stackTrace: message.params.stackTrace,
      });
    }
    return;
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

await command("Runtime.enable");
await command("Log.enable");
if (process.argv.includes("--reload")) {
  await command("Page.enable");
  await command("Page.reload", { ignoreCache: true });
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
const expression = `(() => ({
  title: document.title,
  url: location.href,
  readyState: document.readyState,
  bodyText: document.body?.innerText?.slice(0, 12000) ?? "",
  bodyHtml: document.body?.innerHTML?.slice(0, 12000) ?? "",
  activeElement: document.activeElement == null ? null : {
    tagName: document.activeElement.tagName,
    ariaLabel: document.activeElement.getAttribute("aria-label"),
    placeholder: document.activeElement.getAttribute("placeholder"),
  },
  editableElements: [...document.querySelectorAll('textarea, input, [contenteditable="true"]')].map((element, index) => ({
    index,
    tagName: element.tagName,
    ariaLabel: element.getAttribute("aria-label"),
    placeholder: element.getAttribute("placeholder"),
    text: "value" in element ? element.value : element.textContent,
  })),
  conversationSurface: (() => {
    const selectors = [
      '[data-thread-find-target]',
      '[data-virtualized-turn-content]',
      '[data-content-search-unit-key]',
      '[data-conversation-block="assistant-message"]',
      '[data-conversation-block="user-message"]',
      '[data-turn-unit-type]',
      '[data-turn-activity]',
      '[data-local-conversation-turn-body]',
      '[data-turn-id]',
      '[data-turn-key]',
      '[data-local-conversation-page]',
      '[data-local-conversation-thread]',
      '[data-local-conversation-thread-container]',
      '[data-local-conversation-body]',
    ];
    const report = {};
    for (const selector of selectors) {
      report[selector] = [...document.querySelectorAll(selector)].map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: typeof element.className === 'string' ? element.className : '',
          text: element.textContent?.slice(0, 500) ?? '',
          html: element.outerHTML.slice(0, 1000),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      });
    }
    return report;
  })(),
  composerControls: (() => {
    const editable = document.querySelector('[contenteditable="true"][aria-label="随心输入"], textarea, input');
    const ancestors = [];
    for (let element = editable; element != null && ancestors.length < 10; element = element.parentElement) {
      ancestors.push({
        tagName: element.tagName,
        id: element.id,
        className: typeof element.className === 'string' ? element.className : '',
        dataAttributes: Object.fromEntries([...element.attributes].filter((attribute) => attribute.name.startsWith('data-')).map((attribute) => [attribute.name, attribute.value])),
        buttonCount: element.querySelectorAll('button').length,
      });
    }
    const container = editable?.closest('form, [data-composer-body]') ?? [...(editable?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.children ?? [])].find((element) => element.querySelector?.('[contenteditable="true"]')) ?? editable?.parentElement?.parentElement?.parentElement;
    return container == null ? null : {
      ancestors,
      html: container.outerHTML.slice(0, 16000),
      buttons: [...container.querySelectorAll('button')].map((button, index) => ({
        index,
        ariaLabel: button.getAttribute('aria-label'),
        text: button.innerText,
        disabled: button.disabled,
        type: button.type,
      })),
    };
  })(),
}))()`;
const result = await command("Runtime.evaluate", {
  expression,
  awaitPromise: true,
  returnByValue: true,
});
if (result.exceptionDetails != null) {
  console.error(JSON.stringify(result.exceptionDetails, null, 2));
  process.exitCode = 1;
}
console.log(JSON.stringify(result.result.value, null, 2));
if (diagnostics.length > 0) {
  console.log("\nRenderer diagnostics:");
  console.log(JSON.stringify(diagnostics, null, 2));
}
socket.close();
