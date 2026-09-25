// 图标资产：text-italic-sm-light-20
//（原 app-shared 内部压缩名 T6e，懒初始化器 E6e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_text_italic_sm_light_20 = createIconPreset({
      name: `text-italic-sm-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 6.400635, y: 4.748047, width: 7.199463, height: 10.5 },
        visualBounds: { x: 6.400635, y: 4.748047, width: 7.199463, height: 10.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 6.400635, y: 4.748047, width: 7.199463, height: 10.5 },
        center: { x: 10.000367, y: 9.998047 },
        insets: { top: 4.748047, right: 6.399902, bottom: 4.751953, left: 6.400635 },
        anchors: {
          frame: { x: 10, y: 10 },
          ink: { x: 10.000367, y: 9.998047 },
          foreground: { x: 10.000367, y: 9.998047 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M13.067 4.74805C13.3953 4.74825 13.6446 5.03845 13.5934 5.35742C13.5524 5.61269 13.3295 5.80159 13.067 5.80176H11.3551L11.3473 5.84277L9.84243 14.1953H11.3786C11.7095 14.1955 11.9595 14.4897 11.904 14.8105C11.8602 15.0629 11.6385 15.2479 11.3786 15.248H6.93325C6.60366 15.2479 6.35448 14.9557 6.40786 14.6357C6.45036 14.3821 6.67209 14.1954 6.93325 14.1953H8.64126L8.64907 14.1543L10.1432 5.86035L10.154 5.80176H8.62075C8.2911 5.80176 8.04114 5.50943 8.09438 5.18945C8.13677 4.9355 8.35937 4.74805 8.62075 4.74805H13.067Z" fill="currentColor"/>`
    });
