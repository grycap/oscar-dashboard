export function getMimeTypeFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  if (!extension) return "text/plain";

  return mimeTypesByExtension[extension] ?? "";
}

const mimeTypesByExtension: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
  txt: "text/plain",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/yaml",
  yml: "application/yaml",
  js: "application/javascript",
  css: "text/css",
  html: "text/html"
};