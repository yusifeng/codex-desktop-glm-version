type AnnotationOverlayStyleProjectionOptions = {
  baseStyle: Record<string, any>;
  zoomFactor: number;
  viewportScale: number;
  markerSize: number;
  metadataHeight: number;
  scaleVariable: string;
};

/** Build the overlay CSS style map from zoom and viewport scale state. */
function projectAnnotationOverlayStyle(options: AnnotationOverlayStyleProjectionOptions) {
  const { baseStyle, zoomFactor, viewportScale, markerSize, metadataHeight, scaleVariable } = options;
  const zoomStyle =
    zoomFactor === 1
      ? {}
      : {
          height: `${zoomFactor * 100}vh`,
          transform: `scale(${1 / zoomFactor})`,
          transformOrigin: `top left`,
          width: `${zoomFactor * 100}vw`,
        };
  return {
    ...baseStyle,
    ...zoomStyle,
    [scaleVariable]: String(viewportScale),
    "--browser-sidebar-draft-marker-size": `${markerSize * viewportScale}px`,
    "--browser-sidebar-marker-label-font-size": `${10 * viewportScale}px`,
    "--browser-sidebar-marker-label-offset": `${-0.5 * viewportScale}px`,
    "--browser-sidebar-metadata-column-gap": `${12 * viewportScale}px`,
    "--browser-sidebar-metadata-height": `${metadataHeight * viewportScale}px`,
    "--browser-sidebar-metadata-padding-x": `${10 * viewportScale}px`,
    "--browser-sidebar-metadata-padding-y": `${8 * viewportScale}px`,
    "--browser-sidebar-metadata-radius": `${12 * viewportScale}px`,
    "--browser-sidebar-metadata-row-gap": `${3 * viewportScale}px`,
    "--browser-sidebar-overlay-font-size": `${13 * viewportScale}px`,
    "--browser-sidebar-saved-marker-size": `${markerSize * viewportScale}px`,
  };
}

export { projectAnnotationOverlayStyle };
if (typeof module !== `undefined`) module.exports = { projectAnnotationOverlayStyle };
