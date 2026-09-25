// 图标资产：square-light-16
//（原 app-shared 内部压缩名 z3e，懒初始化器 B3e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_square_light_16 = createIconPreset({
      name: `square-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 1.474609, y: 1.474609, width: 13.050781, height: 13.050781 },
        visualBounds: { x: 1.474609, y: 1.474609, width: 13.050781, height: 13.050781 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.474609, y: 1.474609, width: 13.050781, height: 13.050781 },
        center: { x: 8, y: 8 },
        insets: { top: 1.474609, right: 1.47461, bottom: 1.47461, left: 1.474609 },
        anchors: { frame: { x: 8, y: 8 }, ink: { x: 8, y: 8 }, foreground: { x: 8, y: 8 } }
      },
      capabilities: [`icon`],
      body: `<path d="M13.4746 4.09961C13.4744 3.23007 12.7699 2.5256 11.9004 2.52539H4.09961C3.23007 2.5256 2.5256 3.23007 2.52539 4.09961V11.9004C2.5256 12.7699 3.23007 13.4744 4.09961 13.4746H11.9004C12.7699 13.4744 13.4744 12.7699 13.4746 11.9004V4.09961ZM14.5254 11.9004C14.5252 13.3498 13.3498 14.5252 11.9004 14.5254H4.09961C2.65017 14.5252 1.47482 13.3498 1.47461 11.9004V4.09961C1.47482 2.65017 2.65017 1.47482 4.09961 1.47461H11.9004C13.3498 1.47482 14.5252 2.65017 14.5254 4.09961V11.9004Z" fill="currentColor"/>`
    });
