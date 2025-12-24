"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import "./mobile.css";

export default function GlvtLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const checkProfileAndRedirect = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('gym_profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (data) {
                router.push("/glvt/book");
            } else {
                router.push("/glvt/onboarding");
            }
        } catch (e) {
            router.push("/glvt/onboarding");
        }
    };

    // Check if checks session on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                checkProfileAndRedirect(session.user.id);
            }
        });
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // router.push("/glvt/book"); // REPLACE

                // Get the user we just logged in as
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await checkProfileAndRedirect(user.id);
                } else {
                    router.push("/glvt/book"); // Fallback
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-center p-8 font-sans">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-serif tracking-widest mb-2">GLVT</h1>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Member Access</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-white focus:border-white/30 outline-none transition-colors"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-white focus:border-white/30 outline-none transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-xs text-center">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black py-4 rounded-lg text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-gray-500 underline decoration-gray-700 hover:text-white transition-colors"
                >
                    {isSignUp ? "Already have an account? Sign In" : "First time? Create Account"}
                </button>
            </div>
        </div>
    );
}
