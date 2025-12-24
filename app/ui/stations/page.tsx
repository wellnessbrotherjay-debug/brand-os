"use client";

const stations = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  exercise: "Exercise Placeholder",
}));

export default function StationsPage() {
  return (
    <main className="min-h-screen w-full bg-black bg-[linear-gradient(135deg,rgba(0,191,255,0.08)_0%,rgba(0,0,0,0.92)_45%,rgba(30,30,30,0.98)_100%)] px-6 py-12 text-[#F4D03F] sm:px-12 lg:px-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="text-center">
          <h1 className="text-3xl font-black tracking-[0.35em] text-[#F4D03F] sm:text-4xl">
            7 STATION WORKOUT
          </h1>
        </header>

        <section className="rounded-3xl border border-[#F4D03F]/40 bg-[#080808]/90 p-10 shadow-[0_0_45px_rgba(244,208,63,0.2)]">
          <div className="rounded-2xl border border-[#00BFFF]/40 bg-[url('/hex-pattern.svg')] bg-[length:160px_160px] bg-center bg-repeat p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="group relative overflow-hidden rounded-xl border border-[#F4D03F]/40 bg-black/80 p-6 shadow-[0_0_25px_rgba(0,191,255,0.25)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,191,255,0.12),_transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative space-y-2 text-left">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00BFFF]">
                      Station {station.id}
                    </p>
                    <p className="text-lg font-bold text-[#F4D03F]">
                      {station.exercise}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
