type CloudflarePlayerProps = {
  videoId: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
};

import { Stream } from "@cloudflare/stream-react";

export default function CloudflarePlayer({
  videoId,
  autoPlay = false,
  controls = true,
  loop = true,
  muted = true,
  className = "",
}: CloudflarePlayerProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      <Stream
        controls={controls}
        src={videoId}
        autoplay={autoPlay}
        loop={loop}
        muted={muted}
        responsive={true}
        className="w-full h-full object-contain"
        // Cloudflare Stream specific props for better mobile support
        primaryColor="#ffffff"
        preload="auto"
        playsInline={true}
      />
    </div>
  );
}
