// 图标资产：minus-md-regular-16
//（原 app-shared 内部压缩名 _Dt，懒初始化器 vDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_minus_md_regular_16 = createIconPreset({
      name: `minus-md-regular-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 2.25, y: 7.25, width: 11.5, height: 1.5 },
        visualBounds: { x: 2.25, y: 7.25, width: 11.5, height: 1.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.25, y: 7.25, width: 11.5, height: 1.5 },
        center: { x: 8, y: 8 },
        insets: { top: 7.25, right: 2.25, bottom: 7.25, left: 2.25 },
        anchors: { frame: { x: 8, y: 8 }, ink: { x: 8, y: 8 }, foreground: { x: 8, y: 8 } }
      },
      capabilities: [`icon`],
      body: `<path d="M13 8.75H3C2.58579 8.75 2.25 8.41421 2.25 8C2.25 7.58579 2.58579 7.25 3 7.25H13C13.4142 7.25 13.75 7.58579 13.75 8C13.75 8.41421 13.4142 8.75 13 8.75Z" fill="currentColor"/>`
    });
