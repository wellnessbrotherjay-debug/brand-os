"use client";

interface StationDetailPageProps {
  params: {
    id: string;
  };
}

export default function StationDetailPage({ params }: StationDetailPageProps) {
  const { id } = params;

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.1),_rgba(0,0,0,0.95))] px-6 py-12 text-[#F4D03F] sm:px-12 lg:px-24">
      <section className="mx-auto flex max-w-4xl flex-col gap-8 rounded-2xl border border-[#00BFFF]/40 bg-black/75 p-10 text-center shadow-[0_0_35px_rgba(0,191,255,0.25)]">
        <header className="space-y-2">
          <h1 className="text-4xl font-black tracking-[0.35em] text-[#F4D03F] sm:text-5xl">
            Station {id}
          </h1>
          <p className="text-lg uppercase text-[#00BFFF]">
            Exercise Placeholder Name
          </p>
        </header>

        <div className="rounded-xl border border-[#F4D03F]/40 bg-black/60 p-6">
          <p className="text-xl font-semibold tracking-[0.2em] text-[#F4D03F]">
            20 WORK / 10 REST
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-[#F4D03F]/30 bg-black/50 p-6 text-[#BFC9CA]">
          <p className="text-sm uppercase tracking-[0.18em] text-[#00BFFF]">
            Future Coaching Notes
          </p>
          <p className="mt-3 text-base leading-relaxed">
            Placeholder space for technique cues, coaching reminders, or pacing
            strategies tailored to each station.
          </p>
        </div>
      </section>
    </main>
  );
}
