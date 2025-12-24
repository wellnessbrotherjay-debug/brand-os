'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Player from '@/components/Player';

interface PlayerPageProps {
  params: { roomId: string };
}

function PlayerContent({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Session Required</h1>
          <p className="text-xl opacity-70">Please create a workout session first</p>
          <a 
            href={`/room/${roomId}`}
            className="mt-6 inline-block px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Room
          </a>
        </div>
      </div>
    );
  }

  return <Player sessionId={sessionId} roomId={roomId} />;
}

export default function PlayerPage({ params }: PlayerPageProps) {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl">Loading player...</p>
        </div>
      </div>
    }>
      <PlayerContent roomId={params.roomId} />
    </Suspense>
  );
}