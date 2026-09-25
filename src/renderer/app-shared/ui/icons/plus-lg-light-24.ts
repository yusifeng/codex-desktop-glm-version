// 图标资产：plus-lg-light-24
//（原 app-shared 内部压缩名 ZTt，懒初始化器 QTt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_plus_lg_light_24 = createIconPreset({
      name: `plus-lg-light-24`,
      canvas: {
        width: 24,
        height: 24,
        viewBox: `0 0 24 24`,
        frame: { x: 0, y: 0, width: 24, height: 24 },
        inkBounds: { x: 3.25, y: 3.25, width: 17.5, height: 17.5 },
        visualBounds: { x: 3.25, y: 3.25, width: 17.5, height: 17.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3.25, y: 3.25, width: 17.5, height: 17.5 },
        center: { x: 12, y: 12 },
        insets: { top: 3.25, right: 3.25, bottom: 3.25, left: 3.25 },
        anchors: { frame: { x: 12, y: 12 }, ink: { x: 12, y: 12 }, foreground: { x: 12, y: 12 } }
      },
      capabilities: [`icon`],
      body: `<path d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V11.25H20C20.4142 11.25 20.75 11.5858 20.75 12C20.75 12.4142 20.4142 12.75 20 12.75H12.75V20C12.75 20.4142 12.4142 20.75 12 20.75C11.5858 20.75 11.25 20.4142 11.25 20V12.75H4C3.58579 12.75 3.25 12.4142 3.25 12C3.25 11.5858 3.58579 11.25 4 11.25H11.25V4C11.25 3.58579 11.5858 3.25 12 3.25Z" fill="currentColor"/>`
    });
