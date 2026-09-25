// 图标资产：pause-circle-light-24
//（原 app-shared 内部压缩名 kSt，懒初始化器 ASt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_pause_circle_light_24 = createIconPreset({
      name: `pause-circle-light-24`,
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
      body: `<path d="M10.4883 8.83594C10.7782 8.83594 11.0137 9.07138 11.0137 9.36133V14.6377C11.0137 14.9276 10.7782 15.1631 10.4883 15.1631H9.30859C9.01864 15.1631 8.7832 14.9276 8.7832 14.6377V9.36133C8.7832 9.07138 9.01864 8.83594 9.30859 8.83594H10.4883Z" fill="currentColor"/> <path d="M14.6914 8.83594C14.9813 8.836 15.2168 9.07142 15.2168 9.36133V14.6377C15.2168 14.9276 14.9813 15.163 14.6914 15.1631H13.5117C13.2218 15.1631 12.9863 14.9276 12.9863 14.6377V9.36133C12.9863 9.07138 13.2218 8.83594 13.5117 8.83594H14.6914Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill="currentColor"/>`
    });
