"use client";

import { useState } from "react";
import CloudflarePlayer from "@/components/CloudflarePlayer";

const TEST_VIDEO_ID = "cea8e05486e40fd74f7f1d5574d37c7b";

export default function TestVideoPage() {
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Video Test Page</h1>

        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Cloudflare Stream Iframe</h2>
          <div className="aspect-video bg-black rounded overflow-hidden">
            <CloudflarePlayer
              videoId={TEST_VIDEO_ID}
              playing={playing}
              loop={true}
              muted={true}
              controls={true}
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Direct Iframe Test</h2>
          <div className="aspect-video bg-black rounded overflow-hidden">
            <iframe
              src={`https://iframe.videodelivery.net/${TEST_VIDEO_ID}?autoplay=true&loop=true&muted=true&controls=true&playsinline=true`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Cloudflare Stream Direct Link</h2>
          <div className="aspect-video bg-black rounded overflow-hidden">
            <video
              src={`https://customer-cea8e05486e40fd74f7f1d5574d37c7b.cloudflarestream.com/${TEST_VIDEO_ID}/iframe/video.mp4`}
              autoPlay
              loop
              muted
              controls
              playsInline
              className="w-full h-full"
              onError={(e) => setError("Video failed to load")}
              onLoadedData={() => setError(null)}
            />
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setPlaying(!playing)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            {playing ? 'Pause' : 'Play'} (Component)
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-white p-4 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
          <p className="text-sm">Video ID: {TEST_VIDEO_ID}</p>
          <p className="text-sm">Playing State: {playing.toString()}</p>
          <p className="text-sm">
            Direct Link:{' '}
            <a
              href={`https://iframe.videodelivery.net/${TEST_VIDEO_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Open in new tab
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
