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
  controls = false,
  loop = true,
  muted = true,
  playing,
  className = "",
  style = {},
}: CloudflarePlayerProps) {
  // Use playing prop if provided, otherwise fallback to autoPlay for initial load
  const shouldPlay = playing !== undefined ? playing : autoPlay;

  // Cloudflare Stream iframe URL parameters
  const params = new URLSearchParams();
  if (shouldPlay) params.append("autoplay", "true");
  if (loop) params.append("loop", "true");
  if (muted) params.append("muted", "true");
  params.append("controls", controls ? "true" : "false");
  params.append("preload", "auto");
  // Important for mobile autoplay without popping out to full screen
  params.append("playsinline", "true");

  const iframeSrc = `https://iframe.videodelivery.net/${videoId}?${params.toString()}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", height: "100%", ...style }}
    >
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Workout Exercise Video"
      />
    </div>
  );
}
