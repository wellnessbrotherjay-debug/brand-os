"use server";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMagicLinkEmail } from "@/lib/postmark";

const bodySchema = z.object({
  email: z.string().email(),
  venueId: z.string().optional(),
  redirectTo: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const parsed = bodySchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, redirectTo } = parsed.data;
    const supabase = createAdminClient();

    const { data: linkData, error } = await supabase.auth.admin.generateLink({
      email,
      type: "magiclink",
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Unable to generate magic link" }, { status: 500 });
    }

    const magicLink =
      linkData?.properties?.action_link ||
      linkData?.properties?.email_otp ||
      redirectTo ||
      "https://app.hotelfit.solutions/login";

    await sendMagicLinkEmail({
      email,
      link: magicLink,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
