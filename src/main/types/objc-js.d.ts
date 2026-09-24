// objc-js —— 外部 CJS 包（avatar overlay 的 macOS nonactivating panel 桥）。
// 未随仓库携带类型声明，按消费面声明最小接口。
declare module "objc-js" {
  interface OjcNSWindow {
    respondsToSelector$(selector: string): boolean;
    _setPreventsActivation$(value: boolean): unknown;
    _setForceActiveControls$(value: boolean): unknown;
    setNativeGlassForcesActiveAppearance$(value: boolean): unknown;
    _sendForcedWindowChangedKeyState(): unknown;
    isKeyWindow(): boolean;
    resignKeyWindow(): unknown;
    makeKeyAndOrderFront$(value: unknown): unknown;
  }
  const objc: { fromPointer(handle: Buffer): { window(): OjcNSWindow } };
  export default objc;
}
