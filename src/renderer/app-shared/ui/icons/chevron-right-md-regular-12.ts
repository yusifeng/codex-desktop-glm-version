// 图标资产：chevron-right-md-regular-12
//（原 app-shared 内部压缩名 aDt，懒初始化器 oDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_right_md_regular_12 = createIconPreset({
      name: `chevron-right-md-regular-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 4, y: 2.5, width: 3.896484, height: 7 },
        visualBounds: { x: 4, y: 2.5, width: 3.896484, height: 7 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 4, y: 2.5, width: 3.896484, height: 7 },
        center: { x: 5.948242, y: 6 },
        insets: { top: 2.5, right: 4.103516, bottom: 2.5, left: 4 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 5.948242, y: 6 },
          foreground: { x: 5.948242, y: 6 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M4.14645 8.64645C3.95118 8.84171 3.95118 9.15822 4.14645 9.35348C4.34171 9.54874 4.65822 9.54874 4.85348 9.35348L7.67672 6.53024C7.96959 6.23735 7.96959 5.76258 7.67672 5.46969L4.85348 2.64645C4.65822 2.45118 4.34171 2.45118 4.14645 2.64645C3.95118 2.84171 3.95118 3.15822 4.14645 3.35348L6.79293 5.99996L4.14645 8.64645Z" fill="currentColor"/>`
    });
