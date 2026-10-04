type AnnotationSurfaceFeatureState = {
  features: Iterable<string>;
  containerCount: number;
  metadataTargetCount: number;
  metadataRequested: boolean;
};

type AnnotationSurfaceFeatureResult = {
  features: string[];
  changed: boolean;
};

/** Reconcile feature advertisements from the currently discovered annotation surface state. */
function reconcileAnnotationSurfaceFeatures(
  state: AnnotationSurfaceFeatureState,
): AnnotationSurfaceFeatureResult {
  const next = new Set(state.features);
  const hadContainers = next.has(`containers`);
  const metadataFeature = state.metadataTargetCount > 0 ? `metadata-with-targets` : `metadata`;
  const hadMetadata = next.has(metadataFeature);
  const metadataActive = state.metadataTargetCount > 0 || state.metadataRequested;
  const previousMetadataFeature = metadataFeature === `metadata` ? `metadata-with-targets` : `metadata`;
  const removedOtherMetadata = next.delete(previousMetadataFeature);

  state.containerCount > 0 ? next.add(`containers`) : next.delete(`containers`);
  metadataActive ? next.add(metadataFeature) : next.delete(metadataFeature);

  const changed =
    hadContainers !== next.has(`containers`) ||
    hadMetadata !== metadataActive ||
    removedOtherMetadata;
  return { features: [...next], changed };
}

export { reconcileAnnotationSurfaceFeatures };
if (typeof module !== `undefined`) module.exports = { reconcileAnnotationSurfaceFeatures };
