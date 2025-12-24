import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
  { value: "checked_out", label: "Checked out" },
  { value: "canceled", label: "Canceled" },
];

export const dynamic = "force-dynamic";

export default async function StaffBookingsPage() {
  const supabase = createAdminClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
        id,
        status,
        check_in,
        check_out,
        guest_name,
        guest_email,
        guest_phone,
        package_name,
        special_requests,
        room:rooms (
          id,
          name,
          qr_slug
        )
      `
    )
    .order("check_in", { ascending: true })
    .limit(100);

  async function updateBooking(formData: FormData) {
    "use server";
    const bookingId = formData.get("bookingId");
    const status = formData.get("status");
    if (typeof bookingId !== "string" || typeof status !== "string") {
      return;
    }

    const supabase = createAdminClient();
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    revalidatePath("/staff/bookings");
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Staff Console</p>
          <h1 className="text-3xl font-semibold">Hotel Bookings</h1>
          <p className="text-sm text-slate-300">
            Review upcoming and active stays. Updating a booking status here will immediately sync to the mobile app,
            in-room TVs, and any other touchpoints pulling from the shared Supabase data.
          </p>
          {error && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Failed to load bookings: {error.message}
            </p>
          )}
        </header>

        <section className="flex flex-col gap-4">
          {(bookings ?? []).length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-6 text-sm text-slate-300">
              No bookings found. Once guests book through the mobile flow, they&apos;ll show up here automatically.
            </p>
          ) : (
            bookings?.map((booking) => (
              <article
                key={booking.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/70 to-black p-5 shadow-[0_20px_70px_rgba(15,23,42,0.5)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                      {booking.room?.name ?? "Room TBD"}
                    </p>
                    <h2 className="text-2xl font-semibold">
                      {booking.guest_name || "Unnamed Guest"}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {formatDisplayDate(booking.check_in)} → {formatDisplayDate(booking.check_out)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{booking.guest_email}</p>
                    <p>{booking.guest_phone}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Package</p>
                    <p className="text-white">{booking.package_name ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Requests</p>
                    <p className="text-slate-200">{booking.special_requests ?? "None"}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <form action={updateBooking} className="flex items-center gap-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <select
                      name="status"
                      defaultValue={booking.status}
                      className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm outline-none"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-2xl bg-emerald-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-emerald-400"
                    >
                      Update
                    </button>
                  </form>

                  {booking.room?.id && (
                    <Link
                      href={`/room/${booking.room.id}/tv`}
                      className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-sky-200 transition hover:bg-white/20"
                    >
                      Open TV
                    </Link>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function formatDisplayDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "EEE, MMM d");
}
