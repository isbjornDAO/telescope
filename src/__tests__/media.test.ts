import { IMAGE_MAX_BYTES, VIDEO_MAX_BYTES, inspectMedia, isVideoUrl } from "@/lib/storage/media"

describe("inspectMedia", () => {
  it("accepts a jpeg under the image cap", () => {
    const result = inspectMedia("image/jpeg", 1024)
    expect(result).toEqual({ ok: true, ext: "jpg", kind: "image" })
  })

  it("accepts mp4 and quicktime under the video cap", () => {
    expect(inspectMedia("video/mp4", 1024)).toEqual({ ok: true, ext: "mp4", kind: "video" })
    expect(inspectMedia("video/quicktime", VIDEO_MAX_BYTES)).toEqual({
      ok: true,
      ext: "mov",
      kind: "video",
    })
  })

  it("refuses svg and other types that are not images or video", () => {
    expect(inspectMedia("image/svg+xml", 100).ok).toBe(false)
    expect(inspectMedia("application/pdf", 100).ok).toBe(false)
  })

  it("caps images and videos separately", () => {
    expect(inspectMedia("image/png", IMAGE_MAX_BYTES + 1).ok).toBe(false)
    expect(inspectMedia("video/webm", IMAGE_MAX_BYTES + 1).ok).toBe(true)
    expect(inspectMedia("video/webm", VIDEO_MAX_BYTES + 1).ok).toBe(false)
  })

  it("refuses an empty file", () => {
    expect(inspectMedia("image/gif", 0).ok).toBe(false)
  })
})

describe("isVideoUrl", () => {
  it("reads the extension and ignores the query string", () => {
    expect(isVideoUrl("https://media.example/media/2026/09/a.mp4")).toBe(true)
    expect(isVideoUrl("https://media.example/a.webm?x=1")).toBe(true)
    expect(isVideoUrl("https://media.example/a.jpg")).toBe(false)
  })
})
