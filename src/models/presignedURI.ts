
export interface PresignedURIRequest {
  object_key: string; // example object key test/README.md
  operation: "download" | "upload",
  expires_in: number, // expiration time in seconds max 3600 (1 hour)
  content_type: string, // required for upload operation, example: "text/plain"
}

export interface PresignedURIResponse {
  object_key: string;
  operation: "download" | "upload";
  method: string; // GET or PUT
  url: string;
  expires_at: string; // Ex: 2026-02-26T11:43:49Z 
  headers?: {
    "Content-Type": string;
  };
};