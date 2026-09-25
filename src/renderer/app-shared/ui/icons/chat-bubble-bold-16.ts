// 图标资产：chat-bubble-bold-16
//（原 app-shared 内部压缩名 Bgt，懒初始化器 Vgt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chat_bubble_bold_16 = createIconPreset({
      name: `chat-bubble-bold-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 1.099609, y: 1.432983, width: 13.800781, height: 13.133789 },
        visualBounds: { x: 1.099609, y: 1.432983, width: 13.800781, height: 13.133789 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.099609, y: 1.432983, width: 13.800781, height: 13.133789 },
        center: { x: 8, y: 7.999878 },
        insets: { top: 1.432983, right: 1.09961, bottom: 1.433228, left: 1.099609 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8, y: 7.999878 },
          foreground: { x: 8, y: 7.999878 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M13.0996 8.00037C13.0996 5.41558 10.8658 3.23376 8 3.23376C5.13419 3.23376 2.90039 5.41558 2.90039 8.00037C2.90048 9.02457 3.29914 9.68461 3.88574 10.8461C3.99319 11.0588 4.02433 11.3025 3.97266 11.5355L3.8418 12.1244L4.53125 11.9457C4.73879 11.8919 4.95622 11.9042 5.15332 11.9779L5.23633 12.014L5.59473 12.1791C6.41918 12.5454 7.16351 12.767 8 12.767C10.8657 12.767 13.0994 10.585 13.0996 8.00037ZM14.9004 8.00037C14.9002 11.6747 11.7615 14.5668 8 14.5668C6.75713 14.5668 5.70824 14.2095 4.71777 13.7562L3.08105 14.181C2.334 14.3745 1.64644 13.7108 1.81348 12.9574L2.1543 11.4144C1.66341 10.4639 1.0997 9.42605 1.09961 8.00037C1.09961 4.32592 4.23839 1.43298 8 1.43298C11.7616 1.43298 14.9004 4.32592 14.9004 8.00037Z" fill="currentColor"/>`
    });
