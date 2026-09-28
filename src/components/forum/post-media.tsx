/* eslint-disable @next/next/no-img-element */
import { isVideoUrl } from "@/lib/storage/media";

/**
 * A post attachment. Videos play in place; images stay an img.
 * Card thumbnails pass interactive={false} so the surrounding link receives the click.
 */
export function PostMedia({
  src,
  alt,
  className,
  interactive = true,
}: {
  src: string;
  alt: string;
  className?: string;
  interactive?: boolean;
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        controls={interactive}
        muted={!interactive}
        playsInline
        preload="metadata"
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
}
