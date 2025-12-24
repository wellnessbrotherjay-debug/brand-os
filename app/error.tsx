"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4">
            <h2 className="text-2xl font-bold mb-4 text-[#C8A871]">Something went wrong!</h2>
            <p className="text-gray-400 mb-8 max-w-md text-center">
                {error.message || "An unexpected error occurred."}
            </p>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-6 py-3 bg-[#C8A871] text-black font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
            >
                Try again
            </button>
        </div>
    );
}
