
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import {
    AppState, Brand, BrandStrategySection, BrandIdentity, BrandAsset, Project, TeamMember, LLMSettings,
    ContentIdea, ContentPost, ContentPillar, StrategySectionType,
    Room, Booking, Affiliate, ServiceItem, FinanceEntry, MenuItem,
    CreativeRequest, SocialConnection, ConnectorConfig, ActivityLogItem, Campaign, PostStatus, BrandTemplate, SocialJob,
    MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, AnalyticsNotification, Task, TaskStatus, TaskPriority,
    ChatThread, ChatMessage, Pod, PodType, PodFile,
    CreativePrompt, GeneratedAsset, Moodboard,
    VideoProject, VideoScene, AvatarProfile, KnowledgeSource, User
} from './types';
import {
    getMetaAccounts, getMetaCampaigns, getMetaAdSets, getMetaAds,
    getInstagramBusinessAccountId, searchInstagramAccounts, debugMetaConnection
} from './services/metaService';
import { loginWithFacebook, saveSocialToken, checkUrlForToken, deleteSocialToken } from './services/authService';

// --- TS UNIVERSE BRAND DATA ---

const MOCK_USER: User = {
    id: 'u1',
    name: 'Jay',
    email: 'jay@hotelwellness.com',
    role: 'admin',
    permissions: {
        can_view_pods: ['brand', 'marketing', 'creative', 'projects', 'operations', 'analytics', 'team'],
        can_edit_pods: ['brand', 'marketing', 'creative', 'projects', 'operations', 'analytics', 'team'],
        can_upload: true,
        can_approve: true,
        can_publish: true,
        can_manage_team: true
    },
    brand_ids: ['ts-suites', 'ts-residence', 'ts-social', 'no-wellness', 'glvt-fitness'],
    created_at: new Date().toISOString()
};

const BRAND_IDS = {
    SUITES: 'ts-suites',
    RESIDENCE: 'ts-residence',
    SOCIAL: 'ts-social',
    WELLNESS: 'no-wellness',
    GLVT: 'glvt-fitness'
};

const initialBrands: Brand[] = [
    {
        id: BRAND_IDS.SUITES,
        name: 'TS Suites',
        tagline: 'Rest beautifully, wake renewed.',
        niche: 'Short-term Luxury Hospitality',
        what_you_sell: 'Spacious suites, rooftop pool, personalized concierge.',
        who_you_help: 'Travellers seeking a sanctuary in the heart of the action.',
        transformation: 'From exhausted tourist to revitalized guest.',
        difference: 'Room to breathe, artful design, and deep sleep.',
        emotions: 'Peaceful, Pampered, Free',
        values: 'Elegance, Privacy, Comfort',
        personality: 'The Host (Welcoming, Refined)'
    },
    // ... (rest of brands, kept for brevity) ...
    {
        id: BRAND_IDS.GLVT,
        name: 'GLVT',
        tagline: 'Strength made elegant.',
        niche: 'Boutique Women’s Fitness',
        what_you_sell: 'Glute-focused training, pilates, strength classes.',
        who_you_help: 'Women wanting to build strength and confidence.',
        transformation: 'From uncertain to empowered.',
        difference: 'Aesthetic, supportive, high-performance environment.',
        emotions: 'Confident, Sexy, Powerful',
        values: 'Strength, Beauty, Empowerment',
        personality: 'The Coach (Motivating, Chic)'
    }
];

// --- IDENTITIES ---
const baseIdentity = {
    font_heading: 'Cormorant Garamond',
    font_body: 'Inter',
    image_style: 'Sensual Minimalism. Warm natural light, soft shadows and textures.',
    video_style: 'Slow, fluid motions highlighting rituals.',
    do_nots: 'No bright neon colors. No eco-green cliches.',
    logo_rules: 'Clear space equal to height of "G". Minimum size 80px.',
    typography_rules: 'Headlines: Cormorant Garamond. Body: Montserrat/Inter.',
    brand_book_config: { moodboard_images: ['', '', '', '', '', ''] },
    ui_config: { use_identity_theme: true },
    content_mix: [
        { label: 'Editorial', percentage: 33, color_hex: '#000000' },
        { label: 'Lifestyle', percentage: 33, color_hex: '#9ca3af' },
        { label: 'Education', percentage: 34, color_hex: '#e5e7eb' }
    ],
    instagram_bio: 'Strength made elegant.',
    instagram_highlights: [
        { id: 'h1', title: 'Classes', cover_image: '', stories: [] },
    ],
    instagram_feed: [],
    instagram_tagged: [],
    social_connections: [
        { platform: 'Instagram', handle: '@ts_suites', isConnected: true, followerCount: '14.2k' },
        { platform: 'Facebook', handle: 'TS Suites Official', isConnected: false, followerCount: '0' },
        { platform: 'YouTube', handle: 'TS Suites TV', isConnected: false, followerCount: '0' },
        { platform: 'TikTok', handle: '@tssuites', isConnected: false, followerCount: '0' },
        { platform: 'LinkedIn', handle: 'TS Suites Hospitality', isConnected: false, followerCount: '0' },
        { platform: 'Redbook', handle: 'TS_Bali', isConnected: false, followerCount: '0' },
        { platform: 'Douyin', handle: 'TS_Douyin', isConnected: false, followerCount: '0' },
    ] as SocialConnection[],
    youtube_config: {},
    tiktok_config: {},
    facebook_config: {},
    linkedin_config: {},
    twitter_config: {},
};

