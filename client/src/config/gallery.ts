export const galleryConfig = {
  // Show/hide the subject category field (badge on gallery card, filter, admin form).
  // Subject categories are off by default; enable per gallery if needed.
  showSubject: false,

  // Print availability is determined automatically from uploaded image resolution.
  // Tier thresholds (shortest side in pixels): large ≥5000, medium ≥3000, small ≥1500.
  // Manual override checkbox is hidden when this is true.
  printsAutoFromResolution: true,
};
