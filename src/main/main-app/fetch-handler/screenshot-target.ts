// 截图目标计算：viewportFrame（渲染坐标）→ 屏幕 destinationFrame + 所在显示器。
//
// 对应 main-C-Mhak1n.ts 97,880-97,916：
//   - FBe：zoomFactor 缩放 + 内容区偏移 + getDisplayMatching → codexDisplay
//     （bounds/workArea/scaleFactor）+ 目标框/背景/圆角/文字色
//   - IBe/LBe：尺寸合法性（圆角 ≥0、宽高 >0）
//   - ZH：Electron 矩形 → {height,width,x,y} 规范形状
//
// 模块加载期副作用：无。

import { BrowserWindow, screen } from "electron";

/** Electron 矩形。 */
export interface ElectronRectangle {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** 截图目标（原 `FBe` 返回值）。 */
export interface ScreenshotTarget {
  codexDisplay: {
    bounds: ElectronRectangle;
    id: number;
    scaleFactor: number;
    workArea: ElectronRectangle;
  };
  destinationBackgroundColor: unknown;
  destinationCornerRadius: number;
  destinationFrame: { x: number; y: number; width: number; height: number };
  destinationPrimaryTextColor: unknown;
  presentationStyle: unknown;
}

/** 矩形规范化（原 `ZH`）。 */
function toRectangle(rectangle: ElectronRectangle): ElectronRectangle {
  return { height: rectangle.height, width: rectangle.width, x: rectangle.x, y: rectangle.y };
}

/**
 * 截图目标计算（原 `FBe`）：
 * viewportFrame 按 zoomFactor 缩放并叠加窗口内容区偏移后，匹配所在显示器。
 * 窗口已销毁或尺寸非法时返回 undefined。
 */
export function computeScreenshotTarget({
  backgroundColor,
  cornerRadius,
  presentationStyle,
  primaryTextColor,
  viewportFrame,
  webContents,
}: {
  backgroundColor: unknown;
  cornerRadius: number;
  presentationStyle: unknown;
  primaryTextColor: unknown;
  viewportFrame: { width: number; height: number; x: number; y: number };
  webContents: Electron.WebContents;
}): ScreenshotTarget | undefined {
  if (!(viewportFrame.width > 0 && viewportFrame.height > 0) || !(cornerRadius >= 0)) return undefined;
  const window = BrowserWindow.fromWebContents(webContents);
  if (window == null || window.isDestroyed()) return undefined;
  const zoomFactor = webContents.getZoomFactor();
  const contentBounds = window.getContentBounds();
  const destinationFrame = {
    x: contentBounds.x + viewportFrame.x * zoomFactor,
    y: contentBounds.y + viewportFrame.y * zoomFactor,
    width: viewportFrame.width * zoomFactor,
    height: viewportFrame.height * zoomFactor,
  };
  const display = screen.getDisplayMatching(destinationFrame);
  return {
    codexDisplay: {
      bounds: toRectangle(display.bounds),
      id: display.id,
      scaleFactor: display.scaleFactor,
      workArea: toRectangle(display.workArea),
    },
    destinationBackgroundColor: backgroundColor,
    destinationCornerRadius: cornerRadius * zoomFactor,
    destinationFrame,
    destinationPrimaryTextColor: primaryTextColor,
    presentationStyle,
  };
}
