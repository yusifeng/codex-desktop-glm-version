// 图标资产：text-format-light-16
//（原 app-shared 内部压缩名 x6e，懒初始化器 S6e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_text_format_light_16 = createIconPreset({
      name: `text-format-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 2.807617, y: 2.806641, width: 10.383789, height: 10.386719 },
        visualBounds: { x: 2.807617, y: 2.806641, width: 10.383789, height: 10.386719 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.807617, y: 2.806641, width: 10.383789, height: 10.386719 },
        center: { x: 7.999512, y: 8 },
        insets: { top: 2.806641, right: 2.808594, bottom: 2.80664, left: 2.807617 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 7.999512, y: 8 },
          foreground: { x: 7.999512, y: 8 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M12.333 2.80664C12.8069 2.80664 13.1912 3.19115 13.1914 3.66504V4.66504C13.1914 4.95499 12.956 5.19043 12.666 5.19043C12.3762 5.19025 12.1416 4.95488 12.1416 4.66504V3.85742H8.52539V12.1426H10C10.2899 12.1426 10.5254 12.378 10.5254 12.668C10.5254 12.9579 10.2899 13.1934 10 13.1934H6C5.71005 13.1934 5.47461 12.9579 5.47461 12.668C5.47461 12.378 5.71005 12.1426 6 12.1426H7.47461V3.85742H3.8584V4.66504C3.8584 4.95499 3.62296 5.19043 3.33301 5.19043C3.04306 5.19043 2.80762 4.95499 2.80762 4.66504V3.66504C2.80779 3.19125 3.19223 2.80682 3.66602 2.80664H12.333Z" fill="currentColor"/>`
    });
