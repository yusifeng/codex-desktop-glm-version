// 图标资产：pause-circle-fill-light-24
//（原 app-shared 内部压缩名 DSt，懒初始化器 OSt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_pause_circle_fill_light_24 = createIconPreset({
      name: `pause-circle-fill-light-24`,
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
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM9.30859 8.61133C8.89438 8.61133 8.55859 8.94711 8.55859 9.36133V14.6377C8.55859 15.0519 8.89438 15.3877 9.30859 15.3877H10.4883C10.9025 15.3877 11.2383 15.0519 11.2383 14.6377V9.36133C11.2383 8.94711 10.9025 8.61133 10.4883 8.61133H9.30859ZM13.5117 8.61133C13.0975 8.61133 12.7617 8.94711 12.7617 9.36133V14.6377C12.7617 15.0519 13.0975 15.3877 13.5117 15.3877H14.6914C15.1056 15.3877 15.4414 15.0519 15.4414 14.6377V9.36133C15.4414 8.94711 15.1056 8.61133 14.6914 8.61133H13.5117Z" fill="currentColor"/>`
    });
