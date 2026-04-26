import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  if (!text) {
    return new Response('Missing text', { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn("ELEVENLABS_API_KEY not found in env, failing gracefully.");
    return new Response('No API key', { status: 501 });
  }

  // Pre-selected deep/energetic voice (Adam)
  const voiceId = 'pNInz6obpgDQGcFmaJgB'; 
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs API Error:", err);
      return new Response('ElevenLabs API Error', { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        // Instruct browser and CDNs to cache these static voice snippets for an entire year
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });
  } catch (err: any) {
    console.error("TTS Fetch Failed:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
