// 图标资产：voice-regular-20
//（原 app-shared 内部压缩名 Z6e，懒初始化器 Q6e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_voice_regular_20 = createIconPreset({
      name: `voice-regular-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 3.125, y: 2.458252, width: 14.416992, height: 15.083008 },
        visualBounds: { x: 3.125, y: 2.458252, width: 14.416992, height: 15.083008 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3.125, y: 2.458252, width: 14.416992, height: 15.083008 },
        center: { x: 10.333496, y: 9.999756 },
        insets: { top: 2.458252, right: 2.458008, bottom: 2.45874, left: 3.125 },
        anchors: {
          frame: { x: 10, y: 10 },
          ink: { x: 10.333496, y: 9.999756 },
          foreground: { x: 10.333496, y: 9.999756 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M8.22266 2.45825C8.70579 2.45838 9.09766 2.85008 9.09766 3.33325V16.6663C9.09766 17.1494 8.70579 17.5411 8.22266 17.5413C7.73941 17.5413 7.34766 17.1495 7.34766 16.6663V3.33325C7.34766 2.85 7.73941 2.45825 8.22266 2.45825Z" fill="currentColor"/> <path d="M12.4443 4.62524C12.9276 4.62524 13.3193 5.01699 13.3193 5.50024V13.8333C13.3192 14.3164 12.9275 14.7083 12.4443 14.7083C11.9613 14.7081 11.5695 14.3163 11.5693 13.8333V5.50024C11.5693 5.01708 11.9612 4.62538 12.4443 4.62524Z" fill="currentColor"/> <path d="M4 6.95825C4.48325 6.95825 4.875 7.35 4.875 7.83325V12.1663C4.875 12.6495 4.48325 13.0413 4 13.0413C3.51675 13.0413 3.125 12.6495 3.125 12.1663V7.83325C3.125 7.35 3.51675 6.95825 4 6.95825Z" fill="currentColor"/> <path d="M16.667 7.45825C17.15 7.45852 17.542 7.85017 17.542 8.33325V11.6663C17.542 12.1493 17.15 12.541 16.667 12.5413C16.1837 12.5413 15.792 12.1495 15.792 11.6663V8.33325C15.792 7.85 16.1837 7.45825 16.667 7.45825Z" fill="currentColor"/>`
    });
