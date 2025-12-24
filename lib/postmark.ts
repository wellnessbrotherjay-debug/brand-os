import { ServerClient } from "postmark";

type MagicLinkPayload = {
  email: string;
  link: string;
  venueName?: string;
};

const token = process.env.POSTMARK_SERVER_TOKEN;

const client = token ? new ServerClient(token) : null;

export async function sendMagicLinkEmail(payload: MagicLinkPayload) {
  if (!client) {
    console.warn("Postmark token missing; skipping magic link email", payload.email);
    return { mocked: true };
  }

  return client.sendEmail({
    To: payload.email,
    From: "no-reply@hotelfit.app",
    MessageStream: process.env.POSTMARK_MESSAGE_STREAM ?? "outbound",
    Subject: `${payload.venueName ?? "HotelFit"} sign-in link`,
    TextBody: `Tap to finish signing in: ${payload.link}`,
    HtmlBody: `<p>Tap to finish signing in:</p><p><a href="${payload.link}">${payload.link}</a></p>`,
  });
}
