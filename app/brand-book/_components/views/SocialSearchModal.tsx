
import React, { useState } from 'react';
import { X, Search, Instagram, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { useAppStore } from '../store';

interface SocialSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SocialSearchModal: React.FC<SocialSearchModalProps> = ({ isOpen, onClose }) => {
    const { searchSocialAccounts, linkSocialAccount, activeBrandId, identities } = useAppStore();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    if (!isOpen) return null;

    const identity = identities.find(i => i.brand_id === activeBrandId);
    // Find Instagram connection safely
    const existingConnection = identity?.social_connections?.find(c => c.platform === 'Instagram' && c.isConnected);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await searchSocialAccounts(query);
            if (data) {
                setResult(data);
            } else {
                setError('Account not found or limit reached.');
            }
        } catch (e) {
            setError('Failed to search. Ensure you have a working Meta token.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLink = async () => {
        if (!result) return;
        setIsLinking(true);
        try {
            await linkSocialAccount('Instagram', result);
            onClose();
            // Optional: Toast success
        } catch (e) {
            console.error("Link failed", e);
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold font-serif text-gray-900">Connect Social Identity</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Search Instagram Business Accounts</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="e.g. apple, nike, glvt_fitness"
                                className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all shadow-sm"
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <div className="absolute right-2 top-2">
                                <button
                                    onClick={handleSearch}
                                    disabled={isLoading || !query}
                                    className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Uses Meta Business Discovery API. Queries public data for Business/Creator accounts.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                            <CheckCircle2 size={16} className="rotate-45" /> {error}
                        </div>
                    )}

                    {result && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm animate-in slide-in-from-bottom-2">
                            <div className="flex items-start gap-4">
                                <img src={result.profile_picture_url} className="w-16 h-16 rounded-full object-cover border border-gray-100 shadow-md bg-gray-100" alt={result.username} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-900 truncate">{result.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">@{result.username}</p>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                        <span><strong className="text-gray-900">{result.followers_count.toLocaleString()}</strong> followers</span>
                                        <span><strong className="text-gray-900">{result.media_count}</strong> posts</span>
                                    </div>
                                    <p className="text-sm mt-3 text-gray-700 line-clamp-2 leading-relaxed">{result.biography}</p>
                                    {result.website && (
                                        <a href={result.website} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline font-medium">
                                            <Globe size={12} /> {result.website}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleLink}
                                    disabled={isLinking}
                                    className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transform transition-all active:scale-95"
                                >
                                    {isLinking ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={18} />}
                                    Link this Identity
                                </button>
                            </div>
                        </div>
                    )}

                    {!result && existingConnection && (
                        <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center gap-3">
                            <CheckCircle2 size={24} className="text-green-600" />
                            <div>
                                <p className="font-bold">Currently Linked</p>
                                <p className="text-sm">Connected to <span className="font-mono font-bold">{existingConnection.handle}</span></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
