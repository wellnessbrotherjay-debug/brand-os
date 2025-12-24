"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import "./mobile.css";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "female", // default for GLVT target demographic, easier specific selection
        dob: "",
        height: "",
        weight: "",
        activityLevel: "1.2",
        waiver: false
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push("/glvt/login");
            }
        });
    }, []);


    const handleNext = () => setStep(step + 1);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Calculate mock TDEE/BMR for immediate use
            const weight = parseFloat(formData.weight);
            const height = parseFloat(formData.height);
            const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();

            // Mifflin-St Jeor Equation
            let bmr = 10 * weight + 6.25 * height - 5 * age;
            bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161;

            const tdee = Math.round(bmr * parseFloat(formData.activityLevel));

            const profileData = {
                ...formData,
                age,
                bmr: Math.round(bmr),
                tdee
            };

            // Persist for the session/demo
            // localStorage.setItem("glvt_user_profile", JSON.stringify(profileData));

            // Upsert to supabase
            const { error: upsertError } = await supabase.from('gym_profiles').upsert({
                id: (await supabase.auth.getUser()).data.user?.id,
                first_name: formData.firstName,
                last_name: formData.lastName,
                gender: formData.gender,
                date_of_birth: formData.dob,
                height_cm: height,
                weight_kg: weight,
                waiver_signed: formData.waiver,
                waiver_signed_at: new Date().toISOString()
            });

            if (upsertError) throw upsertError;

            router.push("/glvt/home");
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans flex flex-col">
            <div className="flex-1">
                {/* Progress */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-gray-800'}`}></div>
                    ))}
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-serif mb-2">
                        {step === 1 && "Identity"}
                        {step === 2 && "Physiology"}
                        {step === 3 && "Waiver"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {step === 1 && "Let's get you in the system."}
                        {step === 2 && "Required for accurate HR & Calorie tracking."}
                        {step === 3 && "Safety first."}
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-[#1a1a1a] p-4 rounded-lg border border-white/10 outline-none focus:border-[#C8A871] transition-colors"
                            />
                            <input
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-[#1a1a1a] p-4 rounded-lg border border-white/10 outline-none focus:border-[#C8A871] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Gender</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                                    className={`p-4 rounded-lg border ${formData.gender === 'female' ? 'bg-[#C8A871] text-black border-[#C8A871]' : 'bg-[#1a1a1a] border-white/10'}`}
                                >
                                    Female
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                                    className={`p-4 rounded-lg border ${formData.gender === 'male' ? 'bg-[#C8A871] text-black border-[#C8A871]' : 'bg-[#1a1a1a] border-white/10'}`}
                                >
                                    Male
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                className="w-full bg-[#1a1a1a] p-4 rounded-lg border border-white/10 outline-none focus:border-[#C8A871] text-white"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    placeholder="170"
                                    value={formData.height}
                                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                                    className="w-full bg-[#1a1a1a] p-4 rounded-lg border border-white/10 outline-none focus:border-[#C8A871]"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Weight (kg)</label>
                                <input
                                    type="number"
                                    placeholder="65"
                                    value={formData.weight}
                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full bg-[#1a1a1a] p-4 rounded-lg border border-white/10 outline-none focus:border-[#C8A871]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Activity Level</label>
                            <select
                                value={formData.activityLevel}
                                onChange={e => setFormData({ ...formData, activityLevel: e.target.value })}
                                className="w-full bg-[#1a1a1a] p-4 rounded-lg border border-white/10 outline-none focus:border-[#C8A871] appearance-none"
                            >
                                <option value="1.2">Sedentary (Office Job)</option>
                                <option value="1.375">Lightly Active (1-3 days/week)</option>
                                <option value="1.55">Moderately Active (3-5 days/week)</option>
                                <option value="1.725">Very Active (6-7 days/week)</option>
                                <option value="1.9">Super Active (Physical Job)</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10 h-72 overflow-y-auto text-xs text-gray-400 leading-relaxed custom-scrollbar">
                            <h4 className="text-[#C8A871] font-bold mb-4 uppercase tracking-widest">Waiver & Release</h4>
                            <p className="mb-4">
                                I hereby acknowledge that I have voluntarily chosen to participate in the physical exercise program provided by GLVT / Exequte Hotel.
                            </p>
                            <p className="mb-4">
                                <strong>1. RISK WARNING:</strong> I understand that physical exercise involves inherent risks, including but not limited to, muscle strains, heart attacks, and other serious injuries or death. I assume all such risks.
                            </p>
                            <p className="mb-4">
                                <strong>2. HEALTH WARRANTY:</strong> I represent that I am in good physical condition and have no medical reason or impairment that might prevent me from participation.
                            </p>
                            <p className="mb-4">
                                <strong>3. DATA CONSENT:</strong> I consent to the collection and processing of my biometric data (heart rate, weight, etc.) for the purpose of performance tracking and safety monitoring.
                            </p>
                            <p>
                                By checking the box below, I confirm that I have read and understood this agreement.
                            </p>
                        </div>
                    </div>
                )}

            </div>

            <div className="mt-auto pt-6">
                {step < 3 ? (
                    <button
                        onClick={handleNext}
                        className="w-full bg-white text-black py-4 rounded-lg text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 hover:bg-gray-200"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="space-y-4">
                        <label className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-white/10 cursor-pointer hover:bg-[#222] transition-colors">
                            <div className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${formData.waiver ? 'bg-[#C8A871] border-[#C8A871]' : 'border-gray-600'}`}>
                                {formData.waiver && <Check className="w-4 h-4 text-black" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.waiver} onChange={e => setFormData({ ...formData, waiver: e.target.checked })} />
                            <span className="text-sm text-gray-300 font-medium">I Agree to the Terms & Waiver</span>
                        </label>

                        <button
                            onClick={handleSave}
                            disabled={!formData.waiver || loading}
                            className="w-full bg-[#C8A871] text-black py-4 rounded-lg text-xs uppercase tracking-[0.2em] font-bold disabled:opacity-50 hover:bg-[#d4b57a] transition-colors shadow-[0_4px_20px_rgba(200,168,113,0.2)]"
                        >
                            {loading ? "Creating Profile..." : "Sign Waiver & Enter"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
