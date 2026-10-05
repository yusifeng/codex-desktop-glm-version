function projectAnnotationFramePoint(point: { x: number; y: number }, offset: { x: number; y: number }): { x: number; y: number } {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

export { projectAnnotationFramePoint };
if (typeof module !== `undefined`) module.exports = { projectAnnotationFramePoint };
