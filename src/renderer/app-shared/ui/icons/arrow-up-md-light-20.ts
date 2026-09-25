// 图标资产：arrow-up-md-light-20
//（原 app-shared 内部压缩名 NT，懒初始化器 PT；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_arrow_up_md_light_20 = createIconPreset({
      name: `arrow-up-md-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 5.167969, y: 4.507813, width: 9.663818, height: 11.157227 },
        visualBounds: { x: 5.167969, y: 4.507813, width: 9.663818, height: 11.157227 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 5.167969, y: 4.507813, width: 9.663818, height: 11.157227 },
        center: { x: 9.999878, y: 10.086427 },
        insets: { top: 4.507813, right: 5.168213, bottom: 4.33496, left: 5.167969 },
        anchors: {
          frame: { x: 10, y: 10 },
          ink: { x: 9.999878, y: 10.086427 },
          foreground: { x: 9.999878, y: 10.086427 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M9.23459 4.82441C9.65687 4.40214 10.3424 4.40242 10.7649 4.82441L14.6369 8.69551C14.8966 8.95521 14.8966 9.37722 14.6369 9.63691C14.3773 9.89633 13.9562 9.89623 13.6965 9.63691L10.6653 6.60566V15.0002C10.6651 15.3673 10.3674 15.6652 10.0002 15.6652C9.63306 15.6652 9.33536 15.3673 9.33518 15.0002V6.60469L6.30393 9.63691C6.04423 9.8966 5.62222 9.89661 5.36252 9.63691C5.10325 9.37719 5.10298 8.95507 5.36252 8.69551L9.23459 4.82441Z" fill="currentColor"/>`
    });
