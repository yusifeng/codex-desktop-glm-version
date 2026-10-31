// @ts-nocheck

const MAX_VIRTUAL_ROLE_LENGTH = 64;
const VIRTUAL_ROLE_PATTERN = `^[a-z][a-z0-9-]*(?![\\s\\S])`;

/** Owns annotation anchor validation, identity, enrichment, and page sanitization. */
export function createBrowserAnnotationAnchorPolicy({
  shared,
}: {
  shared: any;
}) {
  const virtualTargetIdSchema = shared
    .Of()
    .min(1)
    .max(128)
    .regex(/^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u);
  const virtualRoleSchema = shared
    .Of()
    .max(MAX_VIRTUAL_ROLE_LENGTH)
    .regex(new RegExp(VIRTUAL_ROLE_PATTERN));
  const viewportRectSchema = shared.wf({
    x: shared.Cf().nonnegative(),
    y: shared.Cf().nonnegative(),
    width: shared.Cf().positive(),
    height: shared.Cf().positive(),
  });
  const virtualAnchorStateSchema = shared.wf({
    anchor: shared.wf({
      kind: shared.bf(`virtual`),
      surfaceId: virtualTargetIdSchema,
      targetId: virtualTargetIdSchema,
      pageUrl: shared.Of(),
      frameUrl: shared.pf(),
      framePath: shared.Af([]),
      selector: shared.pf(),
      role: virtualRoleSchema.nullable(),
      name: shared.pf(),
      nearbyText: shared.pf(),
      isFixed: shared.bf(true),
      point: shared.wf({
        xPercent: shared.Cf().min(0).max(100),
        y: shared.Cf().nonnegative(),
      }),
      rect: viewportRectSchema,
      scrollContainers: shared.hf(shared.Sf()).max(0).optional(),
    }),
    additionalAnchors: shared.hf(shared.Sf()).max(0).optional(),
    viewportRect: viewportRectSchema,
    viewportPoint: shared.wf({
      x: shared.Cf().nonnegative(),
      y: shared.Cf().nonnegative(),
    }),
    viewportSize: shared.wf({
      width: shared.Cf().positive(),
      height: shared.Cf().positive(),
    }),
  });

  function normalizeVirtualRole(value: unknown): string | undefined {
    const parsed = virtualRoleSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  }

  function isValidVirtualAnchorState(value: unknown, pageUrl: string): boolean {
    const parsed = virtualAnchorStateSchema.safeParse(value);
    if (!parsed.success) return false;
    const { anchor, viewportRect, viewportPoint, viewportSize } = parsed.data;
    return (
      anchor.pageUrl === pageUrl &&
      anchor.point.y <= viewportSize.height &&
      viewportPoint.x <= viewportSize.width &&
      viewportPoint.y <= viewportSize.height &&
      [anchor.rect, viewportRect].every(
        (rect) =>
          rect.x < viewportSize.width &&
          rect.y < viewportSize.height &&
          rect.x + rect.width <= viewportSize.width + 1 &&
          rect.y + rect.height <= viewportSize.height + 1,
      ) &&
      anchor.rect.x === viewportRect.x &&
      anchor.rect.y === viewportRect.y &&
      anchor.rect.width === viewportRect.width &&
      anchor.rect.height === viewportRect.height
    );
  }

  function sameAnchorIdentity(left: any, right: any): boolean {
    if (left.kind === `virtual` || right.kind === `virtual`) {
      return (
        left.kind === `virtual` &&
        right.kind === `virtual` &&
        shared.Cu({ ...left, role: right.role }, right)
      );
    }
    return (
      left.kind === `element` &&
      right.kind === `element` &&
      left.pageUrl === right.pageUrl &&
      left.frameUrl === right.frameUrl &&
      left.framePath.length === right.framePath.length &&
      left.framePath.every(
        (segment: string, index: number) => segment === right.framePath[index],
      ) &&
      ((left.runtimeElementId != null &&
        left.runtimeElementId === right.runtimeElementId) ||
        (left.elementPath === right.elementPath &&
          left.selector === right.selector &&
          (left.selector != null || shared.Cu(left, right))))
    );
  }

  function normalizeAnchorMetadata(
    anchor: any,
    pageUrl: string | null,
    replacement: any = anchor,
    allowVirtualReplacement = false,
  ): any {
    if (anchor.kind !== `element` && anchor.kind !== `virtual`) return anchor;
    const candidate =
      ((pageUrl != null && anchor.pageUrl === pageUrl) ||
        (anchor.kind === `virtual` && allowVirtualReplacement)) &&
      anchor.frameUrl == null &&
      anchor.framePath.length === 0 &&
      (replacement?.kind === `element` || replacement?.kind === `virtual`) &&
      sameAnchorIdentity(anchor, replacement)
        ? replacement
        : null;
    const elementMetadata = shared.Pu(candidate?.elementMetadata);
    const elementName = shared.Fu(candidate?.elementName);
    const role =
      anchor.kind === `virtual`
        ? (normalizeVirtualRole(candidate?.role) ?? null)
        : anchor.role;
    if (
      elementMetadata === undefined &&
      elementName === undefined &&
      role === anchor.role &&
      !Object.hasOwn(anchor, `elementMetadata`) &&
      !Object.hasOwn(anchor, `elementName`)
    ) {
      return anchor;
    }
    const normalized = { ...anchor, elementMetadata, elementName, role };
    if (elementMetadata === undefined) delete normalized.elementMetadata;
    if (elementName === undefined) delete normalized.elementName;
    return normalized;
  }

  function normalizeAnchorState(
    anchorState: any,
    pageUrl: string | null,
    runtimeAnchorState: any,
    allowVirtualReplacement = false,
  ): any {
    const runtimeAnchors =
      runtimeAnchorState == null
        ? runtimeAnchorState
        : [
            runtimeAnchorState.anchor,
            ...(runtimeAnchorState.additionalAnchors ?? []),
          ];
    const findReplacement = (anchor: any) => {
      if (runtimeAnchors === undefined) return anchor;
      const identityMatches =
        runtimeAnchors?.filter((candidate: any) =>
          sameAnchorIdentity(anchor, candidate),
        ) ?? [];
      const exactMatches = identityMatches.filter((candidate: any) =>
        shared.Cu(anchor, candidate),
      );
      return exactMatches.length === 1
        ? exactMatches[0]
        : exactMatches.length === 0 && identityMatches.length === 1
          ? identityMatches[0]
          : null;
    };
    return {
      ...anchorState,
      anchor: normalizeAnchorMetadata(
        anchorState.anchor,
        pageUrl,
        findReplacement(anchorState.anchor),
        allowVirtualReplacement || runtimeAnchorState != null,
      ),
      additionalAnchors: anchorState.additionalAnchors?.map((anchor: any) =>
        normalizeAnchorMetadata(
          anchor,
          pageUrl,
          findReplacement(anchor),
          allowVirtualReplacement || runtimeAnchorState != null,
        ),
      ),
    };
  }

  function updateDesignChangeAnchor(
    designChange: any,
    pageUrl: string | null,
    anchor?: any,
  ): any {
    if (designChange == null) return designChange;
    const normalizedAnchor = normalizeAnchorMetadata(
      designChange.anchor,
      pageUrl,
      anchor ?? designChange.anchor,
      anchor?.kind === `virtual`,
    );
    return normalizedAnchor === designChange.anchor
      ? designChange
      : { ...designChange, anchor: normalizedAnchor };
  }

  function sanitizeCommentForPage(comment: any, pageUrl: string | null): any {
    const anchor = normalizeAnchorMetadata(
      comment.anchor,
      pageUrl,
      comment.anchor,
      true,
    );
    return {
      ...comment,
      anchor,
      additionalAnchors: comment.additionalAnchors?.map((candidate: any) =>
        normalizeAnchorMetadata(candidate, pageUrl, candidate, true),
      ),
      designChange: updateDesignChangeAnchor(
        comment.designChange,
        pageUrl,
        anchor,
      ),
    };
  }

  function parseComparableAnnotationUrl(value: string): any | null {
    try {
      const url = new URL(value);
      return url.protocol === `http:` || url.protocol === `https:`
        ? {
            type: `http`,
            origin: url.origin,
            pathname: url.pathname,
            search: url.search,
          }
        : url.protocol === `file:`
          ? { type: `file`, pathname: url.pathname, search: url.search }
          : { type: `other`, value: url.toString() };
    } catch {
      return null;
    }
  }

  function sameAnnotationUrl(left: string, right: string): boolean {
    const parsedLeft = parseComparableAnnotationUrl(left);
    const parsedRight = parseComparableAnnotationUrl(right);
    if (parsedLeft == null || parsedRight == null) return left === right;
    if (parsedLeft.type !== parsedRight.type) return false;
    switch (parsedLeft.type) {
      case `http`:
        return (
          parsedRight.type === `http` &&
          parsedLeft.origin === parsedRight.origin &&
          parsedLeft.pathname === parsedRight.pathname &&
          parsedLeft.search === parsedRight.search
        );
      case `file`:
        return (
          parsedRight.type === `file` &&
          parsedLeft.pathname === parsedRight.pathname &&
          parsedLeft.search === parsedRight.search
        );
      case `other`:
        return (
          parsedRight.type === `other` && parsedLeft.value === parsedRight.value
        );
    }
  }

  return {
    isValidVirtualAnchorState,
    normalizeAnchorState,
    sameAnnotationUrl,
    sanitizeCommentForPage,
    updateDesignChangeAnchor,
    virtualRoleSchema,
    virtualTargetIdSchema,
  };
}
