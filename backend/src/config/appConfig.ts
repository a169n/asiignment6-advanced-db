const numberFromEnv = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const appConfig = {
  defaultPageSize: numberFromEnv(process.env.DEFAULT_PAGE_SIZE, 12),
  maxPageSize: numberFromEnv(process.env.MAX_PAGE_SIZE, 48),
  autoSeed: process.env.AUTO_SEED?.toLowerCase() !== "false",
  defaultImageAlt: process.env.DEFAULT_PRODUCT_IMAGE_ALT || "Product image",
};
