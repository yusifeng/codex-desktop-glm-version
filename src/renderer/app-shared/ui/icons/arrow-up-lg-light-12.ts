// 图标资产：arrow-up-lg-light-12
//（原 app-shared 内部压缩名 ySt，懒初始化器 bSt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_arrow_up_lg_light_12 = createIconPreset({
      name: `arrow-up-lg-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 2.099854, y: 1.703125, width: 7.800537, height: 8.696777 },
        visualBounds: { x: 2.099854, y: 1.703125, width: 7.800537, height: 8.696777 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.099854, y: 1.703125, width: 7.800537, height: 8.696777 },
        center: { x: 6.000123, y: 6.051514 },
        insets: { top: 1.703125, right: 2.099609, bottom: 1.600098, left: 2.099854 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 6.000123, y: 6.051514 },
          foreground: { x: 6.000123, y: 6.051514 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M5.64268 1.81008C5.85884 1.66747 6.14137 1.66747 6.35753 1.81008L6.46007 1.89309L9.78331 5.21633C9.93927 5.37256 9.93943 5.62661 9.78331 5.78274C9.62716 5.93864 9.37306 5.93862 9.2169 5.78274L6.4005 2.96633V9.99953C6.40023 10.2202 6.22086 10.3999 6.0001 10.3999C5.77935 10.3999 5.59998 10.2202 5.59971 9.99953V2.96633L2.78331 5.78274C2.62716 5.93864 2.37306 5.93862 2.2169 5.78274C2.06076 5.6266 2.06091 5.37256 2.2169 5.21633L5.54014 1.89309L5.64268 1.81008Z" fill="currentColor"/>`
    });
