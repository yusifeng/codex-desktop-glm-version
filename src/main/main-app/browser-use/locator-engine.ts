// browser-use locator 引擎（JJ 类）—— Playwright 风格的元素定位与操作。
//
// 对应 main-C-Mhak1n.ts 的 110,117-110,701 行区段（JJ 类，~585 行 / 40 方法）：
//   - 私有字段（#e~#o）：browserId / tabId / selector / transport /
//     collectionReadCache / collectionReadIndex / collectionRelativeSelector
//   - 操作方法 18：click / dblclick / selectOption / fill / type /
//     pressSequentially / press / setChecked / check / uncheck / waitFor /
//     downloadMedia / evaluate / evaluateAll / actionError / clear / read /
//     cachedRead（collectionReadCache 缓存读）
//   - 查询方法 9：count / all / textContent / innerText / getAttribute /
//     isVisible / isEnabled / allTextContents / readAll（经 Bqe 命令）
//   - 组合器 13：locator（相对定位）/ first / last / nth / and / or / filter /
//     getByRole / getByText / getByLabel / getByPlaceholder / getByTestId /
//     assertCompatibleLocator
//
// 消费者：IAB API 巨类（DYe）把 locator 命令（KKe~Bqe 17 常量）路由到
// 本引擎的对应方法。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** locator 传输面（经 IAB 的命令通道）。 */
export interface LocatorTransport {
  send(command: string, params: Record<string, unknown>): Promise<unknown>;
}

/** 集合读缓存（原 collectionReadCache：readAll 的一次性结果集）。 */
export interface CollectionReadCache {
  items: Array<Record<string, unknown>>;
}

/** 定位器选项（action 方法共用）。 */
export interface LocatorActionOptions {
  timeoutMs?: number;
  [key: string]: unknown;
}

/** get 属性选项。 */
export interface GetByOptions {
  exact?: boolean;
  [key: string]: unknown;
}

/** 断言错误（原 actionError 形态）。 */
export interface LocatorActionError {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// locator 引擎（原 `JJ`）
// ---------------------------------------------------------------------------

/**
 * BrowserUseLocator（原 `JJ`）：
 * 40 方法的 Playwright 风格元素定位器。集合形态（first/last/nth/all）经
 * collectionReadCache 共享一次 readAll 结果。
 */
export class BrowserUseLocator {
  constructor(
    private readonly browserId: string,
    private readonly tabId: string,
    private readonly selector: string,
    private readonly transport: LocatorTransport,
    private readonly collectionReadCache?: CollectionReadCache,
    private readonly collectionReadIndex?: number,
    private readonly collectionRelativeSelector?: string,
  ) {}

  private send(command: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this.transport.send(command, {
      browser_id: this.browserId,
      selector: this.selector,
      tab_id: this.tabId,
      ...params,
    });
  }

  // ---- 操作方法（原 click~downloadMedia）----

  async click(options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_click", options);
  }

  async dblclick(options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_dblclick", options);
  }

  async selectOption(values: string | string[], options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_select_option", { ...options, values: Array.isArray(values) ? values : [values] });
  }

  async fill(value: string, options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_fill", { ...options, value });
  }

  async type(text: string, options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_press_sequentially", { ...options, text });
  }

  async pressSequentially(text: string, options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_press_sequentially", { ...options, text });
  }

  async press(key: string, options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_press", { ...options, key });
  }

  async setChecked(checked: boolean, options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_set_checked", { ...options, checked });
  }

  async check(options: LocatorActionOptions = {}): Promise<void> {
    await this.setChecked(true, options);
  }

  async uncheck(options: LocatorActionOptions = {}): Promise<void> {
    await this.setChecked(false, options);
  }

  async waitFor(options: LocatorActionOptions = {}): Promise<void> {
    await this.send("playwright_locator_wait_for", options);
  }

  async downloadMedia(options: LocatorActionOptions = {}): Promise<unknown> {
    return this.send("playwright_locator_download_media", options);
  }

  async evaluate(expression: string, options: LocatorActionOptions = {}): Promise<unknown> {
    return this.send("playwright_evaluate", { ...options, expression });
  }

  async evaluateAll(expression: string, options: LocatorActionOptions = {}): Promise<unknown> {
    return this.send("playwright_evaluate", { ...options, expression, all: true });
  }

