// 图标资产：microsoft-light-20
//（原 app-shared 内部压缩名 ZEt，懒初始化器 QEt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_microsoft_light_20 = createIconPreset({
      name: `microsoft-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 2.708252, y: 2.708252, width: 14.583496, height: 14.583496 },
        visualBounds: { x: 2.708252, y: 2.708252, width: 14.583496, height: 14.583496 }
      },
      paint: {
        kind: `multicolor`,
        layers: [
          {
            role: `fixed`,
            color: `#F35325`,
            bounds: { x: 2.708252, y: 2.708252, width: 6.666748, height: 6.666748 },
            wideGamut: `color(display-p3 0.9529 0.3255 0.1451)`
          },
          {
            role: `fixed`,
            color: `#81BC06`,
            bounds: { x: 10.625, y: 2.708252, width: 6.666748, height: 6.666748 },
            wideGamut: `color(display-p3 0.5059 0.7373 0.0235)`
          },
          {
            role: `fixed`,
            color: `#05A6F0`,
            bounds: { x: 2.708252, y: 10.625, width: 6.666748, height: 6.666748 },
            wideGamut: `color(display-p3 0.0196 0.6510 0.9412)`
          },
          {
            role: `fixed`,
            color: `#FFBA08`,
            bounds: { x: 10.625, y: 10.625, width: 6.666748, height: 6.666748 },
            wideGamut: `color(display-p3 1.0000 0.7294 0.0314)`
          }
        ]
      },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.708252, y: 2.708252, width: 14.583496, height: 14.583496 },
        center: { x: 10, y: 10 },
        insets: { top: 2.708252, right: 2.708252, bottom: 2.708252, left: 2.708252 },
        anchors: { frame: { x: 10, y: 10 }, ink: { x: 10, y: 10 } }
      },
      capabilities: [`icon`],
      body: `<path d="M2.7085 2.70825H9.37516V9.37492H2.7085V2.70825Z" fill="#F35325"/> <path d="M10.625 2.70825H17.2917V9.37492H10.625V2.70825Z" fill="#81BC06"/> <path d="M2.7085 10.625H9.37516V17.2917H2.7085V10.625Z" fill="#05A6F0"/> <path d="M10.625 10.625H17.2917V17.2917H10.625V10.625Z" fill="#FFBA08"/>`
    });
