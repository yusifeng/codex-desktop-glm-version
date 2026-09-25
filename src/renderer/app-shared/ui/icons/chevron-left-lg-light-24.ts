// 图标资产：chevron-left-lg-light-24
//（原 app-shared 内部压缩名 tEt，懒初始化器 nEt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_left_lg_light_24 = createIconPreset({
      name: `chevron-left-lg-light-24`,
      canvas: {
        width: 24,
        height: 24,
        viewBox: `0 0 24 24`,
        frame: { x: 0, y: 0, width: 24, height: 24 },
        inkBounds: { x: 6.207275, y: 3.75, width: 8.792725, height: 16.5 },
        visualBounds: { x: 6.207275, y: 3.75, width: 8.792725, height: 16.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 6.207275, y: 3.75, width: 8.792725, height: 16.5 },
        center: { x: 10.603638, y: 12 },
        insets: { top: 3.75, right: 9, bottom: 3.75, left: 6.207275 },
        anchors: {
          frame: { x: 12, y: 12 },
          ink: { x: 10.603638, y: 12 },
          foreground: { x: 10.603638, y: 12 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M14.7804 18.9697C15.0733 19.2626 15.0733 19.7373 14.7804 20.0302C14.4875 20.3231 14.0127 20.3231 13.7198 20.0302L6.57335 12.8837C6.08525 12.3956 6.08525 11.6043 6.57335 11.1162L13.7198 3.96967C14.0127 3.67678 14.4875 3.67678 14.7804 3.96967C15.0733 4.26256 15.0733 4.73732 14.7804 5.03022L7.81066 11.9999L14.7804 18.9697Z" fill="currentColor"/>`
    });
