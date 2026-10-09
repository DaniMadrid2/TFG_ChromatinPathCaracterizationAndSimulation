function createStableLODAxis(options) {
  const { center, size, radius, fullResolution, falloff, budget, priority } = options;
  const reach = Math.ceil(size * radius);
  const start = center - reach;
  const end = center + reach;
  const cap = options.maxLOD > 0 ? options.maxLOD : Math.max(1, 2 * reach / Math.max(1, budget - 2 * fullResolution - 1));
  const coarse = Math.pow(2, (options.maxLOD > 0 ? Math.floor : Math.ceil)(Math.log2(Math.max(1, cap))));
  const required = /* @__PURE__ */ new Set([start, end]);
  for (let coordinate = center - fullResolution; coordinate <= center + fullResolution; coordinate++) {
    required.add(coordinate);
  }
  for (const coordinate of priority) {
    if (coordinate >= start && coordinate <= end) required.add(coordinate);
  }
  for (let attempt = 0; attempt < 24; attempt++) {
    const points = new Set(required);
    const transition = attempt === 23 ? 0 : Math.max(1, fullResolution) * Math.max(0.125, falloff) / Math.pow(2, attempt);
    const visit = (left, spacing) => {
      if (left > end || left + spacing < start) return;
      const distance = Math.max(
        0,
        left - center - fullResolution,
        center - fullResolution - (left + spacing)
      );
      const target = distance === 0 ? 1 : transition === 0 ? coarse : Math.min(coarse, Math.pow(2, Math.floor(Math.log2(1 + distance / transition))));
      if (spacing > target) {
        visit(left, spacing / 2);
        visit(left + spacing / 2, spacing / 2);
      } else {
        if (left >= start && left <= end) points.add(left);
        if (left + spacing >= start && left + spacing <= end) points.add(left + spacing);
      }
    };
    for (let left = Math.floor(start / coarse) * coarse; left < end; left += coarse) visit(left, coarse);
    if (points.size <= budget) return Float32Array.from([...points].sort((a, b) => a - b));
  }
  throw new Error("Maximum LOD needs more vertices; reduce repeat radius or full-resolution radius, raise max LOD, or increase grid radius");
}
export {
  createStableLODAxis
};
