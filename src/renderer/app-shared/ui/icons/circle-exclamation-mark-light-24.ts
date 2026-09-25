// 图标资产：circle-exclamation-mark-light-24
//（原 app-shared 内部压缩名 Xvt，懒初始化器 Zvt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_circle_exclamation_mark_light_24 = createIconPreset({
      name: `circle-exclamation-mark-light-24`,
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
      body: `<path d="M12.1211 13.999C12.7205 14.0597 13.1885 14.5662 13.1885 15.1816C13.1884 15.8379 12.6562 16.3701 12 16.3701C11.3847 16.37 10.8781 15.902 10.8174 15.3027L10.8115 15.1816L10.8174 15.0596C10.8784 14.4606 11.385 13.9933 12 13.9932L12.1211 13.999Z" fill="currentColor"/> <path d="M12 7.62988C12.4142 7.62988 12.75 7.96567 12.75 8.37988V11.6299C12.75 12.0441 12.4142 12.3799 12 12.3799C11.5858 12.3799 11.25 12.0441 11.25 11.6299V8.37988C11.25 7.96567 11.5858 7.62988 12 7.62988Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill="currentColor"/>`
    });
