// 图标资产：chevron-down-lg-light-16
//（原 app-shared 内部压缩名 TTt，懒初始化器 ETt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_down_lg_light_16 = createIconPreset({
      name: `chevron-down-lg-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 2.475098, y: 5.725098, width: 11.049805, height: 5.911621 },
        visualBounds: { x: 2.475098, y: 5.725098, width: 11.049805, height: 5.911621 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.475098, y: 5.725098, width: 11.049805, height: 5.911621 },
        center: { x: 8, y: 8.680909 },
        insets: { top: 5.725098, right: 2.475097, bottom: 4.363281, left: 2.475098 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8, y: 8.680909 },
          foreground: { x: 8, y: 8.680909 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M12.6289 5.87887C12.8339 5.67384 13.166 5.67384 13.3711 5.87887C13.5761 6.08389 13.5761 6.41603 13.3711 6.62105L8.60641 11.3857C8.27129 11.7204 7.72863 11.7204 7.39352 11.3857L2.62887 6.62105C2.42384 6.41603 2.42384 6.08389 2.62887 5.87887C2.83389 5.67384 3.16603 5.67384 3.37105 5.87887L7.99996 10.5078L12.6289 5.87887Z" fill="currentColor"/>`
    });
