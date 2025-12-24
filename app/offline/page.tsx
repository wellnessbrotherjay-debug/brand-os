export const metadata = {
  title: "Offline | Hotel Fit Solutions",
  description: "Offline fallback for the Hotel Fit PWA shell."
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-white">
      <h1 className="text-3xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-xl text-base text-slate-300">
        The core builder, display, and analytics screens are ready to run offline. Reconnect to sync Supabase data and resume live
        updates.
      </p>
      <p className="text-xs uppercase tracking-wide text-slate-500">Cached by the Hotel Fit PWA upgrade</p>
    </main>
  );
}
