type BrowserCommentSchemaDependencies = {
  annotationControlChangeSchema: any;
  annotationControlsSchema: any;
  schema: any;
  virtualRoleSchema: any;
  virtualTargetIdSchema: any;
};

export const BROWSER_COMMENT_SCREENSHOT_READY_TIMEOUT_MS = 1_000;
export const BROWSER_DESIGN_GROUP_ATTRIBUTE = `data-codex-browser-design-group`;

/** Builds the Browser comment anchor, design-change, runtime-message, and CDP response boundaries. */
export function createBrowserCommentSchemas({
  annotationControlChangeSchema,
  annotationControlsSchema,
  schema,
  virtualRoleSchema,
  virtualTargetIdSchema,
}: BrowserCommentSchemaDependencies) {
  const editorTargetSchema = schema.vf(`mode`, [
    schema.wf({ mode: schema.bf(`create`) }),
    schema.wf({ mode: schema.bf(`edit`), commentId: schema.Of() }),
    schema.wf({ mode: schema.bf(`design`), groupId: schema.Of() }),
  ]);
  const rectangleSchema = schema.wf({
    x: schema.Cf(),
    y: schema.Cf(),
    width: schema.Cf(),
    height: schema.Cf(),
  });
  const pointSchema = schema.wf({ x: schema.Cf(), y: schema.Cf() });
  const documentContextSchema = schema.wf({
    provider: schema.bf(`google-docs`),
    kind: schema.bf(`google-docs`),
    documentId: schema.Of(),
    tabId: schema.Of().optional(),
    documentTitle: schema.Of().optional(),
    selectedText: schema.Of().optional(),
    visibleText: schema.Of().optional(),
  });
  const anchorBaseSchema = schema.wf({
    pageUrl: schema.Of(),
    frameUrl: schema.Of().nullable(),
    title: schema.Of(),
    elementPath: schema.Of(),
    point: schema.wf({ xPercent: schema.Cf(), y: schema.Cf() }),
    rect: rectangleSchema,
    isFixed: schema.gf(),
    framePath: schema.hf(schema.Of()),
    immediateText: schema.Of().nullable().optional(),
    documentContext: documentContextSchema.optional(),
    scrollContainers: schema
      .hf(
        schema.wf({
          selector: schema.Of(),
          scrollLeft: schema.Cf(),
          scrollTop: schema.Cf(),
        }),
      )
      .optional(),
  });
  const elementAnchorSchema = anchorBaseSchema.extend({
    kind: schema.bf(`element`),
    runtimeElementId: schema.Of().min(1).max(128).optional(),
    elementMetadata: schema.Mf().transform(schema.Pu).optional(),
    elementName: schema.Mf().transform(schema.Fu).optional(),
    role: schema.Of().nullable(),
    name: schema.Of().nullable(),
    selector: schema.Of().nullable(),
    nearbyText: schema.Of().nullable(),
  });
  const regionAnchorSchema = anchorBaseSchema.extend({
    kind: schema.bf(`region`),
    role: schema.pf(),
    name: schema.pf(),
    selector: schema.pf(),
    nearbyText: schema.pf(),
  });
  const additionalAnchorSchema = schema.vf(`kind`, [
    elementAnchorSchema,
    regionAnchorSchema,
  ]);
  const pageAnchorSchema = schema.vf(`kind`, [
    elementAnchorSchema,
    regionAnchorSchema,
    anchorBaseSchema.extend({
      kind: schema.bf(`text`),
      role: schema.pf(),
      name: schema.pf(),
      selector: schema.pf(),
      nearbyText: schema.pf(),
      selectedText: schema.Of().max(schema.vu),
      selectionRects: schema.hf(rectangleSchema).max(schema.yu),
      textLocator: schema.vf(`kind`, [
        schema.wf({
          kind: schema.bf(`dom`),
          direction: schema.df([`backward`, `forward`]),
          rangeText: schema.Of().max(schema.vu),
          selector: schema.Of().nullable(),
          shadowHosts: schema.hf(schema.Of()),
          startOffset: schema.Cf(),
          endOffset: schema.Cf(),
        }),
        schema.wf({
          kind: schema.bf(`form-control`),
          direction: schema.df([`backward`, `forward`]),
          selector: schema.Of(),
          shadowHosts: schema.hf(schema.Of()),
          startOffset: schema.Cf(),
          endOffset: schema.Cf(),
        }),
      ]),
    }),
  ]);
  const virtualAnchorSchema = elementAnchorSchema
    .omit({
      documentContext: true,
      immediateText: true,
      runtimeElementId: true,
      scrollContainers: true,
    })
    .extend({
      kind: schema.bf(`virtual`),
      surfaceId: virtualTargetIdSchema,
      targetId: virtualTargetIdSchema,
      frameUrl: schema.pf(),
      framePath: schema.Af([]),
      isFixed: schema.bf(true),
      point: schema.wf({
        xPercent: schema.Cf().min(0).max(100),
        y: schema.Cf().nonnegative(),
      }),
      rect: schema.wf({
        x: schema.Cf().nonnegative(),
        y: schema.Cf().nonnegative(),
        width: schema.Cf().positive(),
        height: schema.Cf().positive(),
      }),
      role: virtualRoleSchema.nullable(),
      name: schema.pf(),
      selector: schema.pf(),
      nearbyText: schema.pf(),
    })
    .strict();
  const anchorSchema = schema.vf(`kind`, [
    ...pageAnchorSchema.options,
    virtualAnchorSchema,
  ]);
  const anchorStateSchema = schema.wf({
    anchor: anchorSchema,
    additionalAnchors: schema.hf(additionalAnchorSchema).optional(),
    cardViewportRect: rectangleSchema.optional(),
    placement: schema.bf(`top-left`).optional(),
    viewportRect: rectangleSchema.nullable(),
    viewportPoint: pointSchema,
    viewportSize: schema
      .wf({ width: schema.Cf(), height: schema.Cf() })
      .optional(),
    visualViewport: schema
      .wf({
        offsetLeft: schema.Cf(),
        offsetTop: schema.Cf(),
        scale: schema.Cf().positive(),
      })
      .optional(),
  });
  const declarationSchema = schema.wf({
    property: schema.Of(),
    value: schema.Of(),
    previousValue: schema.Of(),
    placeholderValue: schema.Of().optional(),
  });
  const textChangeSchema = schema.wf({
    value: schema.Of(),
    previousValue: schema.Of(),
  });
  const designChangeBaseSchema = schema.wf({
    id: schema.Of(),
    anchor: anchorSchema,
    annotationControls: annotationControlsSchema.optional(),
    annotationControlChanges: schema
      .hf(annotationControlChangeSchema)
      .max(12)
      .optional(),
    declarations: schema.hf(declarationSchema),
    draftAttribute: schema.Of(),
    markerViewportPoint: pointSchema.optional(),
    provenance: schema.hf(
      schema.wf({
        property: schema.Of(),
        selectorText: schema.Of().optional(),
        sourceUrl: schema.Of().optional(),
        sourceLine: schema.Cf().optional(),
        sourceColumn: schema.Cf().optional(),
      }),
    ),
    selector: schema.Of().nullable(),
    targetLabel: schema.Of(),
    elementTagName: schema.Of().optional(),
    text: textChangeSchema.optional(),
    viewportSize: schema
      .wf({ width: schema.Cf(), height: schema.Cf() })
      .optional(),
  });
  const validateDesignChange = (designChange: any, context: any) => {
    if (
      designChange.anchor.kind === `virtual` &&
      (designChange.annotationControls == null ||
        designChange.annotationControls.controls.length === 0 ||
        designChange.declarations.length > 0 ||
        designChange.provenance.length > 0 ||
        designChange.text != null ||
        designChange.selector != null)
    )
      context.addIssue({
        code: `custom`,
        message: `Graphics targets support only registered annotation controls`,
      });
    const controls = new Map(
      designChange.annotationControls?.controls.map((control: any) => [
        control.callback,
        control,
      ]),
    );
    const seenCallbacks = new Set();
    for (const [index, change] of (
      designChange.annotationControlChanges ?? []
    ).entries()) {
      const control: any = controls.get(change.callback);
      const invalid =
        control == null ||
        seenCallbacks.has(change.callback) ||
        [change.value, change.previousValue].some((value) => {
          if (value == null) return false;
          switch (control.type) {
            case `color`:
              return (
                typeof value !== `string` ||
                !/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
                  value,
                )
              );
            case `select`:
              return !control.options.some(
                (option: any) => option.value === value,
              );
            case `range`:
              return (
                typeof value !== `number` ||
                value < control.min ||
                value > control.max
              );
            case `toggle`:
              return typeof value !== `boolean`;
          }
        });
      if (invalid)
        context.addIssue({
          code: `custom`,
          message: `Control changes must match their registered callback and type`,
          path: [`annotationControlChanges`, index],
        });
      seenCallbacks.add(change.callback);
    }
  };
  const designChangeSchema =
    designChangeBaseSchema.superRefine(validateDesignChange);
  const savedDesignChangeSchema = designChangeBaseSchema
    .extend({
      createdAt: schema.Of(),
      updatedAt: schema.Of(),
      status: schema.jf([schema.bf(`current`), schema.bf(`queued`)]),
    })
    .superRefine(validateDesignChange);
  const runtimeMessageSchema = schema
    .vf(`type`, [
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-close-comment-preview`),
        commentId: schema.Of(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-comment-screenshot-ready`),
        commentId: schema.Of(),
        annotationViewportRect: rectangleSchema.nullable().optional(),
        markerViewportPoint: pointSchema.optional(),
        skipScreenshotCapture: schema.gf().optional(),
      }),
      schema.wf({ type: schema.bf(`browser-sidebar-runtime-exit-comment-mode`) }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-toggle-annotation-mode`),
        force: schema.gf().optional(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-request-annotation-permission`),
        requestId: schema.Pf(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-annotation-suspension`),
        suspended: schema.gf(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-design-modifier-state`),
        pressed: schema.gf(),
      }),
      schema.wf({
        type: schema.bf(
          `browser-sidebar-runtime-annotation-selection-modifier-state`,
        ),
        pressed: schema.gf(),
      }),
      schema.wf({ type: schema.bf(`browser-sidebar-runtime-focus-editor`) }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-cancel-editor`),
        target: editorTargetSchema,
      }),
      schema.wf({ type: schema.bf(`browser-sidebar-runtime-image-drag-ended`) }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-image-drag-started`),
        sourceUrl: schema.Of(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-mouse-navigation`),
        direction: schema.jf([schema.bf(`back`), schema.bf(`forward`)]),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-open-comment-preview`),
        commentId: schema.Of(),
        anchorState: anchorStateSchema,
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-open-editor`),
        target: editorTargetSchema,
        anchorState: anchorStateSchema,
        annotationEditorDefault: schema.bf(`advanced`).optional(),
        designEditorState: designChangeSchema.optional(),
        enterAnnotationMode: schema.bf(true).optional(),
        initialComment: schema.wu.optional().catch(undefined),
        openTweaks: schema.bf(true).optional(),
        siteInitiated: schema.bf(true).optional(),
        wantsScreenshot: schema.gf().optional(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-open-design-editor`),
        anchorState: anchorStateSchema,
        designEditorState: designChangeSchema,
        designChange: savedDesignChangeSchema.optional(),
      }),
      schema.wf({
        type: schema.bf(`browser-sidebar-runtime-update-anchor`),
        target: editorTargetSchema,
        anchorState: anchorStateSchema.nullable(),
      }),
    ])
    .refine((message: any) => {
      if (
        message.type === `browser-sidebar-runtime-open-design-editor` &&
        (message.designEditorState.anchor.kind === `virtual` ||
          message.designChange?.anchor.kind === `virtual`)
      )
        return false;
      if (
        message.type === `browser-sidebar-runtime-open-editor` &&
        message.designEditorState?.anchor.kind === `virtual` &&
        (message.anchorState.anchor.kind !== `virtual` ||
          !schema.Cu(
            message.designEditorState.anchor,
            message.anchorState.anchor,
          ))
      )
        return false;
      if (
        !(`anchorState` in message) ||
        message.anchorState?.anchor.kind !== `virtual`
      )
        return true;
      if (
        (message.anchorState.additionalAnchors?.length ?? 0) > 0 ||
        message.type === `browser-sidebar-runtime-open-design-editor`
      )
        return false;
      return (
        message.type !== `browser-sidebar-runtime-open-editor` ||
        (message.target.mode !== `design` &&
          (message.designEditorState == null ||
            message.designEditorState.anchor.kind === `virtual`) &&
          message.openTweaks !== true &&
          message.siteInitiated !== true)
      );
    });

  const documentRootSchema = schema.wf({
    root: schema.wf({ nodeId: schema.Cf() }),
  });
  const nodeIdSchema = schema.wf({ nodeId: schema.Cf() });
  const sourceRangeSchema = schema.wf({
    startLine: schema.Cf(),
    startColumn: schema.Cf(),
  });
  const cssPropertySchema = schema
    .wf({
      name: schema.Of(),
      value: schema.Of().optional(),
      disabled: schema.gf().optional(),
      implicit: schema.gf().optional(),
      range: sourceRangeSchema.optional(),
    })
    .loose();
  const cssContextSchema = schema
    .wf({ text: schema.Of().optional(), sourceURL: schema.Of().optional() })
    .loose();
  const matchedRuleSchema = schema
    .wf({
      rule: schema
        .wf({
          selectorList: schema
            .wf({ text: schema.Of().optional() })
            .optional(),
          media: schema.hf(cssContextSchema).optional(),
          containerQueries: schema.hf(cssContextSchema).optional(),
          supports: schema.hf(cssContextSchema).optional(),
          style: schema
            .wf({ cssProperties: schema.hf(cssPropertySchema).optional() })
            .optional(),
        })
        .loose(),
    })
    .loose();
  const matchedStylesSchema = schema
    .wf({
      inlineStyle: schema
        .wf({ cssProperties: schema.hf(cssPropertySchema).optional() })
        .optional(),
      matchedCSSRules: schema.hf(matchedRuleSchema).optional(),
    })
    .loose();

  return {
    anchorStateSchema,
    designChangeSchema,
    documentRootSchema,
    matchedStylesSchema,
    nodeIdSchema,
    runtimeMessageSchema,
  };
}

export function projectBrowserCaptureRect(
  imageSize: { width: number; height: number },
  captureRect: { x: number; y: number; width: number; height: number },
  viewportSize: { width: number; height: number },
  padding: number,
) {
  if (
    imageSize.width <= 0 ||
    imageSize.height <= 0 ||
    viewportSize.width <= 0 ||
    viewportSize.height <= 0
  )
    return null;
  const scaleX = imageSize.width / viewportSize.width;
  const scaleY = imageSize.height / viewportSize.height;
  const x = Math.max(0, Math.floor((captureRect.x - padding) * scaleX));
  const y = Math.max(0, Math.floor((captureRect.y - padding) * scaleY));
  const right = Math.min(
    imageSize.width,
    Math.ceil((captureRect.x + captureRect.width + padding) * scaleX),
  );
  const bottom = Math.min(
    imageSize.height,
    Math.ceil((captureRect.y + captureRect.height + padding) * scaleY),
  );
  const width = right - x;
  const height = bottom - y;
  return width <= 0 || height <= 0 ? null : { x, y, width, height };
}
