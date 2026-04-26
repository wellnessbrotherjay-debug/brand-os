import { NextResponse } from "next/server";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * Generates a Direct Creator Upload URL for Cloudflare Stream.
 * This allows the client to upload directly to Cloudflare without
 * proxying the file through our server.
 */
export async function POST(request: Request) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return NextResponse.json(
      { error: "Cloudflare credentials not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const { filename } = await request.json();

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600, // 1 hour max
          meta: {
            name: filename || "Untitled Movement",
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudflare Direct Upload Error:", data);
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "Failed to get upload URL" },
        { status: response.status }
      );
    }

    // result.uploadURL is the URL to POST the file to
    // result.uid is the future video ID
    return NextResponse.json({
      uploadUrl: data.result.uploadURL,
      uid: data.result.uid,
    });
  } catch (error) {
    console.error("Upload API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
