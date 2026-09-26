export interface AnalyticsEventDescriptor<Type extends string> {
  readonly $type: Type;
}

function eventDescriptor<const Type extends string>(
  type: Type,
): AnalyticsEventDescriptor<Type> {
  return { $type: type };
}

/** 原 `RX` / 压缩导出 `mj`。 */
export const FAST_MODE_ANNOUNCEMENT_CTA_CLICKED = eventDescriptor(
  "protobuf_analytics_events.v1.CodexFastModeAnnouncementCtaClicked",
);

/** 原 `zX` / 压缩导出 `hj`。 */
export const FAST_MODE_ANNOUNCEMENT_DISMISSED = eventDescriptor(
  "protobuf_analytics_events.v1.CodexFastModeAnnouncementDismissed",
);

/** 原 `BX` / 压缩导出 `gj`。 */
export const FAST_MODE_ANNOUNCEMENT_VIEWED = eventDescriptor(
  "protobuf_analytics_events.v1.CodexFastModeAnnouncementViewed",
);

/** 原 `VX` / 压缩导出 `_j`。 */
export const FAST_MODE_BANNER_CTA_CLICKED = eventDescriptor(
  "protobuf_analytics_events.v1.CodexFastModeBannerCtaClicked",
);

/** 原 `HX` / 压缩导出 `vj`。 */
export const FAST_MODE_BANNER_DISMISSED = eventDescriptor(
  "protobuf_analytics_events.v1.CodexFastModeBannerDismissed",
);

/** 原 `UX` / 压缩导出 `yj`。 */
export const FAST_MODE_BANNER_VIEWED = eventDescriptor(
  "protobuf_analytics_events.v1.CodexFastModeBannerViewed",
);
