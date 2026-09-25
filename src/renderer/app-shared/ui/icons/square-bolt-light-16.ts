// 图标资产：square-bolt-light-16
//（原 app-shared 内部压缩名 sbt，懒初始化器 cbt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_square_bolt_light_16 = createIconPreset({
      name: `square-bolt-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 1.807983, y: 1.807861, width: 12.383789, height: 12.383789 },
        visualBounds: { x: 1.807983, y: 1.807861, width: 12.383789, height: 12.383789 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.807983, y: 1.807861, width: 12.383789, height: 12.383789 },
        center: { x: 7.999878, y: 7.999756 },
        insets: { top: 1.807861, right: 1.808228, bottom: 1.80835, left: 1.807983 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 7.999878, y: 7.999756 },
          foreground: { x: 7.999878, y: 7.999756 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M8.3783 4.45532C8.76263 3.99972 9.49973 4.37297 9.35974 4.95239L8.96423 6.58521H10.5834C11.0632 6.58567 11.3238 7.1466 11.015 7.51392L7.62146 11.5432C7.23711 11.9996 6.49943 11.626 6.64001 11.0461L7.0365 9.41431H5.41736C4.93699 9.41428 4.67531 8.85207 4.98474 8.48462L8.3783 4.45532Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.683 1.80786C13.0683 1.80786 14.1918 2.93134 14.1918 4.31665V11.6829C14.1918 13.0682 13.0683 14.1917 11.683 14.1917H4.31677C2.93146 14.1917 1.80798 13.0682 1.80798 11.6829V4.31665C1.80798 2.93134 2.93146 1.80786 4.31677 1.80786H11.683ZM4.31677 2.85864C3.51136 2.85864 2.85876 3.51124 2.85876 4.31665V11.6829C2.85876 12.4883 3.51136 13.1418 4.31677 13.1418H11.683C12.4884 13.1418 13.142 12.4883 13.142 11.6829V4.31665C13.142 3.51124 12.4884 2.85864 11.683 2.85864H4.31677Z" fill="currentColor"/>`
    });
