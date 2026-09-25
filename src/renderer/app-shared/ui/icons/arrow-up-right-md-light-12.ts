// 图标资产：arrow-up-right-md-light-12
//（原 app-shared 内部压缩名 NQe，懒初始化器 PQe；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_arrow_up_right_md_light_12 = createIconPreset({
      name: `arrow-up-right-md-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 3.117188, y: 3.586426, width: 5.319336, height: 5.303711 },
        visualBounds: { x: 3.117188, y: 3.586426, width: 5.319336, height: 5.303711 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3.117188, y: 3.586426, width: 5.319336, height: 5.303711 },
        center: { x: 5.776856, y: 6.238281 },
        insets: { top: 3.586426, right: 3.563476, bottom: 3.109863, left: 3.117188 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 5.776856, y: 6.238281 },
          foreground: { x: 5.776856, y: 6.238281 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M7.93644 3.58643L8.03605 3.59717C8.23163 3.63704 8.38583 3.79124 8.4257 3.98682L8.43644 4.08643V7.52295C8.43623 7.74354 8.25665 7.92215 8.03605 7.92236C7.81519 7.92231 7.63566 7.74285 7.63566 7.52197V4.93799L3.8007 8.77295C3.64451 8.92911 3.3905 8.92909 3.2343 8.77295C3.07817 8.61674 3.07814 8.36273 3.2343 8.20654L7.05363 4.38721H4.5009C4.28005 4.38721 4.10062 4.20764 4.10051 3.98682C4.10072 3.76619 4.27928 3.58658 4.49992 3.58643H7.93644Z" fill="currentColor"/>`
    });
