// 图标资产：ellipsis-horizontal-regular-24
//（原 app-shared 内部压缩名 dOt，懒初始化器 fOt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_ellipsis_horizontal_regular_24 = createIconPreset({
      name: `ellipsis-horizontal-regular-24`,
      canvas: {
        width: 24,
        height: 24,
        viewBox: `0 0 24 24`,
        frame: { x: 0, y: 0, width: 24, height: 24 },
        inkBounds: { x: 3, y: 10, width: 18, height: 4 },
        visualBounds: { x: 3, y: 10, width: 18, height: 4 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3, y: 10, width: 18, height: 4 },
        center: { x: 12, y: 12 },
        insets: { top: 10, right: 3, bottom: 10, left: 3 },
        anchors: { frame: { x: 12, y: 12 }, ink: { x: 12, y: 12 }, foreground: { x: 12, y: 12 } }
      },
      capabilities: [`icon`],
      body: `<path d="M5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12C3 10.8954 3.89543 10 5 10Z" fill="currentColor"/> <path d="M12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z" fill="currentColor"/> <path d="M19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12C17 10.8954 17.8954 10 19 10Z" fill="currentColor"/>`
    });
