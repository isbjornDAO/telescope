/** Browser upload: ask the server for a signed R2 URL, then PUT the file there. */

export async function uploadMedia(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type,
      size: file.size,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.uploadUrl !== "string" || typeof data.url !== "string") {
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }

  const headers =
    data.headers && typeof data.headers === "object"
      ? (data.headers as Record<string, string>)
      : { "Content-Type": file.type };

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  });
  if (!put.ok) {
    throw new Error("Storage rejected the file");
  }
  return data.url;
}
