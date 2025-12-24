const bool = (value?: string) => value === "true" || value === "1";

export function getEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY not configured");
  }

  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    appMode: process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "hotel",
    features: {
      circuitOverride: bool(process.env.NEXT_PUBLIC_FEATURES_CIRCUIT),
    },
    postmark: {
      token: process.env.POSTMARK_SERVER_TOKEN,
      stream: process.env.POSTMARK_MESSAGE_STREAM ?? "outbound",
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  };
}
