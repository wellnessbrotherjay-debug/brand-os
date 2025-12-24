
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Shield, Loader2, ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConnect: () => void;
}

export const MetaConnectModal: React.FC<Props> = ({ isOpen, onClose, onConnect }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    const handleContinue = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (step < 3) {
                setStep(step + 1);
            } else {
                onConnect();
            }
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-[500px] rounded-xl shadow-2xl overflow-hidden relative">
                {/* Meta Header */}
                <div className="bg-[#1877F2] p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="font-bold">Facebook</span>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>

                <div className="p-8 min-h-[300px] flex flex-col">
                    {step === 1 && (
                        <div className="flex-1 flex flex-col items-center text-center animate-in slide-in-from-right-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                <Shield className="text-[#1877F2] w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Connect to Hotel Solutions Brand OS</h3>
                            <p className="text-sm text-gray-500 mb-8">
                                Brand OS is requesting access to:
                            </p>
                            <div className="space-y-3 w-full text-left bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                                <div className="flex gap-3">
                                    <CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" />
                                    <span>Manage your ads and access insights.</span>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" />
                                    <span>Read content posted on the Page.</span>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" />
                                    <span>Manage accounts, settings, and webhooks.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex-1 animate-in slide-in-from-right-4">
                            <h3 className="font-bold mb-4">Select Business Portfolio</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                    <input type="radio" name="business" defaultChecked className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <p className="font-bold text-sm">Hotel Solutions Global</p>
                                        <p className="text-xs text-gray-500">ID: 882910293</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                    <input type="radio" name="business" className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <p className="font-bold text-sm">Client Accounts A</p>
                                        <p className="text-xs text-gray-500">ID: 112039485</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex-1 animate-in slide-in-from-right-4">
                            <h3 className="font-bold mb-4">Select Assets</h3>
                            <p className="text-xs text-gray-500 mb-4">Choose the Ad Accounts and Pages you want to connect.</p>
                            
                            <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y divide-gray-100">
                                <div className="p-3 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        <span className="text-sm font-medium">TS Suites Official</span>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                                </div>
                                <div className="p-3 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        <span className="text-sm font-medium">GLVT Fitness</span>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                                </div>
                                <div className="p-3 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        <span className="text-sm font-medium">Test Ad Account</span>
                                    </div>
                                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                        {step === 1 && (
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                        )}
                        <button 
                            onClick={handleContinue}
                            disabled={isLoading}
                            className="bg-[#1877F2] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : (step === 3 ? 'Connect' : 'Continue')}
                            {!isLoading && step < 3 && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
