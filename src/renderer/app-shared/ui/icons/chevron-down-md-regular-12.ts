// 图标资产：chevron-down-md-regular-12
//（原 app-shared 内部压缩名 rDt，懒初始化器 iDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_down_md_regular_12 = createIconPreset({
      name: `chevron-down-md-regular-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 2.5, y: 4.5, width: 7, height: 3.896484 },
        visualBounds: { x: 2.5, y: 4.5, width: 7, height: 3.896484 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.5, y: 4.5, width: 7, height: 3.896484 },
        center: { x: 6, y: 6.448242 },
        insets: { top: 4.5, right: 2.5, bottom: 3.603516, left: 2.5 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 6, y: 6.448242 },
          foreground: { x: 6, y: 6.448242 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M8.64645 4.64645C8.84171 4.45118 9.15822 4.45118 9.35348 4.64645C9.54874 4.84171 9.54874 5.15822 9.35348 5.35348L6.53024 8.17672C6.23735 8.46959 5.76258 8.46959 5.46969 8.17672L2.64645 5.35348C2.45118 5.15822 2.45118 4.84171 2.64645 4.64645C2.84171 4.45118 3.15822 4.45118 3.35348 4.64645L5.99996 7.29293L8.64645 4.64645Z" fill="currentColor"/>`
    });
