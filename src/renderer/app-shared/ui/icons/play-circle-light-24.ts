// 图标资产：play-circle-light-24
//（原 app-shared 内部压缩名 jSt，懒初始化器 MSt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_play_circle_light_24 = createIconPreset({
      name: `play-circle-light-24`,
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
      body: `<path d="M9.35938 9.10645C9.35944 8.36957 10.1199 7.90286 10.7637 8.19141L10.8906 8.25879L15.6045 11.2148C16.2297 11.6068 16.2297 12.5174 15.6045 12.9092L10.8896 15.8604C10.2238 16.2767 9.35955 15.7981 9.35938 15.0127V9.10645Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill="currentColor"/>`
    });
