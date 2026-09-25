// 图标资产：text-format-light-20
//（原 app-shared 内部压缩名 C6e，懒初始化器 w6e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_text_format_light_20 = createIconPreset({
      name: `text-format-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 3.501953, y: 3.50293, width: 12.99707, height: 12.99707 },
        visualBounds: { x: 3.501953, y: 3.50293, width: 12.99707, height: 12.99707 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3.501953, y: 3.50293, width: 12.99707, height: 12.99707 },
        center: { x: 10.000488, y: 10.001465 },
        insets: { top: 3.50293, right: 3.500977, bottom: 3.5, left: 3.501953 },
        anchors: {
          frame: { x: 10, y: 10 },
          ink: { x: 10.000488, y: 10.001465 },
          foreground: { x: 10.000488, y: 10.001465 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M15.417 3.50293C16.0144 3.50293 16.499 3.98757 16.499 4.58496V5.83496C16.4988 6.20197 16.201 6.49982 15.834 6.5C15.4668 6.5 15.1691 6.20208 15.1689 5.83496V4.83301H10.665V15.1689H12.5C12.8673 15.1689 13.165 15.4667 13.165 15.834C13.165 16.2013 12.8673 16.499 12.5 16.499H10.0098C10.0065 16.4991 10.0033 16.5 10 16.5C9.99674 16.5 9.99349 16.4991 9.99023 16.499H7.5C7.13273 16.499 6.83496 16.2013 6.83496 15.834C6.83496 15.4667 7.13273 15.1689 7.5 15.1689H9.33496V4.83301H4.83203V5.83496C4.83186 6.20208 4.53415 6.5 4.16699 6.5C3.79983 6.5 3.50213 6.20208 3.50195 5.83496V4.58496C3.50195 3.98757 3.9866 3.50293 4.58398 3.50293H15.417Z" fill="currentColor"/>`
    });