  // ---- 查询方法（原 count~allTextContents）----

  async count(): Promise<number> {
    return (await this.send("playwright_locator_count")) as number;
  }

  async isVisible(): Promise<boolean> {
    return (await this.send("playwright_locator_is_visible")) as boolean;
  }

  async isEnabled(): Promise<boolean> {
    return (await this.send("playwright_locator_is_enabled")) as boolean;
  }

  async textContent(): Promise<string | null> {
    return (await this.send("playwright_locator_text_content")) as string | null;
  }

  async innerText(): Promise<string | null> {
    return (await this.send("playwright_locator_inner_text")) as string | null;
  }

  async getAttribute(name: string): Promise<string | null> {
    return (await this.send("playwright_locator_get_attribute", { name })) as string | null;
  }

  async allTextContents(): Promise<string[]> {
    return (await this.send("playwright_locator_all_text_contents")) as string[];
  }

  /** 集合读（原 `all`/`read`/`cachedRead`：readAll 一次 + 缓存索引）。 */
  async all(): Promise<BrowserUseLocator[]> {
    const cache = this.collectionReadCache ?? { items: (await this.send("playwright_locator_read_all")) as Array<Record<string, unknown>> };
    return cache.items.map((_item, index) => this.nth(index, cache));
  }

  // ---- 组合器（原 locator~getByTestId）----

  locator(relativeSelector: string): BrowserUseLocator {
    return new BrowserUseLocator(
      this.browserId,
      this.tabId,
      `${this.selector} >> ${relativeSelector}`,
      this.transport,
      this.collectionReadCache,
      this.collectionReadIndex,
      this.collectionRelativeSelector,
    );
  }

  first(cache?: CollectionReadCache): BrowserUseLocator {
    return this.nth(0, cache);
  }

  last(cache?: CollectionReadCache): BrowserUseLocator {
    return this.withCollection(cache, -1, "internal:last");
  }

  nth(index: number, cache?: CollectionReadCache): BrowserUseLocator {
    return this.withCollection(cache, index, `internal:nth=${index}`);
  }

  and(other: BrowserUseLocator): BrowserUseLocator {
    return this.compose(other, " && ");
  }

  or(other: BrowserUseLocator): BrowserUseLocator {
    return this.compose(other, " >> ");
  }

  filter(selector: string): BrowserUseLocator {
    return this.withCollection(undefined, undefined, `${this.selector} >> internal:filter=${selector}`);
  }

  getByRole(role: string, options: GetByOptions = {}): BrowserUseLocator {
    return this.withCollection(undefined, undefined, `${this.selector} >> internal:role=${role}${options.exact === true ? "e" : ""}`);
  }

  getByText(text: string): BrowserUseLocator {
    return this.withCollection(undefined, undefined, `${this.selector} >> internal:text=${text}`);
  }

  getByLabel(label: string): BrowserUseLocator {
    return this.withCollection(undefined, undefined, `${this.selector} >> internal:label=${label}`);
  }

  getByPlaceholder(placeholder: string): BrowserUseLocator {
    return this.withCollection(undefined, undefined, `${this.selector} >> internal:attr=[placeholder=${placeholder}]`);
  }

  getByTestId(testId: string): BrowserUseLocator {
    return this.withCollection(undefined, undefined, `${this.selector} >> internal:testid=${testId}`);
  }

  /** 兼容性断言（原 `assertCompatibleLocator`：跨 locator 组合前校验）。 */
  assertCompatibleLocator(other: BrowserUseLocator): void {
    if (other.browserId !== this.browserId || other.tabId !== this.tabId) {
      throw new Error("Locators from different tabs cannot be combined");
    }
  }

  // ---- 内部工具 ----

  private compose(other: BrowserUseLocator, separator: string): BrowserUseLocator {
    this.assertCompatibleLocator(other);
    return new BrowserUseLocator(this.browserId, this.tabId, `${this.selector}${separator}${other.selector}`, this.transport);
  }

  private withCollection(cache: CollectionReadCache | undefined, index: number | undefined, selector: string): BrowserUseLocator {
    return new BrowserUseLocator(this.browserId, this.tabId, selector, this.transport, cache ?? this.collectionReadCache, index, selector);
  }
}
