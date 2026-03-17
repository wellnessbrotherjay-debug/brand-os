import { Stream } from "@cloudflare/stream-react";
import React from "react";

type CloudflarePlayerProps = {
  videoId: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  playing?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function CloudflarePlayer({
  videoId,
  autoPlay = false,
  controls = true,
  loop = true,
  muted = true,
  playing,
  className = "",
  style = {},
}: CloudflarePlayerProps) {
  // Use playing prop if provided, otherwise fallback to autoPlay for initial load
  const shouldPlay = playing !== undefined ? playing : autoPlay;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", height: "100%", ...style }}
    >
      <Stream
        controls={controls}
        src={videoId}
        autoplay={shouldPlay}
        loop={loop}
        muted={muted}
        responsive={false}
        className="w-full h-full object-contain"
        primaryColor="#ffffff"
        preload="auto"
      />
    </div>
  );
}
