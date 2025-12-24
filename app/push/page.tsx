"use client";

import { useRouter } from "next/navigation";

export default function PushPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">Push Plan to Displays</h1>
      <p className="mb-6 text-lg text-gray-300">After building, click below to update all displays.</p>
      <div className="flex gap-6">
        <button
          className="bg-[#00BFFF] text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#0099cc] transition-colors"
          onClick={() => router.push("/display-tv")}
        >
          Go to TV Display
        </button>
        <button
          className="bg-[#F4D03F] text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#c7a600] transition-colors"
          onClick={() => router.push("/display-tablet/1")}
        >
          Go to Tablet 1
        </button>
        <button
          className="bg-[#F4D03F] text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#c7a600] transition-colors"
          onClick={() => router.push("/display-tablet/2")}
        >
          Go to Tablet 2
        </button>
        <button
          className="bg-[#F4D03F] text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#c7a600] transition-colors"
          onClick={() => router.push("/display-tablet/3")}
        >
          Go to Tablet 3
        </button>
        <button
          className="bg-[#F4D03F] text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#c7a600] transition-colors"
          onClick={() => router.push("/display-tablet/4")}
        >
          Go to Tablet 4
        </button>
      </div>
    </main>
  );
}
