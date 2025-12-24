"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SeedPage() {
    const [status, setStatus] = useState("Idle");

    const seedUser = async () => {
        setStatus("Seeding...");
        try {
            const { data, error } = await supabase.auth.signUp({
                email: "wellnessbrotherjay@gmail.com",
                password: "123456",
            });

            if (error) throw error;
            setStatus(`Success! User created: ${data.user?.id}`);
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    return (
        <div className="p-10 bg-black text-white min-h-screen">
            <h1 className="text-2xl mb-4">Seed User</h1>
            <p className="mb-4">wellnessbrotherjay@gmail.com / 123456</p>
            <button
                onClick={seedUser}
                className="bg-white text-black px-4 py-2 rounded"
            >
                Create User
            </button>
            <div className="mt-4 text-mono">{status}</div>
        </div>
    );
}