const initialIdentities: BrandIdentity[] = initialBrands.map(b => ({
    id: `id-${b.id}`,
    brand_id: b.id,
    ...baseIdentity,
    color_primary_hex: '#Fdfcf8',
    color_secondary_hex: '#E5D2C4',
    color_accent_hex: '#C9A878',
    color_palette_description: 'Standard palette.',
    avatars: []
}));

// --- TEAM & PROJECT MOCK ---
const initialTeam: TeamMember[] = [
    { id: 'tm1', name: 'Sarah Jenkins', role: 'Marketing', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'sarah@hotel.com', status: 'active' },
    { id: 'tm2', name: 'David Lee', role: 'Design', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', email: 'david@hotel.com', status: 'active' },
    { id: 'tm3', name: 'Monica Geller', role: 'Creative', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', email: 'monica@hotel.com', status: 'active' },
    { id: 'tm4', name: 'Admin User', role: 'Admin', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', email: 'admin@hotel.com', status: 'active' }
];

const initialProjects: Project[] = [
    { id: 'p1', brand_id: BRAND_IDS.GLVT, name: 'Summer Shred Campaign', description: 'Q3 Major acquisition campaign focusing on 30-day challenges.', status: 'In Progress', members: ['tm1', 'tm2'], deadline: '2025-07-01', icon: '☀️' },
    { id: 'p2', brand_id: BRAND_IDS.GLVT, name: 'Website Rebrand', description: 'Overhaul of landing pages and booking flow.', status: 'Planning', members: ['tm2', 'tm3', 'tm4'], deadline: '2025-09-15', icon: '💻' }
];

const initialTasks: Task[] = [
    {
        id: 't1', project_id: 'p1', title: 'Design Campaign Key Visuals', description: 'Create hero images for the campaign.',
        assigned_to: 'tm2', status: 'in_progress', priority: 'urgent', created_by: 'tm1',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(), dependencies: []
    },
    {
        id: 't2', project_id: 'p1', title: 'Copywriting for Ad Set 1', description: 'Draft 5 variants of ad copy.',
        assigned_to: 'tm1', status: 'needs_review', priority: 'normal', created_by: 'tm1',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(), dependencies: []
    },
    {
        id: 't3', project_id: 'p1', title: 'Setup Meta Ad Account', description: 'Ensure pixel is firing correctly.',
        assigned_to: 'tm4', status: 'not_started', priority: 'urgent', created_by: 'tm1',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(), dependencies: []
    }
];

// Initial Chat Data
const initialThreads: ChatThread[] = [
    { id: 'th1', type: 'task', reference_id: 't1', participant_ids: ['tm1', 'tm2'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const initialMessages: ChatMessage[] = [
    { id: 'm1', thread_id: 'th1', author_id: 'tm1', message: 'I need the high-res logos for this one.', created_at: new Date(Date.now() - 86400000).toISOString(), read_by: ['tm1'] },
    { id: 'm2', thread_id: 'th1', author_id: 'tm2', message: 'Sure, uploading them to Assets now.', created_at: new Date().toISOString(), read_by: ['tm2'] }
];

// Initial Pods
const initialPods: Pod[] = [
    { id: 'pod_mkt', type: 'marketing', name: 'Global Marketing', description: 'Campaign planning and execution.', owner_id: 'tm1', team_member_ids: ['tm1', 'tm2'], visibility: 'team', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'pod_create', type: 'creative', name: 'Creative Studio', description: 'Design, Video, and Asset production.', owner_id: 'tm2', team_member_ids: ['tm2', 'tm3', 'tm4'], visibility: 'team', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'pod_ops', type: 'operations', name: 'Hotel Ops', description: 'On-site logistics and guest experience.', owner_id: 'tm3', team_member_ids: ['tm3', 'tm4'], visibility: 'private', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Initial Pod Files
const initialPodFiles: PodFile[] = [
    { id: 'pf1', pod_id: 'pod_mkt', name: 'Q3_Campaign_Brief.pdf', file_url: '#', file_type: 'pdf', size_bytes: 2500000, uploaded_by: 'tm1', version: 1, created_at: new Date().toISOString() },
    { id: 'pf2', pod_id: 'pod_mkt', name: 'Influencer_List_v2.xlsx', file_url: '#', file_type: 'xlsx', size_bytes: 45000, uploaded_by: 'tm1', version: 2, parent_version_id: 'pf2_old', created_at: new Date().toISOString() },
    { id: 'pf3', pod_id: 'pod_create', name: 'Logo_Pack_Final.zip', file_url: '#', file_type: 'zip', size_bytes: 145000000, uploaded_by: 'tm2', version: 1, created_at: new Date().toISOString() }
];

// Initial Moodboards
const initialMoodboards: Moodboard[] = [
    { id: 'mb1', pod_id: 'pod_create', name: 'Q4 Visual Concept', asset_ids: [], layout: 'grid', created_by: 'tm2', created_at: new Date().toISOString() }
];

// Initial Video Projects
const initialVideoProjects: VideoProject[] = [
    { id: 'vp1', pod_id: 'pod_mkt', name: 'Summer Promo Reel', script: '', visual_style: 'Energetic', format: 'reel', duration_seconds: 15, status: 'script', created_by: 'tm1', created_at: new Date().toISOString() }
];

// Initial Assets for Q3 Campaign to show board functionality
const initialAssets: BrandAsset[] = [
    {
        id: 'a1', brand_id: BRAND_IDS.GLVT, project_id: 'p1', asset_type: 'image',
        title: 'Hero Banner Q3', description: 'Main hero for landing page',
        file_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
        tags: ['hero', 'web'], status: 'Approved'
    },
    {
        id: 'a2', brand_id: BRAND_IDS.GLVT, project_id: 'p1', asset_type: 'image',
        title: 'IG Story - Monday', description: 'Motivation monday story',
        file_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        tags: ['social', 'story'], status: 'Draft'
    },
    {
        id: 'a3', brand_id: BRAND_IDS.GLVT, project_id: 'p1', asset_type: 'image',
        title: 'FB Ad Variant A', description: 'Testing blue background',
        file_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
        tags: ['ads', 'fb'], status: 'In Review'
    }
];

const initialConnectors: ConnectorConfig[] = [
    { id: 'drive', type: 'google_drive', label: 'Google Drive', connected: false },
    { id: 'notion', type: 'notion', label: 'Notion', connected: false },
    { id: 'monday', type: 'monday', label: 'monday.com', connected: false },
    { id: 'meta', type: 'instagram', label: 'Instagram (via Meta)', connected: false },
    { id: 'facebook', type: 'facebook', label: 'Facebook', connected: false },
    { id: 'youtube', type: 'youtube', label: 'YouTube', connected: false },
    { id: 'tiktok', type: 'tiktok', label: 'TikTok', connected: false },
];

const initialCampaigns: Campaign[] = [];

// --- META ADS DATA MOCK ---
const initialMetaAccounts: MetaAdAccount[] = [];
const initialMetaCampaigns: MetaCampaign[] = [];
const initialMetaAdSets: MetaAdSet[] = [];
const initialMetaAds: MetaAd[] = [];

const initialSocialJobs: SocialJob[] = [
    {
        id: 'j1',
        brand_id: BRAND_IDS.GLVT,
        title: 'November Promo Push',
        brief: 'Promote the 30-day challenge. Key message: Consistency beats intensity. Use vibrant, energetic visuals.',
        status: 'design',
        due_date: '2025-11-20',
        channels: ['instagram', 'facebook'],
        posts: [
            { id: 'jp1', brand_id: BRAND_IDS.GLVT, job_id: 'j1', platform: 'Instagram', title: 'Day 1 Post', caption: 'Start today. Not tomorrow. #challenge', media_urls: [], status: 'pending_design', scheduled_for: '2025-11-01T09:00:00', metrics_views: 0, metrics_likes: 0, metrics_comments: 0, metrics_saves: 0, metrics_shares: 0 },
            { id: 'jp2', brand_id: BRAND_IDS.GLVT, job_id: 'j1', platform: 'Facebook', title: 'Community Highlight', caption: 'Look at our amazing members crushing it!', media_urls: [], status: 'pending_design', scheduled_for: '2025-11-03T10:00:00', metrics_views: 0, metrics_likes: 0, metrics_comments: 0, metrics_saves: 0, metrics_shares: 0 }
        ]
    }
];

const initialTemplates: BrandTemplate[] = [
    {
        id: 't1',
        name: 'Standard Post',
        brand_id: BRAND_IDS.GLVT,
        channel: 'Instagram',
        type: 'Post',
        dimensions: { width: 1080, height: 1080 },
        layers: [
            {
                id: 'l1',
                type: 'text',
                content: 'Headline Here',
                x: 10, y: 10, width: 80, height: 20, rotation: 0,
                style: { fontSize: 40, color: '#000', zIndex: 1 }
            }
        ],
        tags: ['basic']
    }
];

// --- MOCK NOTIFICATIONS ---
const initialNotifications: AnalyticsNotification[] = [
    { id: 'n1', brand_id: BRAND_IDS.GLVT, type: 'new_follower', user: 'jessica_runs', platform: 'Instagram', content: 'started following you', timestamp: '2025-11-15T09:00:00', read: false, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 'n2', brand_id: BRAND_IDS.GLVT, type: 'comment', user: 'mike_lifts', platform: 'Instagram', content: 'commented: "This program changed my life! 🔥"', timestamp: '2025-11-15T08:45:00', read: false, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { id: 'n3', brand_id: BRAND_IDS.GLVT, type: 'mention', user: 'fit_community_hq', platform: 'Facebook', content: 'mentioned you in a post', timestamp: '2025-11-14T14:30:00', read: true, avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100' },
    { id: 'n4', brand_id: BRAND_IDS.GLVT, type: 'new_follower', user: 'sarah_p', platform: 'TikTok', content: 'started following you', timestamp: '2025-11-14T12:00:00', read: true, avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
];

// --- STORE SETUP ---

interface StoreContextType extends AppState {
    addBrand: (brand: Brand) => void;
    updateBrand: (id: string, updates: Partial<Brand>) => void;
    setActiveBrand: (id: string) => void;
    addStrategySections: (sections: BrandStrategySection[]) => void;
    updateStrategySection: (id: string, content: string) => void;
    updateIdentity: (identity: BrandIdentity) => void;
    addContentIdeas: (ideas: ContentIdea[]) => void;
    updateContentIdeaStatus: (id: string, status: ContentIdea['status']) => void;
    addContentPost: (post: ContentPost) => void;
    updateContentPost: (id: string, updates: Partial<ContentPost>) => void;
    deleteContentPost: (id: string) => void;
    changePostStatus: (id: string, status: PostStatus) => void;
    addAsset: (asset: BrandAsset) => void;
    updateAsset: (id: string, updates: Partial<BrandAsset>) => void;
    deleteAsset: (id: string) => void;
    addCreativeRequest: (req: CreativeRequest) => void;
    updateCreativeRequest: (id: string, updates: Partial<CreativeRequest>) => void;
    getBrandStrategy: (brandId: string) => BrandStrategySection[];

    // New Methods
    upsertConnector: (connector: ConnectorConfig) => void;
    addCampaign: (campaign: Campaign) => void;
    logActivity: (item: ActivityLogItem) => void;

    // Avatar Methods
    addAvatar: (avatar: AvatarProfile) => void;
    updateAvatar: (id: string, updates: Partial<AvatarProfile>) => void;
    deleteAvatar: (id: string) => void;

    // Project Methods
    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    // Task Methods
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    // Chat Methods
    sendChatMessage: (threadId: string, message: string, authorId: string) => void;
    createChatThread: (type: 'task' | 'project', referenceId: string, participants: string[]) => string; // Returns new thread ID

    // Pod Methods
    addPod: (pod: Pod) => void;
    updatePod: (id: string, updates: Partial<Pod>) => void;
    deletePod: (id: string) => void;

    // Pod File Methods
    addPodFile: (file: PodFile) => void;
    deletePodFile: (id: string) => void;
    uploadFileVersion: (fileId: string, newFile: PodFile) => void;

    // Creative Studio Methods
    saveCreativePrompt: (prompt: CreativePrompt) => void;
    addGeneratedAsset: (asset: GeneratedAsset) => void;
    createMoodboard: (board: Moodboard) => void;
    addToMoodboard: (boardId: string, assetId: string) => void;

    // Video Studio Methods
    createVideoProject: (project: VideoProject) => void;
    updateVideoScript: (id: string, script: string) => void;
    addVideoScene: (scene: VideoScene) => void;
    updateSceneVisual: (id: string, url: string) => void;

    // Team Methods
    addTeamMember: (member: TeamMember) => void;
    updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
    deleteTeamMember: (id: string) => void;

    // LLM Settings
    updateLLMSettings: (settings: LLMSettings) => void;

    // Templates
    addBrandTemplate: (template: BrandTemplate) => void;
    updateBrandTemplate: (id: string, updates: Partial<BrandTemplate>) => void;

    // Social Jobs
    addSocialJob: (job: SocialJob) => void;
    updateSocialJob: (id: string, updates: Partial<SocialJob>) => void;

    // Meta Ads Methods
    addMetaCampaign: (campaign: MetaCampaign) => void;
    addMetaAdSet: (adSet: MetaAdSet) => void;
    addMetaAd: (ad: MetaAd) => void;
    syncMetaAccount: () => Promise<void>;
    connectSocialPlatform: (platform: 'facebook' | 'google' | 'instagram') => Promise<void>;
    disconnectSocialPlatform: (platform: 'facebook' | 'google' | 'instagram') => Promise<void>;
    searchSocialAccounts: (platform: string, query: string) => Promise<any>;
    linkSocialAccount: (platform: string, accountData: any) => void;
    debugMeta: () => Promise<any>;

    // User / Session Methods
    currentUser: any;
    setCurrentUser: (user: any) => void;

    // Knowledge Base Methods
    knowledgeSources: KnowledgeSource[];
    addKnowledgeSource: (source: KnowledgeSource) => Promise<void>;
    updateKnowledgeSource: (id: string, updates: Partial<KnowledgeSource>) => Promise<void>;
    removeKnowledgeSource: (id: string) => Promise<void>;

    // Deep Linking
    activeOriginSection: string;
    setActiveOriginSection: (section: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [brands, setBrands] = useState<Brand[]>(initialBrands);
    const [activeBrandId, setActiveBrandId] = useState<string | null>(BRAND_IDS.GLVT);
    const [strategySections, setStrategySections] = useState<BrandStrategySection[]>([]);
    const [identities, setIdentities] = useState<BrandIdentity[]>(initialIdentities);
    const [assets, setAssets] = useState<BrandAsset[]>(initialAssets);
    const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);

    // New State
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam);
    const [llmSettings, setLLMSettings] = useState<LLMSettings[]>([]);
    const [brandTemplates, setBrandTemplates] = useState<BrandTemplate[]>(initialTemplates);

    const [socialJobs, setSocialJobs] = useState<SocialJob[]>(initialSocialJobs);
    const [creativeRequests, setCreativeRequests] = useState<CreativeRequest[]>([]);
    const [contentPillars, setContentPillars] = useState<ContentPillar[]>([
        { id: 'p1', brand_id: BRAND_IDS.SUITES, name: 'Look Good', description: 'Style & Beauty' },
        { id: 'p2', brand_id: BRAND_IDS.SUITES, name: 'Feel Good', description: 'Wellness & Spa' }
    ]);
    const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
    const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);

    const [connectors, setConnectors] = useState<ConnectorConfig[]>(initialConnectors);
    const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
    const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);

    // Meta Ads State
    const [metaAccounts, setMetaAccounts] = useState<MetaAdAccount[]>(initialMetaAccounts);
    const [metaCampaigns, setMetaCampaigns] = useState<MetaCampaign[]>(initialMetaCampaigns);
    const [metaAdSets, setMetaAdSets] = useState<MetaAdSet[]>(initialMetaAdSets);
    const [metaAds, setMetaAds] = useState<MetaAd[]>(initialMetaAds);

    const [notifications, setNotifications] = useState<AnalyticsNotification[]>(initialNotifications);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [finance, setFinance] = useState<FinanceEntry[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);

    // --- BRAND OS STATE ---
    const [pods, setPods] = useState<Pod[]>(initialPods); // Using any[] to avoid import hell if type is missing, but should be Pod[]
    const [podFiles, setPodFiles] = useState<PodFile[]>(initialPodFiles);
    const [podDiscussions, setPodDiscussions] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);

    // Deep Linking State
    const [activeOriginSection, setActiveOriginSection] = useState<string>('knowledge');
    const [taskComments, setTaskComments] = useState<any[]>([]);
    const [chatThreads, setChatThreads] = useState<ChatThread[]>(initialThreads);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
    const [osNotifications, setOsNotifications] = useState<any[]>([]);
    const [creativePrompts, setCreativePrompts] = useState<CreativePrompt[]>([]);
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
    const [moodboards, setMoodboards] = useState<Moodboard[]>(initialMoodboards);
    const [videoProjects, setVideoProjects] = useState<VideoProject[]>(initialVideoProjects);
    const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [teamMetrics, setTeamMetrics] = useState<any[]>([]);

    const syncMetaAccount = async () => {
        if (!activeBrandId) return;

        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data } = await supabase
            .from('social_integrations')
            .select('*')
            .eq('brand_id', activeBrandId)
            .eq('platform', 'facebook')
            .limit(1)
            .maybeSingle(); // Use maybeSingle to avoid 406 not found errors

        if (data) {
            try {
                // 1. Fetch Accounts
                const accounts = await getMetaAccounts(activeBrandId);
                setMetaAccounts(accounts as any); // Fix TS mismatch

                if (accounts.length > 0) {
                    const accountId = accounts[0].id.replace('act_', '');

                    // 2. Fetch Campaigns
                    const campaigns = await getMetaCampaigns(accountId, activeBrandId);
                    setMetaCampaigns(campaigns);

                    // 3. Fetch Ad Sets
                    const adSets = await getMetaAdSets(accountId, activeBrandId);
                    setMetaAdSets(adSets);

                    // 4. Fetch Ads
                    const ads = await getMetaAds(accountId, activeBrandId);
                    setMetaAds(ads);
                } else {
                    console.log("No ad accounts found for this user.");
                }

                // CRITICAL FIX: Update connector state so UI shows "Connected"
                setConnectors(prev => prev.map(c => c.id === 'meta' || c.id === 'facebook' ? {
                    ...c,
                    connected: true,
                    lastSyncAt: (data as any)?.updated_at || (data as any)?.created_at || new Date().toISOString()
                } : c));

            } catch (e: any) {
                console.error("Failed to sync Meta data:", e);
                if (e.message === "AUTH_EXPIRED") {
                    console.warn("[Store] Database token is invalid/expired. Disconnecting.");
                    await disconnectSocialPlatform('facebook');
                }
            }
        } else {
            // FALLBACK: Check Local Storage if Supabase is unreachable/empty
            // This allows the "Connected" state to show even if the DB is down (e.g. DNS issues)
            if (typeof window !== 'undefined') {
                const localToken = localStorage.getItem(`exequte_facebook_token_${activeBrandId}`);
                if (localToken && localToken !== 'undefined' && localToken !== 'null') {
                    console.log("[Store] Found local token, proceeding with partial sync...");
                    try {
                        const accounts = await getMetaAccounts(activeBrandId);
                        setMetaAccounts(accounts as any);

                        // Update UI to show Connected
                        setConnectors(prev => prev.map(c => c.id === 'meta' || c.id === 'facebook' ? {
                            ...c,
                            connected: true,
                            lastSyncAt: new Date().toISOString()
                        } : c));
                    } catch (e: any) {
                        if (e.message === "AUTH_EXPIRED") {
                            console.warn("[Store] Local fallback token is invalid. Disconnecting.");
                            await disconnectSocialPlatform('facebook');
                        } else {
                            console.warn("[Store] Local fallback sync failed", e);
                        }
                    }
                }
            }
        }
    };

    const connectSocialPlatform = async (platform: 'facebook' | 'google' | 'instagram') => {
        if (!activeBrandId) return;

        if (platform === 'facebook' || platform === 'instagram') {
            try {
                const response = await loginWithFacebook();
                if (response) {
                    await saveSocialToken(activeBrandId, 'facebook', response);
                    await syncMetaAccount(); // Trigger sync immediately
                    // Update connection status in local state
                    setConnectors(prev => prev.map(c => c.id === 'meta' || c.id === 'facebook' ? { ...c, connected: true } : c));
                }
            } catch (error) {
                console.error("Meta Login Failed:", error);
                alert("Failed to connect to Meta. Please allow popup.");
            }
        } else if (platform === 'google') {
            alert("Google connection coming soon.");
        }
    };

    const disconnectSocialPlatform = async (platform: 'facebook' | 'google' | 'instagram') => {
        if (!activeBrandId) return;

        // 1. Clear Service Layer
        // Since IG and FB share the Meta token saved as 'facebook', we delete 'facebook' for either.
        const platformToDelete = (platform === 'instagram') ? 'facebook' as const : platform;
        await deleteSocialToken(activeBrandId, platformToDelete);

        // 2. Clear Local State
        if (platform === 'facebook' || platform === 'instagram') {
            setMetaAccounts([]);
            setMetaCampaigns([]);
            setMetaAdSets([]);
            setMetaAds([]);
            setConnectors(prev => prev.map(c => c.id === 'meta' || c.id === 'facebook' ? { ...c, connected: false } : c));
        }
    };

    const searchSocialAccounts = async (platform: string, query: string) => {
        if (!activeBrandId) return [];
        return await searchInstagramAccounts(query, activeBrandId);
    };

    const linkSocialAccount = (platform: string, accountData: any) => {
        if (!activeBrandId) return;

        const identity = identities.find(i => i.brand_id === activeBrandId);
        if (!identity) return;

        const connections = identity.social_connections || []; // TS Fix
        const newConnections = connections.map(c => {
            if (c.platform.toLowerCase() === platform.toLowerCase()) {
                return { ...c, isConnected: true, handle: `@${accountData.username}`, followerCount: String(accountData.followers_count || 0) };
            }
            return c;
        });

        const exists = newConnections.some(c => c.platform.toLowerCase() === platform.toLowerCase());
        if (!exists) {
            newConnections.push({
                platform: 'Instagram', // Defaulting for now as this is mostly IG
                handle: `@${accountData.username}`,
                isConnected: true,
                followerCount: String(accountData.followers_count || 0)
            });
        }

        updateIdentity({ ...identity, social_connections: newConnections });
    };

    // Check for Meta connection on mount or brand change
    useEffect(() => {
        syncMetaAccount();
    }, [activeBrandId]);

    // Check for OAuth Redirect Token
    useEffect(() => {
        if (!activeBrandId) return;

        const handleOAuth = async () => {
            try {
                const tokenData = await checkUrlForToken(activeBrandId); // AWAIT HERE
                if (tokenData) {
                    await saveSocialToken(activeBrandId, 'facebook', tokenData);
                    await syncMetaAccount();
                    setConnectors(prev => prev.map(c => c.id === 'meta' || c.id === 'facebook' ? { ...c, connected: true } : c));
                }
            } catch (e) {
                console.error("Failed to handle OAuth token:", e);
            }
        };

        handleOAuth();
        handleOAuth();
    }, [activeBrandId]);

    // Knowledge Base Persistence
    const loadKnowledgeSources = async (brandId: string) => {
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase
            .from('brand_knowledge_base')
            .select('*')
            .eq('brand_id', brandId);

        if (error) {
            console.error('Error loading knowledge sources:', error);
            return;
        }

        if (data) {
            setKnowledgeSources(data as KnowledgeSource[]);
        }
    };

    const addKnowledgeSource = async (source: KnowledgeSource) => {
        setKnowledgeSources(prev => [...prev, source]);
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { error } = await supabase
            .from('brand_knowledge_base')
            .insert({
                id: source.id,
                brand_id: source.brand_id,
                type: source.type,
                name: source.name,
                content: source.content,
                mime_type: source.mime_type,
                preview: source.preview
            } as any);
        if (error) console.error('Error adding knowledge source:', error);
    };

    const updateKnowledgeSource = async (id: string, updates: Partial<KnowledgeSource>) => {
        setKnowledgeSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { error } = await supabase
            .from('brand_knowledge_base')
            .update(updates as any)
            .eq('id', id);

        if (error) console.error('Error updating knowledge source:', error);
    };

    const removeKnowledgeSource = async (id: string) => {
        setKnowledgeSources(prev => prev.filter(s => s.id !== id));
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('brand_knowledge_base').delete().eq('id', id);
    };

    useEffect(() => {
        if (activeBrandId) {
            loadKnowledgeSources(activeBrandId);
        } else {
            setKnowledgeSources([]);
        }
    }, [activeBrandId]);

    // --- SUPABASE PERSISTENCE ---

    const loadBrands = async () => {
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase.from('brands').select('*');
        if (data && data.length > 0) setBrands(data);
        // If empty, we might want to keep initialBrands or seed them?
        // For now, we'll stick to initialBrands if DB is empty to avoid blank screen
        if (error) console.error("Error loading brands:", error);
    };

    const loadIdentities = async () => {
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase.from('brand_identities').select('*');
        if (data && data.length > 0) setIdentities(data as BrandIdentity[]);
        if (error) console.error("Error loading identities:", error);
    };

    const loadStrategy = async () => {
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase.from('brand_strategy_sections').select('*');
        if (data) setStrategySections(data as BrandStrategySection[]);
        if (error) console.error("Error loading strategy:", error);
    };

    const loadAssets = async () => {
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase.from('brand_assets').select('*');
        if (data) setAssets(data as BrandAsset[]);
        if (error) console.error("Error loading assets:", error);
    };

    useEffect(() => {
        loadBrands();
        loadIdentities();
        loadStrategy();
        loadAssets();
    }, []);



    const debugMeta = async () => {
        if (!activeBrandId) return { error: "No active brand" };
        return await debugMetaConnection(activeBrandId);
    };

    const addBrand = async (brand: Brand) => {
        setBrands([...brands, brand]);
        setActiveBrandId(brand.id);
        const newIdentity: BrandIdentity = {
            id: crypto.randomUUID(),
            brand_id: brand.id,
            color_primary_hex: '#FFFFFF',
            color_secondary_hex: '#F3EFEA',
            color_accent_hex: '#000000',
            font_heading: 'Sans Serif',
            font_body: 'Sans Serif',
            image_style: '',
            video_style: '',
            do_nots: '',
            ui_config: { use_identity_theme: true },
            content_mix: [],
            instagram_bio: brand.tagline,
            instagram_highlights: [],
            instagram_feed: [],
            social_connections: [],
            avatars: []
        };
        setIdentities([...identities, newIdentity]);

        // Persist to Supabase
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('brands').insert(brand as any);
        await supabase.from('brand_identities').insert(newIdentity as any);
    };

    const updateBrand = async (id: string, updates: Partial<Brand>) => {
        setBrands(brands.map(b => b.id === id ? { ...b, ...updates } : b));
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('brands').update(updates as any).eq('id', id);
    };

    const addStrategySections = async (newSections: BrandStrategySection[]) => {
        setStrategySections(prev => {
            const filtered = prev.filter(p =>
                !(p.brand_id === newSections[0].brand_id && newSections.some(n => n.section_type === p.section_type))
            );
            return [...filtered, ...newSections];
        });
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { error } = await supabase.from('brand_strategy_sections').insert(newSections as any);
        if (error) console.error("Error adding strategy sections:", error);
    };

    const updateStrategySection = async (id: string, content: string) => {
        setStrategySections(prev => prev.map(s => s.id === id ? { ...s, content, updated_at: new Date().toISOString() } : s));
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('brand_strategy_sections').update({ content, updated_at: new Date().toISOString() }).eq('id', id);
    };

    const updateIdentity = async (updatedId: BrandIdentity) => {
        setIdentities(prev => prev.map(i => i.brand_id === updatedId.brand_id ? updatedId : i));
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('brand_identities').upsert(updatedId as any).eq('brand_id', updatedId.brand_id);
    };

    const addContentIdeas = (ideas: ContentIdea[]) => setContentIdeas(prev => [...prev, ...ideas]);
    const updateContentIdeaStatus = (id: string, status: ContentIdea['status']) => setContentIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));

    const addContentPost = (post: ContentPost) => {
        setContentPosts(prev => [...prev, { ...post, status: post.status || 'draft' }]);
        logActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: 'post_created',
            description: `Post created for ${post.platform}`
        });
    };

    const updateContentPost = (id: string, updates: Partial<ContentPost>) => {
        setContentPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteContentPost = (id: string) => {
        setContentPosts(prev => prev.filter(p => p.id !== id));
    };

    const changePostStatus = (id: string, status: PostStatus) => {
        setContentPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        logActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: status === 'published' ? 'post_published' : 'post_approved',
            description: `Post moved to ${status}`
        });
    };

    const addAsset = async (asset: BrandAsset) => {
        setAssets(prev => [...prev, { ...asset, status: asset.status || 'Draft' }]);
        logActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: 'asset_created',
            description: `Asset uploaded: ${asset.title}`
        });
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('brand_assets').insert(asset as any);
    };

    const updateAsset = (id: string, updates: Partial<BrandAsset>) => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const deleteAsset = (id: string) => {
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    const addCreativeRequest = (req: CreativeRequest) => setCreativeRequests(prev => [req, ...prev]);
    const updateCreativeRequest = (id: string, updates: Partial<CreativeRequest>) => setCreativeRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    const getBrandStrategy = (brandId: string) => strategySections.filter(s => s.brand_id === brandId);

    const upsertConnector = (connector: ConnectorConfig) => {
        setConnectors(prev => {
            const exists = prev.find(c => c.id === connector.id);
            if (exists) return prev.map(c => c.id === connector.id ? { ...c, ...connector } : c);
            return [...prev, connector];
        });
        logActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: 'connector_connected',
            description: `${connector.label} updated`
        });
    };

    const addCampaign = (campaign: Campaign) => {
        setCampaigns(prev => [...prev, campaign]);
        logActivity({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: 'campaign_created',
            description: `Campaign: ${campaign.name}`
        });
    };

    // Project Logic
    const addProject = (project: Project) => {
        setProjects(prev => [...prev, project]);
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    // Task Logic
    const addTask = (task: Task) => setTasks(prev => [...prev, task]);
    const updateTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

    // Chat Logic
    const createChatThread = (type: 'task' | 'project', referenceId: string, participants: string[]) => {
        const newThread: ChatThread = {
            id: crypto.randomUUID(),
            type,
            reference_id: referenceId,
            participant_ids: participants,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        setChatThreads(prev => [...prev, newThread]);
        return newThread.id;
    };

    const sendChatMessage = (threadId: string, message: string, authorId: string) => {
        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            thread_id: threadId,
            author_id: authorId,
            message,
            created_at: new Date().toISOString(),
            read_by: [authorId]
        };
        setChatMessages(prev => [...prev, newMessage]);

        // Update thread updated_at
        setChatThreads(prev => prev.map(t => t.id === threadId ? { ...t, updated_at: new Date().toISOString() } : t));
    };

    // Pod Logic
    const addPod = (pod: Pod) => setPods(prev => [...prev, pod]);
    const updatePod = (id: string, updates: Partial<Pod>) => setPods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const deletePod = (id: string) => setPods(prev => prev.filter(p => p.id !== id));

    const addPodFile = (file: PodFile) => setPodFiles(prev => [...prev, file]);
    const deletePodFile = (id: string) => setPodFiles(prev => prev.filter(f => f.id !== id));
    const uploadFileVersion = (fileId: string, newFile: PodFile) => {
        // In a real DB, we'd link them. For state, we just replace/add.
        // Let's assume we replace the "current" one in the main view, but keep history?
        // For simplicity: Add the new file.
        setPodFiles(prev => [...prev, newFile]);
    };

    // Creative Studio Logic
    const saveCreativePrompt = (prompt: CreativePrompt) => setCreativePrompts(prev => [...prev, prompt]);
    const addGeneratedAsset = (asset: GeneratedAsset) => setGeneratedAssets(prev => [...prev, asset]);
    const createMoodboard = (board: Moodboard) => setMoodboards(prev => [...prev, board]);
    const addToMoodboard = (boardId: string, assetId: string) => {
        setMoodboards(prev => prev.map(m => m.id === boardId ? { ...m, asset_ids: [...m.asset_ids, assetId] } : m));
    };

    // Video Logic
    const createVideoProject = (project: VideoProject) => setVideoProjects(prev => [...prev, project]);
    const updateVideoScript = (id: string, script: string) => setVideoProjects(prev => prev.map(p => p.id === id ? { ...p, script } : p));
    const addVideoScene = (scene: VideoScene) => setVideoScenes(prev => [...prev, scene]);
    const updateSceneVisual = (id: string, url: string) => setVideoScenes(prev => prev.map(s => s.id === id ? { ...s, asset_url: url } : s));

    // Team Logic
    const addTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
    const updateTeamMember = (id: string, updates: Partial<TeamMember>) => setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const deleteTeamMember = (id: string) => setTeamMembers(prev => prev.filter(m => m.id !== id));

    const updateLLMSettings = (settings: LLMSettings) => {
        setLLMSettings(prev => {
            const existing = prev.findIndex(s => s.brand_id === settings.brand_id);
            if (existing > -1) {
                const newSettings = [...prev];
                newSettings[existing] = settings;
                return newSettings;
            }
            return [...prev, settings];
        });
    };

    const addBrandTemplate = (template: BrandTemplate) => setBrandTemplates(prev => [...prev, template]);
    const updateBrandTemplate = (id: string, updates: Partial<BrandTemplate>) => setBrandTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    const addSocialJob = (job: SocialJob) => setSocialJobs(prev => [...prev, job]);
    const updateSocialJob = (id: string, updates: Partial<SocialJob>) => setSocialJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));

    const logActivity = (item: ActivityLogItem) => setActivityLog(prev => [item, ...prev]);

    const addMetaCampaign = (campaign: MetaCampaign) => setMetaCampaigns(prev => [...prev, campaign]);
    const addMetaAdSet = (adSet: MetaAdSet) => setMetaAdSets(prev => [...prev, adSet]);
    const addMetaAd = (ad: MetaAd) => setMetaAds(prev => [...prev, ad]);

    // Avatar Logic
    const addAvatar = (avatar: AvatarProfile) => {
        if (!activeBrandId) return;
        const identity = identities.find(i => i.brand_id === activeBrandId);
        if (!identity) return;

        // Ensure avatars array exists
        const currentAvatars = identity.avatars || [];
        updateIdentity({ ...identity, avatars: [...currentAvatars, avatar] });
    };

    const updateAvatar = (id: string, updates: Partial<AvatarProfile>) => {
        if (!activeBrandId) return;
        const identity = identities.find(i => i.brand_id === activeBrandId);
        if (!identity) return;

        const currentAvatars = identity.avatars || [];
        const newAvatars = currentAvatars.map(a => a.id === id ? { ...a, ...updates } : a);
        updateIdentity({ ...identity, avatars: newAvatars });
    };

    const deleteAvatar = (id: string) => {
        if (!activeBrandId) return;
        const identity = identities.find(i => i.brand_id === activeBrandId);
        if (!identity) return;

        const currentAvatars = identity.avatars || [];
        updateIdentity({ ...identity, avatars: currentAvatars.filter(a => a.id !== id) });
    };

    const value = {
        brands, activeBrandId, setActiveBrand: setActiveBrandId,
        strategySections, identities, assets, creativeRequests, contentPillars, contentIdeas, contentPosts, socialJobs,
        connectors, campaigns, activityLog,
        projects, tasks, teamMembers, llmSettings,
        taskComments,
        pods, podFiles, podDiscussions,
        chatThreads, chatMessages, osNotifications,
        creativePrompts, generatedAssets, moodboards, videoProjects, videoScenes,
        dashboards, teamMetrics,
        brandTemplates,
        metaAccounts, metaCampaigns, metaAdSets, metaAds,
        notifications,
        rooms, bookings, affiliates, services, finance, menu,
        addBrand, updateBrand, addStrategySections, updateStrategySection, updateIdentity,
        addContentIdeas, updateContentIdeaStatus, addContentPost, updateContentPost, deleteContentPost, changePostStatus,
        addAsset, updateAsset, deleteAsset, addCreativeRequest, updateCreativeRequest, getBrandStrategy,
        upsertConnector, addCampaign, addProject, updateProject, deleteProject,
        addTask, updateTask, deleteTask,
        sendChatMessage, createChatThread,
        addPod, updatePod, deletePod,
        addPodFile, deletePodFile, uploadFileVersion,
        saveCreativePrompt, addGeneratedAsset, createMoodboard, addToMoodboard,
        createVideoProject, updateVideoScript, addVideoScene, updateSceneVisual,
        addTeamMember, updateTeamMember, deleteTeamMember,
        updateLLMSettings,
        addBrandTemplate, updateBrandTemplate, logActivity, addSocialJob, updateSocialJob,
        addMetaCampaign, addMetaAdSet, addMetaAd,
        syncMetaAccount, connectSocialPlatform, disconnectSocialPlatform, searchSocialAccounts, linkSocialAccount,
        debugMeta,
        users,
        currentUser,
        setCurrentUser,
        addAvatar, updateAvatar, deleteAvatar,
        knowledgeSources, addKnowledgeSource, updateKnowledgeSource, removeKnowledgeSource,
        activeOriginSection, setActiveOriginSection
    };

    return (
        <StoreContext.Provider value={value} >
            {children}
        </StoreContext.Provider >
    );
};

export const useAppStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useAppStore must be used within StoreProvider');
    return context;
};
