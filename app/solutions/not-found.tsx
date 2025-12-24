"use client";

import Link from "next/link";

export default function SolutionsNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-semibold">404</h1>
        <p className="text-lg text-slate-400">This page could not be found.</p>
        <Link href="/solutions" className="text-cyan-300 underline hover:text-cyan-200">
          Go back to Solutions
        </Link>
      </div>
    </div>
  );
}
