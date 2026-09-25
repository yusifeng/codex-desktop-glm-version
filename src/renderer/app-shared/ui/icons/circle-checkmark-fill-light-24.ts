// 图标资产：circle-checkmark-fill-light-24
//（原 app-shared 内部压缩名 xSt，懒初始化器 SSt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_circle_checkmark_fill_light_24 = createIconPreset({
      name: `circle-checkmark-fill-light-24`,
      canvas: {
        width: 24,
        height: 24,
        viewBox: `0 0 24 24`,
        frame: { x: 0, y: 0, width: 24, height: 24 },
        inkBounds: { x: 2.25, y: 2.25, width: 19.5, height: 19.5 },
        visualBounds: { x: 2.25, y: 2.25, width: 19.5, height: 19.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `circular`,
        bounds: { x: 2.25, y: 2.25, width: 19.5, height: 19.5 },
        center: { x: 12, y: 12 },
        insets: { top: 2.25, right: 2.25, bottom: 2.25, left: 2.25 },
        anchors: { frame: { x: 12, y: 12 }, ink: { x: 12, y: 12 }, foreground: { x: 12, y: 12 } }
      },
      capabilities: [`icon`],
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM15.8125 8.39648C15.4686 8.16591 15.0022 8.25786 14.7715 8.60156L10.9658 14.2764L9.15527 12.335C8.87279 12.0322 8.3976 12.0165 8.09473 12.2988C7.79211 12.5813 7.77544 13.0556 8.05762 13.3584L10.2998 15.7617C10.7393 16.2321 11.5027 16.1706 11.8613 15.6357L16.0176 9.4375C16.2479 9.09366 16.156 8.62722 15.8125 8.39648Z" fill="currentColor"/>`
    });
