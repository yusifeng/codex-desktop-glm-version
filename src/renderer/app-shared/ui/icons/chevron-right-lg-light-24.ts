// 图标资产：chevron-right-lg-light-24
//（原 app-shared 内部压缩名 rEt，懒初始化器 iEt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_right_lg_light_24 = createIconPreset({
      name: `chevron-right-lg-light-24`,
      canvas: {
        width: 24,
        height: 24,
        viewBox: `0 0 24 24`,
        frame: { x: 0, y: 0, width: 24, height: 24 },
        inkBounds: { x: 8, y: 3.75, width: 8.792725, height: 16.5 },
        visualBounds: { x: 8, y: 3.75, width: 8.792725, height: 16.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 8, y: 3.75, width: 8.792725, height: 16.5 },
        center: { x: 12.396363, y: 12 },
        insets: { top: 3.75, right: 7.207275, bottom: 3.75, left: 8 },
        anchors: {
          frame: { x: 12, y: 12 },
          ink: { x: 12.396363, y: 12 },
          foreground: { x: 12.396363, y: 12 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M8.21967 18.9697C7.92678 19.2626 7.92678 19.7373 8.21967 20.0302C8.51256 20.3231 8.98732 20.3231 9.28022 20.0302L16.4267 12.8837C16.9148 12.3956 16.9148 11.6043 16.4267 11.1162L9.28022 3.96967C8.98732 3.67678 8.51256 3.67678 8.21967 3.96967C7.92678 4.26256 7.92678 4.73732 8.21967 5.03022L15.1894 11.9999L8.21967 18.9697Z" fill="currentColor"/>`
    });
