type CloudflarePlayerProps = {
  videoId: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
};

import { Stream } from "@cloudflare/stream-react";

export default function CloudflarePlayer({
  videoId,
  autoPlay = false,
  controls = true,
  className = "",
}: CloudflarePlayerProps) {
  return (
    <div className={className} style={{ width: "100%", borderRadius: 12, overflow: 'hidden' }}>
      <Stream
        controls={controls}
        src={videoId}
        autoplay={autoPlay}
        responsive={false}
        className="w-full h-full"
      />
    </div>
  );
}
