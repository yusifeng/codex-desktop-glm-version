// 图标资产：spinner-quarter-graded-light-12
//（原 app-shared 内部压缩名 k3e，懒初始化器 A3e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_spinner_quarter_graded_light_12 = createIconPreset({
      name: `spinner-quarter-graded-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 1.152344, y: 1.152344, width: 9.709961, height: 9.709961 },
        visualBounds: { x: 1.152344, y: 1.152344, width: 9.709961, height: 9.709961 }
      },
      paint: {
        kind: `multicolor`,
        layers: [
          {
            role: `accent`,
            color: `#000000`,
            bounds: { x: 1.152344, y: 1.152344, width: 9.709961, height: 9.709961 },
            foundationToken: `black`,
            wideGamut: `color(display-p3 0.000000 0.000000 0.000000 / 1)`
          },
          {
            role: `foreground`,
            color: `currentColor`,
            bounds: { x: 5.407227, y: 1.152344, width: 5.454102, height: 5.454102 }
          }
        ]
      },
      optical: {
        shape: `circular`,
        bounds: { x: 1.152344, y: 1.152344, width: 9.709961, height: 9.709961 },
        center: { x: 6.007325, y: 6.007325 },
        insets: { top: 1.152344, right: 1.137695, bottom: 1.137695, left: 1.152344 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 6.007325, y: 6.007325 },
          foreground: { x: 8.134278, y: 3.879395 },
          accent: { x: 6.007325, y: 6.007325 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M9.66211 6.00684C9.66206 3.98829 8.02539 2.35156 6.00684 2.35156C3.98832 2.35161 2.35161 3.98832 2.35156 6.00684C2.35156 8.02539 3.98829 9.66206 6.00684 9.66211C8.02542 9.66211 9.66211 8.02542 9.66211 6.00684ZM10.8623 6.00684C10.8623 8.68816 8.68816 10.8623 6.00684 10.8623C3.32555 10.8623 1.15234 8.68813 1.15234 6.00684C1.15239 3.32558 3.32558 1.15239 6.00684 1.15234C8.68813 1.15234 10.8623 3.32555 10.8623 6.00684Z" fill="black" fill-opacity="0.12"/> <path d="M9.66211 6.00684C9.66206 3.98829 8.02539 2.35156 6.00684 2.35156C5.67547 2.35156 5.40723 2.08332 5.40723 1.75195C5.40723 1.42058 5.67547 1.15234 6.00684 1.15234C8.68813 1.15234 10.8613 3.32555 10.8613 6.00684C10.8613 6.33821 10.5931 6.60645 10.2617 6.60645C9.93039 6.6064 9.66211 6.33818 9.66211 6.00684Z" fill="currentColor"/>`
    });
