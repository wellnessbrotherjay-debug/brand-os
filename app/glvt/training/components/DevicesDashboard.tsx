"use client";

import { useState } from "react";
import { Link } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DevicesDashboard() {
    const [connected, setConnected] = useState(false);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-[#3a3a3a] border border-[#D7D5D2]/15 shadow-[0_0_20px_rgba(200,168,113,0.05)]">
                <CardHeader>
                    <CardTitle className="text-[#F1EDE5] font-serif">Connectivity</CardTitle>
                    <CardDescription className="text-[#D7D5D2]/60 uppercase tracking-wider text-[10px]">Sync wearables for holistic tracking</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">

                    {/* Whoop Connection Card */}
                    <div className="border border-[#D7D5D2]/10 rounded-xl p-6 bg-[#2D2D2D] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0">
                                <span className="font-bold text-black text-xs tracking-tighter">WHOOP</span>
                            </div>
                            <div>
                                <h3 className="font-serif text-[#F1EDE5] text-lg">Whoop Strap</h3>
                                <p className="text-xs text-[#D7D5D2]/60">
                                    {connected ? "Syncing active: Recovery, Strain & Sleep data" : "Connect to sync your daily biometrics"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant={connected ? "outline" : "default"}
                            className={connected ? "border-[#C8A871] text-[#C8A871] hover:bg-[#C8A871]/10 uppercase text-[10px] tracking-widest w-full md:w-auto" : "bg-[#F1EDE5] text-[#2D2D2D] hover:bg-white uppercase text-[10px] tracking-widest font-bold w-full md:w-auto"}
                            onClick={() => setConnected(!connected)}
                        >
                            {connected ? "Connected" : "Connect Device"}
                        </Button>
                    </div>

                    {/* Garmin Placeholder */}
                    <div className="border border-[#D7D5D2]/10 rounded-xl p-6 bg-[#2D2D2D] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 opacity-50 cursor-not-allowed grayscale">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black border border-white/20 rounded-lg flex items-center justify-center shrink-0">
                                <span className="font-bold text-blue-400 text-[10px]">GARMIN</span>
                            </div>
                            <div>
                                <h3 className="font-serif text-[#F1EDE5] text-lg">Garmin Connect</h3>
                                <p className="text-xs text-[#D7D5D2]/60">Integration coming soon</p>
                            </div>
                        </div>
                        <Button variant="outline" disabled className="bg-transparent border-[#D7D5D2]/10 text-[#D7D5D2]/40 uppercase text-[10px] tracking-widest w-full md:w-auto">
                            Unavailable
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
