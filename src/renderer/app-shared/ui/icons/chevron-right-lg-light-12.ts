// 图标资产：chevron-right-lg-light-12
//（原 app-shared 内部压缩名 FCt，懒初始化器 ICt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_right_lg_light_12 = createIconPreset({
      name: `chevron-right-lg-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 4.224609, y: 1.849609, width: 4.447266, height: 8.300781 },
        visualBounds: { x: 4.224609, y: 1.849609, width: 4.447266, height: 8.300781 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 4.224609, y: 1.849609, width: 4.447266, height: 8.300781 },
        center: { x: 6.448242, y: 6 },
        insets: { top: 1.849609, right: 3.328125, bottom: 1.84961, left: 4.224609 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 6.448242, y: 6 },
          foreground: { x: 6.448242, y: 6 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M4.34177 9.46677C4.18556 9.62298 4.18556 9.87696 4.34177 10.0332C4.49798 10.1894 4.75196 10.1894 4.90817 10.0332L8.48142 6.45993C8.73523 6.20609 8.73523 5.79384 8.48142 5.54001L4.90817 1.96677C4.75196 1.81056 4.49798 1.81056 4.34177 1.96677C4.18556 2.12298 4.18556 2.37696 4.34177 2.53317L7.80856 5.99997L4.34177 9.46677Z" fill="currentColor"/>`
    });
