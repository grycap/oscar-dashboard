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
  html: "text/html",
  csv: "text/csv",
  md: "text/markdown",
  markdown: "text/markdown",
  py: "text/x-python",
  sh: "application/x-sh",
  toml: "application/toml",
  env: "text/plain",
  ts: "application/typescript",
  tsv: "text/tab-separated-values",

};


const editableExtensions: Record<string, string> = {
  css: "css",
  csv: "plaintext",
  env: "plaintext",
  html: "html",
  ini: "plaintext",
  js: "javascript",
  json: "json",
  md: "markdown",
  markdown: "markdown",
  py: "python",
  sh: "shell",
  toml: "plaintext",
  ts: "typescript",
  tsv: "plaintext",
  txt: "plaintext",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  dickerfile: "plaintext",
};

const byExtensionMimeTypes = Object.fromEntries(Object.entries(mimeTypesByExtension).map(([ext, mime]) => [mime, ext]));

export function getEditableLanguage(file: File): string | null {
  const splitFileName = file.name.split(".");
  const extension = splitFileName.length > 1 ? splitFileName.pop()?.toLowerCase() : undefined;
  if (!extension) return "plaintext";

  if (extension && editableExtensions[extension]) {
    return editableExtensions[extension];
  }

  if (file.type && byExtensionMimeTypes[file.type]) {
    return editableExtensions[byExtensionMimeTypes[file.type]];
  }

  if (file.type.startsWith("text/")) {
    return "plaintext";
  }

  return null;
}
