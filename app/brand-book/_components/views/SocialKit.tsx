import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { generateCreativeCopy, searchInstagramUsers } from '../services/geminiService';
import { SocialSearchModal } from './SocialSearchModal';
import { TemplatesView as GlobalTemplatesView } from './Templates';
import {
    Instagram, Image as ImageIcon, CheckCircle2, Upload, LayoutGrid, Loader2,
    Sparkles, User, X, Youtube, Facebook, PlayCircle, Plus,
    Send, Video, Globe, ThumbsUp, ArrowRight, ArrowLeft, Share2,
    Rocket, Layers, BoxSelect, Maximize2, Monitor, Move, Split, MoreHorizontal, LogIn, Link as LinkIcon, PenTool,
    Linkedin, Smartphone, Search, Grid, Heart, MapPin, MessageCircle, RefreshCw, Camera, Eye, BarChart3, TrendingUp, Users, Hash, ExternalLink, Edit2, FileVideo, Activity, Save, FolderOpen, BookOpen, Twitter, Wand2,
    Copy, SmartphoneNfc, Scaling, Type, Download, Layout
} from 'lucide-react';
import { Highlight, SocialFeedItem, CreativeRequest, CreativeVersion, SocialConnection, BrandIdentity, Brand } from '../types';

// Logos URLs (Generic/Mock for UI)
const LOGO_IG = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png";
const LOGO_YT = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/2560px-YouTube_full-color_icon_%282017%29.svg.png";
const LOGO_TT = "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/2560px-TikTok_logo.svg.png";
const LOGO_FB = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png";
const LOGO_XHS = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Xiaohongshu_logo.svg/1200px-Xiaohongshu_logo.svg.png"; // Placeholder
const LOGO_DOUYIN = "https://upload.wikimedia.org/wikipedia/commons/2/23/Douyin_logo.svg";

