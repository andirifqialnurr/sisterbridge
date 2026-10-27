// Shared binary contract; safe to import in either browser or server code.
export const sisterFileContentTypes = [
  "image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;
export const sisterFileMaxBytes = 25 * 1024 * 1024;
