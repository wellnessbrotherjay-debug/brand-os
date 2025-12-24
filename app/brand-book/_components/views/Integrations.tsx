
import React, { useState } from 'react';
import { useAppStore } from '../store';
import type { ConnectorConfig } from '../types';
import { Link2, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { MetaConnectModal } from '../components/MetaConnectModal';

const connectorDescriptions: Record<string, string> = {
    google_drive: 'Store and sync all brand assets with Google Drive.',
    notion: 'Sync briefs, docs and content calendars from Notion.',
    monday: 'Sync tasks and statuses from monday.com boards.',
    instagram: 'Schedule and publish posts via Instagram Graph API.',
    facebook: 'Schedule and publish posts to Facebook Pages.',
    youtube: 'Upload and schedule YouTube videos.',
    tiktok: 'Publish and track TikTok content.',
};

const IntegrationsPage: React.FC = () => {
    const { connectors, upsertConnector, connectSocialPlatform, disconnectSocialPlatform } = useAppStore();
    const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
    const [activeConnector, setActiveConnector] = useState<ConnectorConfig | null>(null);
    const [simulatingSync, setSimulatingSync] = useState<string | null>(null);

    const handleAction = async (connector: ConnectorConfig) => {
        // If disconnecting, use the store method to clear tokens and state
        if (connector.connected) {
            if (confirm(`Disconnect ${connector.label}?`)) {
                if (connector.type === 'facebook' || connector.type === 'instagram' || connector.type === 'google') {
                    await disconnectSocialPlatform(connector.type as any);
                } else {
                    // Fallback for non-auth connectors (mock for now)
                    upsertConnector({ ...connector, connected: false });
                }
            }
            return;
        }

        // If connecting Meta services (IG/FB), open the professional modal
        if (connector.type === 'instagram' || connector.type === 'facebook') {
            setActiveConnector(connector);
            setIsMetaModalOpen(true);
            return;
        }

        // For others, simulate a quick auth window/sync (Legacy/Mock)
        setSimulatingSync(connector.id);
        setTimeout(() => {
            upsertConnector({
                ...connector,
                connected: true,
                lastSyncAt: new Date().toISOString(),
            });
            setSimulatingSync(null);
        }, 1500);
    };

    const handleMetaSuccess = async () => {
        // Close modal and trigger REAL authentication
        setIsMetaModalOpen(false);

        // We prioritize Facebook Login for both IG and FB
        if (activeConnector?.type === 'instagram' || activeConnector?.type === 'facebook') {
            await connectSocialPlatform('facebook');
        }
        setActiveConnector(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-serif-brand">Integrations</h1>
                <p className="opacity-60 mt-1">Connect your Brand OS to external tools and social platforms.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map((c) => (
                    <div key={c.id} className={`bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${c.connected ? 'border-green-200' : 'border-black/5'}`}>

                        {/* Loading Overlay */}
                        {simulatingSync === c.id && (
                            <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-sm font-bold text-gray-500 animate-in fade-in">
                                <Loader2 className="animate-spin mb-2 text-black" />
                                Syncing Data...
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg">{c.label}</h3>
                            {c.connected ? <CheckCircle2 className="text-green-500" size={20} /> : <Link2 className="opacity-30" size={20} />}
                        </div>
                        <p className="text-sm opacity-60 mb-6 h-10 line-clamp-2">{connectorDescriptions[c.type] ?? ''}</p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold uppercase tracking-wider ${c.connected ? 'text-green-600' : 'text-gray-400'}`}>
                                    {c.connected ? 'Active' : 'Disconnected'}
                                </span>
                                {c.connected && (c.type === 'instagram' || c.type === 'facebook') && (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                                        <CheckCircle2 size={10} /> Business API
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => handleAction(c)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${c.connected ? 'bg-gray-100 text-black hover:bg-red-50 hover:text-red-600 border border-gray-200' : 'bg-black text-white hover:opacity-80'}`}
                            >
                                {c.connected ? 'Manage' : 'Connect'}
                            </button>
                        </div>
                        {c.connected && c.lastSyncAt && (
                            <div className="mt-2 text-[10px] opacity-40 text-right">
                                Synced: {new Date(c.lastSyncAt).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-xs flex items-center gap-3">
                <AlertCircle size={16} />
                <div>
                    <span className="font-bold block mb-1">Secure OAuth 2.0 Connection</span>
                    All integrations use official Business APIs. We never store your passwords directly. Tokens are encrypted at rest.
                </div>
            </div>

            <MetaConnectModal
                isOpen={isMetaModalOpen}
                onClose={() => setIsMetaModalOpen(false)}
                onConnect={handleMetaSuccess}
            />
        </div>
    );
};

export default IntegrationsPage;