// --- REUSABLE PHONE COMPONENT ---
const PhonePreview = ({
    platform,
    identity,
    brand,
    showStory,
    setShowStory,
    onUpdate,
    onEditHighlight,
    isLive = false,
    customTitle = null,
    overrideData = null
}: {
    platform: string,
    identity: BrandIdentity,
    brand: Brand,
    showStory: boolean,
    setShowStory: (v: boolean) => void,
    onUpdate?: (updates: Partial<BrandIdentity>) => void,
    onEditHighlight?: (index: number) => void,
    isLive?: boolean,
    customTitle?: string,
    overrideData?: any // For competitor mocks
}) => {
    const [tab, setTab] = useState<'posts' | 'reels' | 'tagged'>('posts');
    const { activeBrandId } = useAppStore();

    // Live Instagram Data State
    const [liveProfile, setLiveProfile] = useState<any>(null);
    const [liveMedia, setLiveMedia] = useState<any[]>([]);
    const [isLoadingLive, setIsLoadingLive] = useState(false);

    // Upload Handling Logic localized to the phone
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'grid' | 'story' | 'avatar' | 'cover' | 'banner', index?: number } | null>(null);

    // Fetch live Instagram data when isLive is true
    useEffect(() => {
        const fetchLiveData = async () => {
            if (!isLive || !activeBrandId || (platform !== 'Instagram' && platform !== 'Facebook')) return;

            setIsLoadingLive(true);
            try {
                // First, get Facebook Pages to find one with Instagram
                const { getFacebookPages, getInstagramProfile, getInstagramMedia, getFacebookProfile, getFacebookFeed } = await import('../services/metaService');
                const pagesResult = await getFacebookPages(activeBrandId);

                if (pagesResult.success && pagesResult.pages.length > 0) {

                    if (platform === 'Instagram') {
                        // Find first page with Instagram
                        const pageWithIG = pagesResult.pages.find((p: any) => p.hasInstagram);

                        if (pageWithIG) {
                            // Fetch Instagram profile
                            const profileResult = await getInstagramProfile(pageWithIG.id, activeBrandId);

                            if (profileResult.success) {
                                setLiveProfile(profileResult.profile);

                                // Fetch Instagram media
                                const mediaResult = await getInstagramMedia(
                                    profileResult.igBusinessAccountId,
                                    activeBrandId,
                                    12
                                );

                                if (mediaResult.success) {
                                    setLiveMedia(mediaResult.media);
                                }
                            }
                        }
                    } else if (platform === 'Facebook') {
                        // Find first page (assuming primary page)
                        const primaryPage = pagesResult.pages[0]; // TODO: Select specific page logic if multiple

                        if (primaryPage) {
                            const profileResult = await getFacebookProfile(primaryPage.id, activeBrandId);
                            if (profileResult.success) {
                                setLiveProfile(profileResult.profile);
                            }

                            const feedResult = await getFacebookFeed(primaryPage.id, activeBrandId, 10);
                            if (feedResult.success) {
                                setLiveMedia(feedResult.feed);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('[PhonePreview] Failed to fetch live data:', error);
            } finally {
                setIsLoadingLive(false);
            }
        };

        fetchLiveData();
    }, [isLive, activeBrandId, platform]);

    const data = overrideData || {
        name: liveProfile?.username || brand.name,
        tagline: liveProfile?.biography || identity.instagram_bio || brand.tagline,
        logo: liveProfile?.profilePictureUrl || identity.logo_primary_url,
        feed: liveMedia.length > 0 ? liveMedia : identity.instagram_feed,
        highlights: identity.instagram_highlights,
        website: liveProfile?.website || identity.instagram_website
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onUpdate && uploadTarget) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = reader.result as string;

                if (uploadTarget.type === 'grid' && typeof uploadTarget.index === 'number') {
                    // Update Grid Item
                    const currentFeed = [...(identity.instagram_feed || [])];
                    // Fill gaps if necessary
                    while (currentFeed.length <= uploadTarget.index) {
                        currentFeed[uploadTarget.index] = { id: crypto.randomUUID(), type: 'image', url: '' };
                    }
                    currentFeed[uploadTarget.index] = {
                        ...currentFeed[uploadTarget.index],
                        url: url,
                        type: 'image'
                    };
                    onUpdate({ instagram_feed: currentFeed });
                }
                else if (uploadTarget.type === 'story') {
                    // Add to story (using moodboard slot 0 as primary story for now)
                    const newConfig = { ...identity.brand_book_config };
                    const images = [...(newConfig.moodboard_images || [])];
                    if (images.length > 0) images[0] = url;
                    else images.push(url);
                    onUpdate({ brand_book_config: { ...newConfig, moodboard_images: images } });
                }
                else if (uploadTarget.type === 'avatar') {
                    onUpdate({ logo_primary_url: url });
                }
                else if (uploadTarget.type === 'cover') {
                    // Handle Facebook/LinkedIn covers
                    if (platform === 'Facebook') {
                        onUpdate({ facebook_config: { ...identity.facebook_config, cover_url: url } });
                    } else if (platform === 'LinkedIn') {
                        onUpdate({ linkedin_config: { ...identity.linkedin_config, cover_url: url } });
                    }
                }
                else if (uploadTarget.type === 'banner') {
                    // Handle YouTube banner
                    if (platform === 'YouTube') {
                        onUpdate({ youtube_config: { ...identity.youtube_config, banner_url: url } });
                    } else if (platform === 'Twitter') {
                        onUpdate({ twitter_config: { ...identity.twitter_config, header_url: url } });
                    }
                }

                setUploadTarget(null);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerUpload = (target: { type: 'grid' | 'story' | 'avatar' | 'cover' | 'banner', index?: number }) => {
        if (!onUpdate || overrideData) return; // Read-only mode or competitor mode
        setUploadTarget(target);
        fileInputRef.current?.click();
    };

    const handleHighlightClick = (index: number) => {
        if (onEditHighlight && !overrideData) {
            onEditHighlight(index);
        }
    };

    const addNewHighlight = () => {
        if (!onUpdate || overrideData) return;
        const newHighlights = [...(identity.instagram_highlights || [])];
        newHighlights.push({
            id: crypto.randomUUID(),
            title: 'New',
            cover_image: '',
            stories: [] // Initialize empty stories array
        });
        onUpdate({ instagram_highlights: newHighlights });
    }

    // --- RENDERERS ---

    if (showStory) {
        return (
            <div className="bg-black h-full relative cursor-pointer group">
                <div className="absolute top-4 left-4 h-1 w-[90%] bg-white/30 rounded-full overflow-hidden z-20">
                    <div className="h-full bg-white w-1/3"></div>
                </div>
                <div className="absolute top-8 left-4 flex items-center gap-2 z-20" onClick={() => setShowStory(false)}>
                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden border border-white/20">
                        {data.logo && <img src={data.logo} className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-white text-sm font-bold drop-shadow-md">{data.name}</span>
                    <span className="text-white/60 text-xs drop-shadow-md">2h</span>
                </div>

                {/* Story Image */}
                <div
                    className="w-full h-full relative"
                    onClick={() => triggerUpload({ type: 'story' })}
                >
                    <img
                        src={identity.brand_book_config?.moodboard_images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2940&auto=format&fit=crop"}
                        className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
                    />
                    {!overrideData && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                                <Camera size={32} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-8 left-0 right-0 px-4 flex gap-2 z-20">
                    <input className="bg-transparent border border-white/50 rounded-full px-4 py-2 text-white text-sm w-full placeholder-white/70 backdrop-blur-sm" placeholder="Send message..." />
                    <Heart className="text-white w-8 h-8 drop-shadow-md" />
                    <Send className="text-white w-8 h-8 drop-shadow-md" />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            </div>
        )
    }

    switch (platform) {
        case 'Instagram':
            return (
                <div className="bg-white text-black h-full overflow-y-auto custom-scrollbar relative">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <span className="font-bold text-lg flex items-center gap-1">
                            {data.name}
                            {isLive && <span className="bg-green-500 w-2 h-2 rounded-full ml-2 animate-pulse"></span>}
                        </span>
                        <div className="flex gap-4">
                            <Plus size={24} />
                            <div className="w-6 h-6 border-2 border-black rounded-lg"></div>
                        </div>
                    </div>
                    {/* Profile Info */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative group">
                                <div
                                    className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-purple-600 cursor-pointer"
                                    onClick={() => setShowStory(true)}
                                >
                                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                        {data.logo && <img src={data.logo} className="w-full h-full object-cover" />}
                                    </div>
                                </div>
                                {!isLive && !overrideData && (
                                    <div
                                        onClick={() => triggerUpload({ type: 'avatar' })}
                                        className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full cursor-pointer shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Edit2 size={10} />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-8 mr-4 text-center">
                                <div>
                                    <span className="font-bold block">
                                        {isLoadingLive ? '...' : (liveProfile?.mediaCount?.toLocaleString() || '1,204')}
                                    </span>
                                    <span className="text-xs">Posts</span>
                                </div>
                                <div>
                                    <span className="font-bold block">
                                        {isLoadingLive ? '...' : (liveProfile?.followersCount ?
                                            (liveProfile.followersCount >= 1000 ?
                                                `${(liveProfile.followersCount / 1000).toFixed(1)}k` :
                                                liveProfile.followersCount.toString()) :
                                            '14.2k')}
                                    </span>
                                    <span className="text-xs">Followers</span>
                                </div>
                                <div>
                                    <span className="font-bold block">
                                        {isLoadingLive ? '...' : (liveProfile?.followsCount?.toLocaleString() || '402')}
                                    </span>
                                    <span className="text-xs">Following</span>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <h2 className="font-bold">{data.name}</h2>
                            <p className="whitespace-pre-wrap text-sm">{data.tagline}</p>
                            {data.website && (
                                <a href="#" className="text-blue-900 font-bold text-sm block mt-1">{data.website}</a>
                            )}
                        </div>
                        <button className="w-full py-1.5 bg-gray-100 rounded font-bold text-sm mb-6">
                            {customTitle || (overrideData ? 'Follow' : 'Edit Profile')}
                        </button>

                        {/* Highlights */}
                        <div className="flex gap-4 overflow-x-auto pb-4 mb-2 no-scrollbar">
                            {data.highlights?.map((h: Highlight, i: number) => (
                                <div key={i} className="flex flex-col items-center gap-1 shrink-0 relative group">
                                    <div
                                        className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer relative"
                                        onClick={() => handleHighlightClick(i)}
                                    >
                                        {h.cover_image ? (
                                            <img src={h.cover_image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs truncate w-16 text-center">{h.title}</span>
                                </div>
                            ))}
                            {!isLive && !overrideData && (
                                <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={addNewHighlight}>
                                    <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                                        <Plus size={20} className="opacity-50" />
                                    </div>
                                    <span className="text-xs">New</span>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex border-t border-gray-200 mb-1">
                            <div
                                onClick={() => setTab('posts')}
                                className={`flex-1 py-3 flex justify-center cursor-pointer ${tab === 'posts' ? 'border-b border-black' : 'opacity-30'}`}
                            ><Grid size={20} /></div>
                            <div
                                onClick={() => setTab('reels')}
                                className={`flex-1 py-3 flex justify-center cursor-pointer ${tab === 'reels' ? 'border-b border-black' : 'opacity-30'}`}
                            ><Video size={20} /></div>
                            <div
                                onClick={() => setTab('tagged')}
                                className={`flex-1 py-3 flex justify-center cursor-pointer ${tab === 'tagged' ? 'border-b border-black' : 'opacity-30'}`}
                            ><User size={20} /></div>
                        </div>

                        {/* Content Grid */}
                        {tab === 'posts' && (
                            <div className="grid grid-cols-3 gap-0.5">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => {
                                    const feedItem = data.feed?.[index];
                                    const moodboardItem = identity.brand_book_config?.moodboard_images?.[index];
                                    const displayUrl = overrideData ? `https://source.unsplash.com/random/400x400?sig=${index}` : (feedItem?.url || moodboardItem);

                                    return (
                                        <div
                                            key={index}
                                            className="aspect-square bg-gray-100 relative group cursor-pointer"
                                            onClick={() => triggerUpload({ type: 'grid', index })}
                                        >
                                            {displayUrl ? (
                                                <img src={displayUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                    <Plus />
                                                </div>
                                            )}
                                            {/* Edit Overlay */}
                                            {!isLive && !overrideData && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-white text-[10px] font-bold border border-white px-2 py-1 rounded">CHANGE</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {tab === 'reels' && (
                            <div className="grid grid-cols-3 gap-0.5">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[9/16] bg-black relative group cursor-pointer">
                                        <div className="absolute bottom-1 left-1 text-white text-[10px] flex items-center gap-1">
                                            <PlayCircle size={10} /> 2.4k
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'TikTok':
            return (
                <div className="bg-black text-white h-full overflow-y-auto custom-scrollbar relative">
                    <div className="p-4 pt-8 text-center border-b border-white/10">
                        <h3 className="font-bold text-sm mb-6 flex items-center justify-center gap-2">
                            {identity.tiktok_config?.avatar_url || brand.name}
                            {isLive && <span className="bg-green-500 w-1.5 h-1.5 rounded-full"></span>}
                        </h3>
                        <div
                            className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-4 overflow-hidden border-2 border-white/20 cursor-pointer"
                            onClick={() => setShowStory(true)}
                        >
                            {data.logo && <img src={data.logo} className="w-full h-full object-cover" />}
                        </div>
                        <h2 className="font-bold text-lg mb-1">@{brand.name.replace(/\s/g, '').toLowerCase()}</h2>

                        <div className="flex justify-center gap-8 my-4 text-center">
                            <div><span className="font-bold block">120</span><span className="text-xs opacity-60">Following</span></div>
                            <div><span className="font-bold block">45.2k</span><span className="text-xs opacity-60">Followers</span></div>
                            <div><span className="font-bold block">1.2M</span><span className="text-xs opacity-60">Likes</span></div>
                        </div>

                        <button className="px-8 py-3 bg-[#FE2C55] text-white font-bold rounded-sm text-sm w-40">Follow</button>

                        <p className="mt-4 text-sm opacity-90 text-center whitespace-pre-wrap">{identity.tiktok_config?.bio || identity.instagram_bio}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-0.5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[3/4] bg-gray-800 relative group cursor-pointer">
                                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px]">
                                    <PlayCircle size={10} /> 12k
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'Facebook':
            return (
                <div className="bg-gray-100 text-black h-full overflow-y-auto custom-scrollbar relative">
                    {/* Facebook Header */}
                    <div className="bg-white pb-4 mb-2">
                        <div className="h-40 bg-gray-300 relative group cursor-pointer" onClick={() => triggerUpload({ type: 'cover' })}>
                            {liveProfile?.coverPhotoUrl ? (
                                <img src={liveProfile.coverPhotoUrl} className="w-full h-full object-cover" />
                            ) : identity?.facebook_config?.cover_url ? (
                                <img src={identity.facebook_config.cover_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full opacity-20"><ImageIcon /></div>
                            )}
                            {!isLive && !overrideData && <div className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full text-black shadow-sm text-xs font-bold flex items-center gap-1"><Camera size={12} /> Edit Cover</div>}
                        </div>
                        <div className="px-4 relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 -mt-16 relative group cursor-pointer overflow-hidden" onClick={() => triggerUpload({ type: 'avatar' })}>
                                {liveProfile?.profilePictureUrl ? (
                                    <img src={liveProfile.profilePictureUrl} className="w-full h-full object-cover" />
                                ) : data.logo ? (
                                    <img src={data.logo} className="w-full h-full object-cover" />
                                ) : null}
                                {!isLive && !overrideData && <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100"><Camera className="text-white" /></div>}
                            </div>
                            <h2 className="text-2xl font-bold mt-2 text-black">
                                {liveProfile?.name || data.name}
                                {isLive && <span className="bg-green-500 w-2 h-2 rounded-full ml-2 animate-pulse inline-block align-middle"></span>}
                            </h2>
                            <p className="text-gray-500 font-bold text-sm">
                                {isLoadingLive ? '...' : (liveProfile?.likes ? `${liveProfile.likes.toLocaleString()} likes` : '1.2K likes')} • {isLoadingLive ? '...' : (liveProfile?.followers ? `${liveProfile.followers.toLocaleString()} followers` : '1.4K followers')}
                            </p>

                            <div className="flex gap-2 mt-4">
                                <button className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                                    <MessageCircle size={16} /> WhatsApp
                                </button>
                                <button className="px-4 bg-gray-200 text-black font-bold py-2 rounded-lg text-sm">
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FB Feed */}
                    <div className="px-2 space-y-4 pb-10">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-sm font-bold mb-2">Intro</div>
                            <p className="text-sm text-gray-600 text-center py-4">{liveProfile?.about || identity.facebook_config?.bio || "Add a bio..."}</p>
                            {liveProfile?.website && (
                                <a href={liveProfile.website} target="_blank" className="text-blue-600 text-sm block text-center mt-2 truncate">{liveProfile.website}</a>
                            )}
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-bold">Posts</div>
                                <div className="text-xs text-blue-600">See all</div>
                            </div>

                            {/* Live Feed Items */}
                            {isLive && liveMedia.length > 0 ? (
                                <div className="space-y-4">
                                    {liveMedia.map((item: any) => (
                                        <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    {liveProfile?.profilePictureUrl && <img src={liveProfile.profilePictureUrl} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs">{liveProfile?.name || data.name}</p>
                                                    <p className="text-[10px] text-gray-500">{new Date(item.createdTime).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {item.message && <p className="text-sm mb-2">{item.message}</p>}
                                            {item.fullPicture && (
                                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                                                    <img src={item.fullPicture} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>{item.likesCount} Likes</span>
                                                <span>{item.commentsCount} Comments</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-100"></div>)}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            );

        case 'YouTube':
            return (
                <div className="bg-white text-black h-full overflow-y-auto custom-scrollbar relative">
                    <div className="h-24 bg-gray-200 relative group cursor-pointer" onClick={() => triggerUpload({ type: 'banner' })}>
                        {identity?.youtube_config?.banner_url && <img src={identity.youtube_config.banner_url} className="w-full h-full object-cover" />}
                        {!isLive && !overrideData && <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"><Camera size={12} /></div>}
                    </div>
                    <div className="px-4 py-4">
                        <div className="flex gap-3 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0 overflow-hidden" onClick={() => triggerUpload({ type: 'avatar' })}>
                                {data.logo && <img src={data.logo} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{data.name}</h2>
                                <p className="text-xs text-gray-600">@handle • 1.4M subscribers • 154 videos</p>
                                <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{identity.youtube_config?.bio || "More about this channel..."}</p>
                            </div>
                        </div>
                        <button className="w-full bg-black text-white font-bold text-sm py-2 rounded-full mb-6">Subscribe</button>

                        <div className="flex gap-4 border-b border-gray-100 mb-4 overflow-x-auto">
                            {['Home', 'Videos', 'Shorts', 'Live', 'Playlists'].map(t => (
                                <div key={t} className="pb-2 text-sm font-bold whitespace-nowrap first:border-b-2 first:border-black">{t}</div>
                            ))}
                        </div>

                        <div className="space-y-4 pb-10">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="aspect-video bg-gray-200 rounded-lg mb-2 relative group cursor-pointer" onClick={() => triggerUpload({ type: 'grid', index: i })}>
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400"><PlayCircle /></div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                                        <div>
                                            <div className="h-3 w-48 bg-gray-100 rounded mb-1"></div>
                                            <div className="h-2 w-24 bg-gray-100 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'LinkedIn':
            return (
                <div className="bg-[#F3F2EF] text-black h-full overflow-y-auto custom-scrollbar relative">
                    <div className="bg-white mb-2 pb-4">
                        <div className="h-24 bg-gray-300 relative group cursor-pointer" onClick={() => triggerUpload({ type: 'cover' })}>
                            {identity?.linkedin_config?.cover_url && <img src={identity.linkedin_config.cover_url} className="w-full h-full object-cover" />}
                            {!isLive && !overrideData && <div className="absolute top-2 right-2 bg-white p-1 rounded-sm"><Camera size={12} /></div>}
                        </div>
                        <div className="px-4 relative mb-2">
                            <div className="w-20 h-20 bg-white p-1 rounded-sm shadow-sm -mt-10 overflow-hidden cursor-pointer" onClick={() => triggerUpload({ type: 'avatar' })}>
                                {data.logo && <img src={data.logo} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex justify-between items-start mt-2">
                                <div>
                                    <h2 className="text-lg font-bold">{data.name}</h2>
                                    <p className="text-xs text-gray-600">Hospitality • 10,234 followers</p>
                                </div>
                                <img src={data.logo} className="w-8 h-8 object-contain" />
                            </div>
                            <button className="mt-3 bg-blue-600 text-white font-bold text-sm py-1 px-4 rounded-full flex items-center gap-1">
                                <Plus size={14} /> Follow
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-4 mb-2">
                        <h3 className="font-bold text-sm mb-2">About</h3>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{identity?.linkedin_config?.bio || identity.instagram_bio}</p>
                    </div>

                    <div className="bg-white p-4 mb-2">
                        <h3 className="font-bold text-sm mb-2">Posts</h3>
                        <div className="flex gap-2 border-b border-gray-100 mb-4 text-xs font-bold text-gray-500">
                            <span className="text-green-700 border-b-2 border-green-700 pb-1">Images</span>
                            <span>Documents</span>
                            <span>Videos</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-gray-100 rounded-sm relative" onClick={() => triggerUpload({ type: 'grid', index: i })}></div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        default:
            return <div>Select Platform</div>;
    }
};

// --- MODALS ---

const HighlightEditorModal = ({
    isOpen,
    onClose,
    highlight,
    onSave,
    onDelete
}: {
    isOpen: boolean,
    onClose: () => void,
    highlight: Highlight | null,
    onSave: (h: Highlight) => void,
    onDelete: () => void
}) => {
    const [title, setTitle] = useState(highlight?.title || '');
    const [cover, setCover] = useState(highlight?.cover_image || '');
    const [stories, setStories] = useState<any[]>(highlight?.stories || []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const storyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (highlight) {
            setTitle(highlight.title);
            setCover(highlight.cover_image);
            setStories(highlight.stories || []);
        }
    }, [highlight]);

    if (!isOpen || !highlight) return null;

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setCover(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newStory = {
                    id: crypto.randomUUID(),
                    image_url: reader.result as string,
                    caption: '',
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    timestamp: new Date().toISOString()
                };
                setStories([...stories, newStory]);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Edit Highlight</h3>

                <div className="flex flex-col items-center mb-6">
                    <div
                        className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative group cursor-pointer mb-2"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {cover ? (
                            <img src={cover} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400">
                                <ImageIcon size={32} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" />
                        </div>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 font-bold hover:underline">Change Cover</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Title</label>
                    <input
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Highlight Name"
                        maxLength={15}
                    />
                </div>

                {/* STORIES MANAGEMENT */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-50">Stories ({stories.length})</label>
                        <button
                            onClick={() => storyInputRef.current?.click()}
                            className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                        >
                            <Plus size={12} /> Add Story
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {stories.map((s, idx) => (
                            <div key={s.id || idx} className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden relative group">
                                <img src={s.image_url} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setStories(stories.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => storyInputRef.current?.click()}
                            className="aspect-[9/16] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleStoryUpload} />
                </div>

                <div className="flex gap-2">
                    <button onClick={onDelete} className="px-4 py-2 text-red-500 font-bold text-sm bg-red-50 rounded-lg hover:bg-red-100">Delete</button>
                    <div className="flex-1"></div>
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
                    <button
                        onClick={() => onSave({ ...highlight, title, cover_image: cover, stories })}
                        className="px-6 py-2 bg-black text-white font-bold text-sm rounded-lg"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const AssetSelectionModal = ({
    isOpen,
    onClose,
    slotLabel,
    currentImage,
    onSelect,
    onUpload
}: {
    isOpen: boolean,
    onClose: () => void,
    slotLabel: string,
    currentImage: string | null | undefined,
    onSelect: (url: string) => void,
    onUpload: (file: File) => void
}) => {
    const { assets } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter relevant assets (simple filtering for now)
    const templates = assets.filter(a => a.asset_type === 'image' || a.tags.includes('template'));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold">Select Asset</h3>
                        <p className="text-sm opacity-60">For: {slotLabel}</p>
                    </div>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="grid grid-cols-4 gap-4">
                        {/* Upload New Card */}
                        <div
                            className="aspect-square bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-blue-50 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mb-2 opacity-50" />
                            <span className="font-bold text-sm">Upload New</span>
                            <span className="text-[10px] opacity-50">from device</span>
                        </div>

                        {templates.map(asset => (
                            <div key={asset.id} className="group relative aspect-square bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={() => onSelect(asset.file_url)}>
                                <img src={asset.file_url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs truncate">{asset.title}</p>
                                </div>
                                {currentImage === asset.file_url && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                                        <CheckCircle2 size={12} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    if (e.target.files?.[0]) onUpload(e.target.files[0]);
                }} />
            </div>
        </div>
    );
};

const AddCompetitorModal = ({
    isOpen,
    onClose,
    onAdd
}: {
    isOpen: boolean,
    onClose: () => void,
    onAdd: (competitor: any) => void
}) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);
                const users = await searchInstagramUsers(query);
                setResults(users);
                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold">Add Competitor</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input
                            className="flex-1 text-sm outline-none"
                            placeholder="Search Instagram (e.g. nike, taschen)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {isSearching && <Loader2 size={16} className="animate-spin text-gray-400" />}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {results.length === 0 && query.length > 2 && !isSearching && (
                        <div className="text-center p-8 text-gray-400 text-sm">No results found.</div>
                    )}
                    {results.map(user => (
                        <div key={user.handle} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => onAdd(user)}>
                            <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" />
                            <div className="flex-1">
                                <h4 className="font-bold text-sm">{user.handle}</h4>
                                <p className="text-xs text-gray-500">{user.name}</p>
                            </div>
                            <Plus size={16} className="text-gray-400" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const SocialKit: React.FC = () => {
    const { activeBrandId, brands, identities, updateIdentity, creativeRequests, addCreativeRequest, addAsset, assets } = useAppStore();
    const activeBrand = brands.find(b => b.id === activeBrandId);
    const identity = identities.find(i => i.brand_id === activeBrandId);

    // Navigation State
    const [activeTab, setActiveTab] = useState<'profiles' | 'branding' | 'manager' | 'studio' | 'templates' | 'comparison'>('profiles');
    const [activePlatform, setActivePlatform] = useState<'Instagram' | 'YouTube' | 'TikTok' | 'Facebook' | 'LinkedIn' | 'Redbook' | 'Douyin'>('Instagram');

    // --- Comparison State ---
    const [comparisonMode, setComparisonMode] = useState<'internal' | 'competitive'>('internal');

    const [showTextComparison, setShowTextComparison] = useState(false);
    const [proposedIdentity, setProposedIdentity] = useState<BrandIdentity | null>(null);

    useEffect(() => {
        if (identity) setProposedIdentity({ ...identity });
    }, [identity]);

    // ... (Other states remain unchanged) ...
    const [editingHighlightIndex, setEditingHighlightIndex] = useState<number | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginHandle, setLoginHandle] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [showLiveDashboard, setShowLiveDashboard] = useState(false);

    // Quick Creator State
    const [creatorPrompt, setCreatorPrompt] = useState("");
    const [creatorPlatform, setCreatorPlatform] = useState("Instagram");
    const [creatorFormat, setCreatorFormat] = useState("Post");
    const [isCreating, setIsCreating] = useState(false);
    const [createdResult, setCreatedResult] = useState("");

    const manualUploadRef = useRef<HTMLInputElement>(null);
    const profileUploadRef = useRef<HTMLInputElement>(null);
    const feedUploadRef = useRef<HTMLInputElement>(null);
    const assetUploadRef = useRef<HTMLInputElement>(null);
    const [activeAssetUploadSlot, setActiveAssetUploadSlot] = useState<{ type: string, label: string } | null>(null);

    // ... (Handlers) ...

    const handleIdentityUpdate = (updates: any) => {
        updateIdentity({ ...identity, ...updates });
    };

    const handleProposedUpdate = (updates: any) => {
        if (proposedIdentity) setProposedIdentity({ ...proposedIdentity, ...updates });
    }

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && activeAssetUploadSlot) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = reader.result as string;

                // Generic update based on slot type string parsing
                const updates: any = {};
                if (activeAssetUploadSlot.type.includes('facebook')) {
                    updates.facebook_config = { ...identity?.facebook_config, cover_url: url };
                } else if (activeAssetUploadSlot.type.includes('youtube')) {
                    updates.youtube_config = { ...identity?.youtube_config, banner_url: url };
                } else if (activeAssetUploadSlot.type.includes('linkedin')) {
                    updates.linkedin_config = { ...identity?.linkedin_config, cover_url: url };
                } else if (activeAssetUploadSlot.type.includes('instagram')) {
                    // For Instagram we might just store in moodboard or specific fields
                    // Here we assume it's just an asset upload for now unless specified
                }

                handleIdentityUpdate(updates);

                // Add to global asset library
                if (activeBrandId) {
                    addAsset({
                        id: crypto.randomUUID(),
                        brand_id: activeBrandId,
                        asset_type: 'image',
                        title: activeAssetUploadSlot.label,
                        description: `Uploaded via Branding Tab`,
                        file_url: url,
                        tags: ['branding', activeAssetUploadSlot.type]
                    });
                }
                setActiveAssetUploadSlot(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleQuickCreate = () => {
        setIsCreating(true);
        setTimeout(() => {
            setCreatedResult(`Here is a draft caption based on your prompt:\n\n"Experience the ultimate luxury. ${creatorPrompt} #luxury #travel"`);
            setIsCreating(false);
        }, 1500);
    };

    // --- COMPETITOR DATA STATE ---
    // Now using identity.competitors instead of local state

    const [competitor, setCompetitor] = useState<string>(""); // Handle of selected competitor
    const [isAddCompetitorOpen, setIsAddCompetitorOpen] = useState(false);

    // Initial load
    useEffect(() => {
        if (identity?.competitors && identity.competitors.length > 0 && !competitor) {
            setCompetitor(identity.competitors[0].handle);
        }
    }, [identity]);

    const handleAddCompetitor = (newCompetitor: any) => {
        const updatedCompetitors = [...(identity?.competitors || [])];
        if (!updatedCompetitors.find(c => c.handle === newCompetitor.handle)) {
            updatedCompetitors.push(newCompetitor);
            handleIdentityUpdate({ competitors: updatedCompetitors });
        }
        setCompetitor(newCompetitor.handle);
        setIsAddCompetitorOpen(false);
    };


    // --- VIEWS ---

    const ComparisonView = () => {
        const selectedCompetitor = identity?.competitors?.find(c => c.handle === competitor);

        return (
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 px-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setComparisonMode('internal')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${comparisonMode === 'internal' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                        >
                            Internal (Before/After)
                        </button>
                        <button
                            onClick={() => setComparisonMode('competitive')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${comparisonMode === 'competitive' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                        >
                            Competitive (Us vs Them)
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {comparisonMode === 'competitive' && (
                            <div className="flex gap-2">
                                <select
                                    value={competitor}
                                    onChange={(e) => setCompetitor(e.target.value)}
                                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none min-w-[150px]"
                                >
                                    <option value="" disabled>Select Competitor</option>
                                    {identity?.competitors?.map(c => <option key={c.handle} value={c.handle}>{c.name}</option>)}
                                </select>
                                <button onClick={() => setIsAddCompetitorOpen(true)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"><Plus size={16} /></button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowTextComparison(!showTextComparison)}
                            className={`px-4 py-2 border rounded-lg text-sm font-bold flex items-center gap-2 ${showTextComparison ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}
                        >
                            <Type size={16} /> Text Talk
                        </button>
                    </div>
                </div>

                {/* Assessment Modal */}
                <AddCompetitorModal
                    isOpen={isAddCompetitorOpen}
                    onClose={() => setIsAddCompetitorOpen(false)}
                    onAdd={handleAddCompetitor}
                />

                {/* Comparison Grid */}
                <div className="flex-1 grid grid-cols-2 gap-8 px-8 pb-8 overflow-y-auto">
                    {/* LEFT: Current Brand */}
                    <div className="flex flex-col items-center">
                        <h3 className="font-bold mb-4 bg-gray-100 px-4 py-1 rounded-full text-xs uppercase tracking-wider">Current Live</h3>
                        <div className="shadow-2xl overflow-hidden bg-black border-[8px] border-black rounded-[2.5rem] relative w-[375px] h-[750px] shrink-0">
                            <div className="pt-8 h-full bg-white">
                                {identity && activeBrand && <PhonePreview
                                    platform="Instagram"
                                    identity={identity}
                                    brand={activeBrand}
                                    showStory={false}
                                    setShowStory={() => { }}
                                    isLive={true}
                                />}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Variable */}
                    <div className="flex flex-col items-center border-l border-dashed border-gray-200">
                        <h3 className="font-bold mb-4 bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs uppercase tracking-wider">
                            {comparisonMode === 'internal' ? 'Proposed Update' : (selectedCompetitor?.name || 'Select Competitor')}
                        </h3>

                        <div className="shadow-2xl overflow-hidden bg-black border-[8px] border-black rounded-[2.5rem] relative w-[375px] h-[750px] shrink-0">
                            <div className="pt-8 h-full bg-white">
                                {comparisonMode === 'internal' && proposedIdentity && activeBrand && (
                                    <PhonePreview
                                        platform="Instagram"
                                        identity={proposedIdentity}
                                        brand={activeBrand}
                                        showStory={false}
                                        setShowStory={() => { }}
                                        onUpdate={handleProposedUpdate} // Editable in this view
                                        customTitle="Edit Draft"
                                    />
                                )}
                                {comparisonMode === 'competitive' && selectedCompetitor && (
                                    <PhonePreview
                                        platform="Instagram"
                                        identity={identity!} // Dummy pass
                                        brand={activeBrand!} // Dummy pass
                                        showStory={false}
                                        setShowStory={() => { }}
                                        overrideData={{
                                            name: selectedCompetitor.name,
                                            tagline: selectedCompetitor.bio,
                                            logo: selectedCompetitor.avatar_url,
                                            website: selectedCompetitor.website
                                        }}
                                        customTitle="Follow"
                                    />
                                )}
                            </div>
                        </div>

                        {showTextComparison && (
                            <div className="mt-4 p-4 bg-white border border-blue-200 rounded-xl w-[375px] shadow-sm animate-in slide-in-from-top-2">
                                <h4 className="font-bold text-xs uppercase mb-2 opacity-50 text-blue-600">
                                    {comparisonMode === 'internal' ? 'Proposed Bio' : `${selectedCompetitor?.name} Bio`}
                                </h4>
                                <p className="text-sm">
                                    {comparisonMode === 'internal' ? proposedIdentity?.instagram_bio : selectedCompetitor?.bio}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const BrandingView = () => {
        // Helper component for visual preview
        const AssetPreview = ({ type, label, ratio, image, onUpload }: any) => {
            let containerClass = "bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-400";
            let sizeClass = "w-full h-full"; // Default square
            let placeholderIcon = <ImageIcon size={24} className="opacity-20" />;

            if (type === 'avatar') {
                containerClass += " rounded-full";
                sizeClass = "w-24 h-24";
                placeholderIcon = <User size={24} className="opacity-20" />;
            } else if (type === 'story') {
                containerClass += " rounded-xl";
                sizeClass = "w-24 h-[170px]"; // 9:16 approx
                placeholderIcon = <Smartphone size={24} className="opacity-20" />;
            } else if (type === 'post_portrait') {
                containerClass += " rounded-lg";
                sizeClass = "w-24 h-30"; // 4:5 approx
            } else if (type === 'cover') {
                containerClass += " rounded-lg";
                sizeClass = "w-64 h-24"; // Landscape
                placeholderIcon = <Layout size={24} className="opacity-20" />;
            } else if (type === 'banner') {
                containerClass += " rounded-lg";
                sizeClass = "w-64 h-16"; // Ultra wide
                placeholderIcon = <Layout size={24} className="opacity-20" />;
            } else {
                // Square
                containerClass += " rounded-lg";
                sizeClass = "w-32 h-32";
            }

            return (
                <div className="flex flex-col items-center gap-3 group">
                    <div
                        className={`${sizeClass} ${containerClass} relative flex items-center justify-center overflow-hidden cursor-pointer bg-white transition-all shadow-sm hover:shadow-md`}
                        onClick={onUpload}
                    >
                        {image ? (
                            <img src={image} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-300 flex flex-col items-center">
                                {placeholderIcon}
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider border border-white px-2 py-1 rounded">
                                {image ? 'Replace' : 'Upload'}
                            </span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-700">{label}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{ratio}</p>
                        {image ? (
                            <span className="text-[10px] text-green-600 flex items-center justify-center gap-1 mt-1 font-medium"><CheckCircle2 size={10} /> Designed</span>
                        ) : (
                            <span className="text-[10px] text-gray-400 mt-1 italic">Pending</span>
                        )}
                    </div>
                </div>
            )
        };

        const platforms = [
            {
                id: 'instagram', label: 'Instagram', color: 'pink',
                assets: [
                    { label: 'Profile Avatar', type: 'avatar', ratio: '320 x 320px', key: 'logo_primary_url' },
                    { label: 'Story Highlight', type: 'avatar', ratio: '1080 x 1080px', key: 'ig_highlight' },
                    { label: 'Post (Square)', type: 'square', ratio: '1080 x 1080px', key: 'ig_post_sq' },
                    { label: 'Story / Reel', type: 'story', ratio: '1080 x 1920px', key: 'ig_story' }
                ]
            },
            {
                id: 'facebook', label: 'Facebook', color: 'blue',
                assets: [
                    { label: 'Page Cover', type: 'cover', ratio: '820 x 312px', key: 'fb_cover' },
                    { label: 'Profile Picture', type: 'avatar', ratio: '170 x 170px', key: 'logo_primary_url' },
                    { label: 'Shared Image', type: 'cover', ratio: '1200 x 630px', key: 'fb_post' }
                ]
            },
            {
                id: 'youtube', label: 'YouTube', color: 'red',
                assets: [
                    { label: 'Channel Banner', type: 'banner', ratio: '2560 x 1440px', key: 'yt_banner' },
                    { label: 'Video Thumbnail', type: 'cover', ratio: '1280 x 720px', key: 'yt_thumb' },
                    { label: 'Profile Icon', type: 'avatar', ratio: '800 x 800px', key: 'logo_primary_url' }
                ]
            },
            {
                id: 'linkedin', label: 'LinkedIn', color: 'blue',
                assets: [
                    { label: 'Company Cover', type: 'cover', ratio: '1128 x 191px', key: 'li_cover' },
                    { label: 'Square Logo', type: 'square', ratio: '300 x 300px', key: 'logo_primary_url' },
                    { label: 'Post Image', type: 'cover', ratio: '1200 x 627px', key: 'li_post' }
                ]
            },
            {
                id: 'tiktok', label: 'TikTok', color: 'black',
                assets: [
                    { label: 'Profile Photo', type: 'avatar', ratio: '200 x 200px', key: 'logo_primary_url' },
                    { label: 'Video Cover', type: 'story', ratio: '1080 x 1920px', key: 'tt_cover' }
                ]
            },
            {
                id: 'redbook', label: 'Redbook', color: 'red',
                assets: [
                    { label: 'Profile Avatar', type: 'avatar', ratio: '1080 x 1080px', key: 'logo_primary_url' },
                    { label: 'Note Cover', type: 'post_portrait', ratio: '1242 x 1660px', key: 'rb_cover' }
                ]
            }
        ];

        const getAssetImage = (key: string) => {
            if (key === 'logo_primary_url') return identity?.logo_primary_url;
            // Check assets store for tagged items
            // In a real app, we'd have precise linking. Here we check tags.
            const found = assets.find(a => a.tags.includes(key));
            return found ? found.file_url : null;
        };

        return (
            <div className="h-full overflow-y-auto pb-20 p-8">
                <div className="grid grid-cols-1 gap-12">
                    {platforms.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
                            <div className={`p-4 border-b border-gray-100 flex items-center justify-between bg-${p.color}-50`}>
                                <h3 className="font-bold flex items-center gap-2 text-lg">{p.label}</h3>
                                <span className="text-xs opacity-50 font-mono bg-white px-2 py-1 rounded border border-black/5">{p.assets.length} Assets</span>
                            </div>
                            <div className="p-8 flex flex-wrap gap-8 items-end">
                                {p.assets.map((asset, idx) => (
                                    <AssetPreview
                                        key={idx}
                                        type={asset.type}
                                        label={asset.label}
                                        ratio={asset.ratio}
                                        image={getAssetImage(asset.key)}
                                        onUpload={() => {
                                            setActiveAssetUploadSlot({ type: asset.key, label: `${p.label} ${asset.label}` });
                                            assetUploadRef.current?.click();
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <input type="file" ref={assetUploadRef} className="hidden" accept="image/*" onChange={handleAssetUpload} />
            </div>
        );
    };

    const StudioView = () => (
        <div className="h-full flex items-center justify-center p-8 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-black/5 w-full max-w-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Quick Creative Studio</h2>
                    <p className="text-gray-500">Generate on-brand captions and ideas in seconds.</p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Platform</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm bg-gray-50"
                                value={creatorPlatform}
                                onChange={(e) => setCreatorPlatform(e.target.value)}
                            >
                                <option>Instagram</option>
                                <option>TikTok</option>
                                <option>LinkedIn</option>
                                <option>Redbook</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Format</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm bg-gray-50"
                                value={creatorFormat}
                                onChange={(e) => setCreatorFormat(e.target.value)}
                            >
                                <option>Post</option>
                                <option>Story</option>
                                <option>Reel / Video</option>
                                <option>Carousel</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">What's this about?</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-4 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="e.g. A new summer cocktail menu featuring local fruits..."
                            value={creatorPrompt}
                            onChange={(e) => setCreatorPrompt(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleQuickCreate}
                        disabled={isCreating || !creatorPrompt}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                        {isCreating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        {isCreating ? 'Working Magic...' : 'Generate Creative'}
                    </button>

                    {createdResult && (
                        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-xl relative animate-in fade-in slide-in-from-bottom-2">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-black" onClick={() => navigator.clipboard.writeText(createdResult)}>
                                <Copy size={16} />
                            </button>
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Result</h4>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{createdResult}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-serif-brand">Social Kit</h1>
                    <p className="opacity-60">Unified Command Center for {activeBrand?.name}.</p>
                </div>
                {identity?.logo_primary_url && (
                    <img src={identity.logo_primary_url} alt="Logo" className="h-12 w-auto opacity-90 object-contain" />
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
                <button onClick={() => setActiveTab('profiles')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'profiles' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                    Profiles & Editor
                </button>
                <button onClick={() => setActiveTab('branding')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'branding' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                    Branding Assets
                </button>
                <button onClick={() => setActiveTab('comparison')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'comparison' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                    Comparison
                </button>
                <button onClick={() => setActiveTab('manager')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'manager' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                    Account Manager
                </button>
                <button onClick={() => setActiveTab('studio')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'studio' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                    Creative Studio
                </button>
                <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'templates' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                    Templates
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {activeTab === 'profiles' && (
                    // Inline Profiles View logic to use updated PhonePreview
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                        {/* Sidebar / Editor */}
                        <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden">
                            <div className="p-6 border-b border-black/5">
                                <h2 className="text-xl font-bold mb-4">Profile Editor</h2>
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
                                    {(['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setActivePlatform(p)}
                                            className={`px-3 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activePlatform === p ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Avatar / Cover */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 border border-black/10 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => profileUploadRef.current?.click()}>
                                        {identity?.logo_primary_url && <img src={identity.logo_primary_url} className="w-full h-full object-cover" />}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Camera className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <button onClick={() => profileUploadRef.current?.click()} className="text-xs bg-black text-white px-3 py-2 rounded font-bold mb-1 block">Change Avatar</button>
                                        <p className="text-[10px] opacity-50">Recommended: 1080x1080px</p>
                                        <input type="file" ref={profileUploadRef} className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => handleIdentityUpdate({ logo_primary_url: reader.result });
                                                reader.readAsDataURL(e.target.files[0]);
                                            }
                                        }} />
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Bio / Description</label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-lg p-3 text-sm h-32 bg-white"
                                            placeholder={`Enter your ${activePlatform} bio...`}
                                            value={
                                                activePlatform === 'Instagram' ? identity?.instagram_bio :
                                                    activePlatform === 'TikTok' ? (identity?.tiktok_config?.bio || identity?.instagram_bio) :
                                                        activePlatform === 'YouTube' ? (identity?.youtube_config?.bio || activeBrand?.tagline) :
                                                            activeBrand?.tagline
                                            }
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (activePlatform === 'Instagram') handleIdentityUpdate({ instagram_bio: val });
                                                if (activePlatform === 'TikTok') handleIdentityUpdate({ tiktok_config: { ...identity?.tiktok_config, bio: val } });
                                                if (activePlatform === 'YouTube') handleIdentityUpdate({ youtube_config: { ...identity?.youtube_config, bio: val } });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mockup Preview */}
                        <div className="lg:col-span-7 bg-gray-100 rounded-xl border border-black/5 flex items-center justify-center p-8 relative">
                            <div className={`shadow-2xl overflow-hidden bg-black border-[8px] border-black rounded-[2.5rem] relative transition-all duration-300 ${activePlatform === 'YouTube' || activePlatform === 'Facebook' || activePlatform === 'LinkedIn' ? 'w-[375px] h-[750px]' : 'w-[350px] h-[720px]'}`}>
                                <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 z-50 flex justify-between px-6 items-center text-[10px] text-white font-bold backdrop-blur-sm pointer-events-none">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div className="pt-8 h-full bg-white">
                                    {identity && activeBrand && <PhonePreview
                                        platform={activePlatform}
                                        identity={identity}
                                        brand={activeBrand}
                                        showStory={false}
                                        setShowStory={() => { }}
                                        onUpdate={handleIdentityUpdate}
                                        onEditHighlight={(index) => setEditingHighlightIndex(index)}
                                    />}
                                </div>
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-50 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'branding' && <BrandingView />}
                {activeTab === 'comparison' && <ComparisonView />}
                {activeTab === 'manager' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-lg">Connected Accounts</h2>
                                <button
                                    onClick={() => setIsSearchModalOpen(true)}
                                    className="text-xs bg-black text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                                >
                                    <Search size={14} /> Find & Connect
                                </button>
                            </div>
                            <div className="space-y-4">
                                {identity?.social_connections?.map(conn => (
                                    <div key={conn.platform} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-black/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${conn.isConnected ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                {conn.platform[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{conn.platform}</h3>
                                                <p className="text-xs opacity-60">{conn.handle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs font-bold">{conn.followerCount}</p>
                                                <p className="text-[10px] opacity-50">Followers</p>
                                            </div>
                                            <button className={`px-4 py-2 rounded text-xs font-bold ${conn.isConnected ? 'bg-white border border-gray-200 text-red-500' : 'bg-black text-white'}`}>
                                                {conn.isConnected ? 'Disconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!identity?.social_connections || identity.social_connections.length === 0) && (
                                    <div className="text-center py-8 text-gray-400">No social connections found in Identity Hub.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                            <h2 className="font-bold text-lg mb-4">Advertising Integrations</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-black/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Meta Ads Manager</h3>
                                            <p className="text-xs opacity-60">Sync campaigns & audiences</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 rounded text-xs font-bold bg-black text-white hover:opacity-80">Connect</button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-black/5">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200">
                                        <div className="text-xl">G</div>
                                    </div>
                                    <div className="flex-1 px-4">
                                        <h3 className="font-bold">Google Ads</h3>
                                        <p className="text-xs opacity-60">Search & Display network</p>
                                    </div>
                                    <button className="px-4 py-2 rounded text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">Coming Soon</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'studio' && <StudioView />}
                {activeTab === 'templates' && <GlobalTemplatesView />}

                {/* Modals */}
                <HighlightEditorModal
                    isOpen={editingHighlightIndex !== null}
                    onClose={() => setEditingHighlightIndex(null)}
                    highlight={editingHighlightIndex !== null && identity?.instagram_highlights ? identity.instagram_highlights[editingHighlightIndex] : null}
                    onSave={(updatedHighlight) => {
                        if (identity?.instagram_highlights && editingHighlightIndex !== null) {
                            const newHighlights = [...identity.instagram_highlights];
                            newHighlights[editingHighlightIndex] = updatedHighlight;
                            handleIdentityUpdate({ instagram_highlights: newHighlights });
                            setEditingHighlightIndex(null);
                        }
                    }}
                    onDelete={() => {
                        if (identity?.instagram_highlights && editingHighlightIndex !== null) {
                            const newHighlights = identity.instagram_highlights.filter((_, i) => i !== editingHighlightIndex);
                            handleIdentityUpdate({ instagram_highlights: newHighlights });
                            setEditingHighlightIndex(null);
                        }
                    }}
                />

                <SocialSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                />

                <AssetSelectionModal
                    isOpen={activeAssetUploadSlot !== null}
                    onClose={() => setActiveAssetUploadSlot(null)}
                    slotLabel={activeAssetUploadSlot?.label || 'Asset'}
                    currentImage={null}
                    onSelect={(url) => {
                        const updates: any = {};
                        if (activeAssetUploadSlot?.type.includes('facebook')) {
                            updates.facebook_config = { ...identity?.facebook_config, cover_url: url };
                        } else if (activeAssetUploadSlot?.type.includes('youtube')) {
                            updates.youtube_config = { ...identity?.youtube_config, banner_url: url };
                        } else if (activeAssetUploadSlot?.type.includes('linkedin')) {
                            updates.linkedin_config = { ...identity?.linkedin_config, cover_url: url };
                        }

                        if (Object.keys(updates).length > 0) handleIdentityUpdate(updates);
                        setActiveAssetUploadSlot(null);
                    }}
                    onUpload={(file) => {
                        // Fallback upload handling or future implementation
                    }}
                />
            </div>
        </div>
    );
};