import React from "react";
import { Stream } from "@cloudflare/stream-react";

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
  // playing prop takes priority over autoPlay
  const shouldPlay = playing !== undefined ? playing : autoPlay;

  if (!videoId) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center bg-black/60 ${className}`}
        style={{ width: "100%", height: "100%", ...style }}
      >
        <p className="text-white/40 text-sm tracking-widest uppercase">No video</p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", height: "100%", ...style }}
    >
      {/*
        @cloudflare/stream-react handles autoplay + muted + playsInline correctly
        across desktop and mobile (including iPad Safari).
        responsive={false} lets us control sizing via the parent div.
      */}
      <Stream
        src={videoId}
        autoplay={shouldPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        responsive={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
