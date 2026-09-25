// 图标资产：chevron-right-lg-light-16
//（原 app-shared 内部压缩名 Ypt，懒初始化器 Xpt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_right_lg_light_16 = createIconPreset({
      name: `chevron-right-lg-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 5.475098, y: 2.475098, width: 5.911621, height: 11.049805 },
        visualBounds: { x: 5.475098, y: 2.475098, width: 5.911621, height: 11.049805 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 5.475098, y: 2.475098, width: 5.911621, height: 11.049805 },
        center: { x: 8.430909, y: 8 },
        insets: { top: 2.475098, right: 4.613281, bottom: 2.475097, left: 5.475098 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8.430909, y: 8 },
          foreground: { x: 8.430909, y: 8 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M5.62887 12.6289C5.42384 12.8339 5.42384 13.166 5.62887 13.3711C5.83389 13.5761 6.16603 13.5761 6.37105 13.3711L11.1357 8.60641C11.4704 8.27129 11.4704 7.72863 11.1357 7.39352L6.37105 2.62887C6.16603 2.42384 5.83389 2.42384 5.62887 2.62887C5.42384 2.83389 5.42384 3.16603 5.62887 3.37105L10.2578 7.99996L5.62887 12.6289Z" fill="currentColor"/>`
    });
