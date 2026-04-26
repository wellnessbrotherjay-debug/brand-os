import React from "react";

type CloudflarePlayerProps = {
  videoId: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function CloudflarePlayer({
  videoId,
  autoPlay = true,
  controls = false,
  loop = true,
  muted = true,
  className = "",
  style = {},
}: CloudflarePlayerProps) {
  if (!videoId) {
    return (
      <div 
        className={`bg-black/20 flex items-center justify-center ${className}`}
        style={{ width: "100%", height: "100%", ...style }}
      >
        <span className="text-[10px] opacity-20 uppercase font-black tracking-widest text-[#8A5F20]">No Video</span>
      </div>
    );
  }

  let finalUrl = "";
  // Global domain usually resolves across accounts if publicly shared
  const baseUrl = "https://iframe.videodelivery.net";
  const query = `autoplay=${autoPlay}&loop=${loop}&muted=${muted}&controls=${controls}`;

  const isLocal = videoId.startsWith("/");
  const isHttp = videoId.startsWith("http");

  if (isLocal || (isHttp && !videoId.includes("cloudflarestream.com") && !videoId.includes("videodelivery.net"))) {
    // Native video for local or non-CF external links
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ width: "100%", height: "100%", ...style }}>
        <video 
          src={videoId} 
          autoPlay={autoPlay} 
          loop={loop} 
          muted={muted} 
          playsInline
          className="absolute inset-0 w-full h-full object-cover" 
        />
      </div>
    );
  }

  // Cloudflare Stream Logic
  let extractedId = videoId;
  if (isHttp) {
    const match = videoId.match(/\/([a-f0-9]{32})\//) || videoId.match(/([a-f0-9]{32})/);
    extractedId = match ? (match[1] || match[0]) : videoId.split("/").pop()?.split(".")[0] || "";
  }
  
  finalUrl = `${baseUrl}/${extractedId}?${query}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", height: "100%", ...style }}
    >
      <iframe
        src={finalUrl}
        className="absolute inset-0 w-full h-full"
        style={{ border: 'none' }}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
