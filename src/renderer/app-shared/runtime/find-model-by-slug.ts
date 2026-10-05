export interface ModelDescriptor { model: string }

/** Find a model by slug, treating an omitted slug as no selection. */
export function findModelBySlug<T extends ModelDescriptor>(models: readonly T[], slug: string | null | undefined): T | null {
  return slug == null ? null : (models.find((model) => model.model === slug) ?? null);
}
