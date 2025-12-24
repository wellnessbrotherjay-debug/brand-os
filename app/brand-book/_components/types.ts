// ========================================
// BRAND OS - POD SYSTEM & RBAC
// ========================================

export type PodType = 'brand' | 'marketing' | 'creative' | 'projects' | 'operations' | 'analytics' | 'team';

export interface Pod {
  id: string;
  type: PodType;
  name: string;
  description: string;
  brand_id?: string; // Optional: brand-specific pods
  owner_id: string;
  team_member_ids: string[];
  visibility: 'private' | 'team' | 'public';
  created_at: string;
  updated_at: string;
}

export interface PodFile {
  id: string;
  pod_id: string;
  name: string;
  file_url: string;
  file_type: string;
  size_bytes: number;
  uploaded_by: string;
  version: number;
  parent_version_id?: string;
  created_at: string;
}

export interface PodDiscussion {
  id: string;
  pod_id: string;
  author_id: string;
  message: string;
  thread_id?: string; // For replies
  created_at: string;
}

// --- RBAC (Role-Based Access Control) ---

export type UserRole =
  | 'admin'
  | 'project_manager'
  | 'creative_director'
  | 'designer'
  | 'video_editor'
  | 'marketing_manager'
  | 'analyst'
  | 'contributor'
  | 'viewer';

export interface Permission {
  can_view_pods: PodType[];
  can_edit_pods: PodType[];
  can_upload: boolean;
  can_approve: boolean;
  can_publish: boolean;
  can_manage_team: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  permissions: Permission;
  brand_ids: string[]; // Multi-brand access
  created_at: string;
}

// --- ENHANCED TASK SYSTEM ---

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'needs_review'
  | 'approved'
  | 'published'
  | 'blocked';

export type TaskPriority = 'normal' | 'urgent';

export interface Task {
  id: string;
  project_id: string;
  pod_id?: string;
  title: string;
  description: string;
  assigned_to: string; // User ID
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  dependencies: string[]; // Task IDs
  blocked_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  message: string;
  created_at: string;
}

// --- COMMUNICATION LAYER ---

export interface ChatThread {
  id: string;
  type: 'task' | 'project' | 'pod' | 'direct';
  reference_id: string; // Task/Project/Pod ID or user pair
  participant_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  author_id: string;
  message: string;
  attachments?: string[];
  created_at: string;
  read_by: string[]; // User IDs
}

export type NotificationType =
  | 'task_assigned'
  | 'task_overdue'
  | 'task_completed'
  | 'mention'
  | 'approval_needed'
  | 'message'
  | 'file_uploaded'
  | 'comment_added';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string;
  reference_type: 'task' | 'project' | 'pod' | 'chat';
  message: string;
  read: boolean;
  created_at: string;
}

// --- CREATIVE ENGINE ---

export interface CreativePrompt {
  id: string;
  brand_id: string;
  name: string;
  base_prompt: string; // Brand-locked template
  parameters: {
    style?: string;
    mood?: string;
    colors?: string[];
    custom?: Record<string, any>;
  };
  created_by: string;
  created_at: string;
}

export interface GeneratedAsset {
  id: string;
  prompt_id: string;
  asset_type: 'image' | 'video' | 'copy';
  file_url?: string;
  text_content?: string;
  status: 'generating' | 'ready' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
}

export interface Moodboard {
  id: string;
  pod_id: string;
  name: string;
  asset_ids: string[];
  layout: 'grid' | 'freeform';
  created_by: string;
  created_at: string;
}

// --- VIDEO GENERATION ---

export interface VideoProject {
  id: string;
  project_id?: string;
  pod_id?: string;
  name: string;
  script: string;
  visual_style: string;
  format: 'reel' | 'story' | 'ad' | 'long_form';
  duration_seconds: number;
  status: 'script' | 'generating' | 'review' | 'approved' | 'published';
  output_url?: string;
  created_by: string;
  created_at: string;
}

export interface VideoScene {
  id: string;
  video_project_id: string;
  order: number;
  description: string;
  duration_seconds: number;
  asset_url?: string;
}

// --- ANALYTICS & DASHBOARDS ---

export interface Dashboard {
  id: string;
  name: string;
  type: 'executive' | 'project' | 'campaign' | 'team';
  widgets: DashboardWidget[];
  owner_id: string;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'timeline';
  data_source: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export interface TeamMetrics {
  user_id: string;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_overdue: number;
  avg_completion_time_hours: number;
  period: string; // e.g., "2025-W03"
}

// ========================================
// LEGACY BRAND BOOK TYPES
// ========================================

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  niche: string;
  what_you_sell: string;
  who_you_help: string;
  transformation: string;
  difference: string;
  emotions: string;
  values: string;
  personality: string;
  primaryColor?: string;
  secondaryColor?: string;
  toneOfVoice?: string;
}


export enum StrategySectionType {
  Purpose = 'Purpose',
  Mission = 'Mission',
  Vision = 'Vision',
  Positioning = 'Positioning',
  UVP = 'UVP',
  BrandPromise = 'Brand Promise',
  Archetype = 'Archetype',
  ToneOfVoice = 'Tone of Voice',
  BrandStory = 'Brand Story',
  Manifesto = 'Manifesto',
  CampaignFramework = 'Campaign Framework',
  MessagingPillars = 'Messaging Pillars',
  ContentPillars = 'ContentPillars',
  CreativeDirection = 'Creative Direction',
  Ethics = 'Ethics',
  BrandArchitecture = 'Brand Architecture',
  GuestExperience = 'Guest Experience',
  CompetitiveBenchmark = 'Competitive Benchmark',
  FivePillars = 'Rule of Five Pillars'
}

export interface BrandStrategySection {
  id: string;
  brand_id: string;
  section_type: StrategySectionType;
  content: string;
  source: 'manual' | 'ai';
  updated_at: string;
}

export interface BrandBookConfig {
  cover_image_url?: string;
  about_image_url?: string;
  moodboard_images?: string[];
  back_cover_image_url?: string;
}

export interface UIConfig {
  use_identity_theme: boolean;
  custom_colors?: {
    background: string;
    sidebar: string;
    text_primary: string;
    text_secondary: string;
    accent: string;
  };
}

export interface Highlight {
  id: string;
  title: string;
  cover_image: string;
  stories: SocialFeedItem[]; // Array of story slides within this highlight
}

export interface SocialFeedItem {
  id: string;
  type: 'image' | 'video' | 'reel' | 'short';
  url: string;
  caption?: string;
  is_pinned?: boolean;
}

export interface SocialConnection {
  platform: 'Instagram' | 'Facebook' | 'YouTube' | 'TikTok' | 'LinkedIn' | 'Redbook' | 'Douyin';
  handle: string;
  isConnected: boolean;
  followerCount: string;
  avatarUrl?: string;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export interface AvatarProfile {
  name?: string;
  age_range?: string;
  gender?: string;
  location?: string;
  net_worth?: string;
  spending_power?: string;
  occupation?: string;
  key_interests?: string;
  pain_points?: string;
  goals?: string;
  avatar_images?: string[];
}

export interface ContentMixItem {
  label: string;
  percentage: number;
  color_hex: string;
}

export interface CompetitorBrand {
  id: string;
  name: string;
  handle: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
}

export interface BrandIdentity {
  id: string;
  brand_id: string;
  competitors?: CompetitorBrand[];
  logo_primary_url?: string;
  logo_secondary_url?: string;

  logo_clear_space?: string;
  logo_min_size_digital?: string;
  logo_min_size_print?: string;
  logo_donts?: string;

  color_primary_hex: string;
  color_secondary_hex: string;
  color_accent_hex: string;
  color_palette_description?: string;
  extra_colors?: BrandColor[];

  font_heading: string;
  font_heading_custom_url?: string;
  font_body: string;
  font_body_custom_url?: string;
  typography_rules?: string;
  typography_dos?: string;
  typography_donts?: string;

  rules_dos?: string[];
  rules_donts?: string[];

  image_style: string;
  video_style: string;
  logo_rules?: string;
  layout_style?: string;
  do_nots: string;

  avatar_profile?: AvatarProfile;

  social_connections?: SocialConnection[];
  content_mix?: ContentMixItem[];
  instagram_bio?: string;
  instagram_website?: string;
  instagram_highlights?: Highlight[];
  instagram_feed?: SocialFeedItem[];
  instagram_tagged?: SocialFeedItem[];

  youtube_config?: {
    banner_url?: string;
    avatar_url?: string;
    bio?: string;
  };
  youtube_videos?: SocialFeedItem[];
  youtube_shorts?: SocialFeedItem[];

  tiktok_config?: {
    avatar_url?: string;
    bio?: string;
    website?: string;
  };
  tiktok_feed?: SocialFeedItem[];

  facebook_config?: {
    cover_url?: string;
    avatar_url?: string;
    bio?: string;
    website?: string;
  };
  facebook_feed?: SocialFeedItem[];

  linkedin_config?: {
    cover_url?: string;
    avatar_url?: string;
    bio?: string;
    website?: string;
  };

  twitter_config?: {
    header_url?: string;
    avatar_url?: string;
    bio?: string;
  };

  brand_book_config?: BrandBookConfig;
  ui_config?: UIConfig;
}

// --- NEW WORKSPACE TYPES ---

export type TeamRole = 'Marketing' | 'Design' | 'Creative' | 'Admin';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  avatar_url: string;
  email?: string; // Added email
  status?: 'active' | 'invited';

  // New Enhanced Fields
  bio?: string;
  gallery_images?: string[]; // Array of image URLs
  achievements?: string[]; // Array of strings e.g. "World Champion 2024"
  country_flag?: string; // Emoji or Country Code
}

export interface Project {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Live' | 'Archived';
  members: string[]; // Array of TeamMember IDs
  deadline?: string;
  icon?: string; // Emoji or icon name
  pod_id?: string; // Link to parent Pod
}

export type AssetStatus = 'Draft' | 'In Review' | 'Approved' | 'Scheduled' | 'Published';

export interface AssetComplianceReport {
  score: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  checks: {
    colors: { passed: boolean; message: string };
    typography: { passed: boolean; message: string };
    logo_usage: { passed: boolean; message: string };
    visual_style: { passed: boolean; message: string };
  };
  ai_feedback: string;
  last_run: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  project_id?: string; // Linked to project
  asset_type: 'logo' | 'font' | 'template' | 'pdf' | 'moodboard' | 'video' | 'image' | 'other';
  title: string;
  description: string;
  file_url: string;
  tags: string[];

  // Workflow fields
  status?: AssetStatus;
  target_platforms?: string[]; // e.g. ['Instagram', 'Facebook']
  scheduled_date?: string;
  feedback_comments?: { user: string, text: string, date: string }[];
  compliance_report?: AssetComplianceReport;
}

export interface LLMSettings {
  brand_id: string;
  tone_sliders: {
    formal_casual: number; // 0-100
    short_long: number;
    fact_emotion: number;
  };
  forbidden_words: string[];
  required_phrases: string[];
  custom_instructions: string;
}

// --- CREATIVE GEN & SOCIAL OS TYPES ---

export type Channel =
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'redbook';

export type JobStatus = 'planning' | 'copywriting' | 'design' | 'approval' | 'scheduling' | 'completed';

export interface SocialJob {
  id: string;
  brand_id: string;
  title: string;
  brief: string;
  status: JobStatus;
  due_date?: string;
  channels: Channel[];
  posts: ContentPost[]; // Posts generated within this job
}

export type PostStatus =
  | 'draft'
  | 'pending_design'
  | 'design_review'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published';

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'live' | 'completed' | 'paused';
  notes?: string;
}

export interface PostMetrics {
  impressions: number;
  clicks: number;
  engagements: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export interface ContentPillar {
  id: string;
  brand_id: string;
  name: string;
  description: string;
}

export interface ContentIdea {
  id: string;
  brand_id: string;
  pillar_id?: string;
  platform: string;
  format: string;
  hook: string;
  outline: string;
  ai_prompt_used?: string;
  status: 'idea' | 'drafted' | 'approved' | 'posted';
  due_date?: string;
}

export interface ContentPost {
  id: string;
  brand_id: string;
  job_id?: string; // Link to parent job
  content_idea_id?: string;
  platform: string;
  channel?: Channel;
  title?: string;
  caption: string;
  media_urls: string[];
  assetIds?: string[];
  scheduled_for: string;
  timezone?: string;
  posted_at?: string;
  status?: PostStatus;

  metrics_views: number;
  metrics_likes: number;
  metrics_comments: number;
  metrics_saves: number;
  metrics_shares: number;
  metrics?: PostMetrics;
}

export type ConnectorType =
  | 'google_drive'
  | 'notion'
  | 'monday'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok';

export interface ConnectorConfig {
  id: string;
  type: ConnectorType;
  label: string;
  connected: boolean;
  lastSyncAt?: string;
  details?: Record<string, any>;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type:
  | 'asset_created'
  | 'campaign_created'
  | 'post_created'
  | 'post_approved'
  | 'post_scheduled'
  | 'post_published'
  | 'connector_connected'
  | 'job_updated';
  description: string;
  meta?: Record<string, any>;
}

// --- ANALYTICS TYPES ---
export interface AnalyticsNotification {
  id: string;
  brand_id: string;
  type: 'new_follower' | 'comment' | 'mention' | 'milestone';
  user: string;
  avatar_url?: string;
  content: string;
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'TikTok';
  timestamp: string;
  read: boolean;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  reach: number;
  profile_visits: number;
  website_clicks: number;
  new_followers: number;
}

export interface CreativeComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface CreativeVersion {
  id: string;
  version_number: number;
  asset_url: string;
  copy: string;
  is_video_script?: boolean;
  ai_rationale?: string;
  comments: CreativeComment[];
  created_at: string;
}

export interface CreativeBrief {
  objective: 'Brand Awareness' | 'Conversions' | 'Traffic' | 'Engagement';
  target_audience: string;
  key_message: string;
  visual_tone: string;
}

export interface CreativeRequest {
  id: string;
  brand_id: string;
  requester_name: string;
  title: string;
  platform: 'Instagram' | 'Facebook' | 'YouTube' | 'TikTok' | 'LinkedIn' | 'Other';
  format: 'Post' | 'Story' | 'Reel' | 'Cover' | 'Banner' | 'Ad';
  brief: CreativeBrief;
  versions: CreativeVersion[];
  active_version_id: string;
  status: 'draft' | 'generating' | 'in_review' | 'changes_requested' | 'approved' | 'live';
  created_at: string;
  updated_at: string;
}

// --- TEMPLATE STUDIO TYPES ---

export type LayerType = 'text' | 'image' | 'shape' | 'logo';

export interface DesignLayer {
  id: string;
  type: LayerType;
  content: string; // Text content or Image URL
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100 (auto for text)
  rotation: number;
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
    textAlign?: 'left' | 'center' | 'right';
    zIndex: number;
  };
  isLocked?: boolean;
}

export interface BrandTemplate {
  id: string;
  name: string;
  brand_id: string;
  channel: 'Instagram' | 'LinkedIn' | 'YouTube' | 'Facebook' | 'TikTok' | 'Pinterest' | 'Twitter' | 'Print' | 'Email' | 'Web';
  type: 'Post' | 'Story' | 'Cover' | 'Thumbnail' | 'Banner' | 'Ad' | 'Flyer';
  dimensions: { width: number; height: number }; // Pixels
  layers: DesignLayer[];
  thumbnail_url?: string;
  tags: string[];
}

// --- META ADS MODULE TYPES ---

export interface MetaAdAccount {
  id: string;
  brand_id: string;
  name: string;
  currency: string;
  status: 'ACTIVE' | 'DISABLED';
  timezone_name: string;
}

export interface MetaCampaign {
  id: string;
  account_id: string;
  name: string;
  objective: 'OUTCOME_SALES' | 'OUTCOME_LEADS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS' | 'OUTCOME_ENGAGEMENT';
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  spend: number;
  results: number;
  cpr: number; // Cost per result
  roas: number;
}

export interface MetaAdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  targeting: {
    geo_locations?: string[];
    age_min?: number;
    age_max?: number;
    genders?: number[]; // 1=male, 2=female
    interests?: string[];
  };
  daily_budget: number;
  spend: number;
  impressions: number;
  clicks: number;
}

export interface MetaAd {
  id: string;
  adset_id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  creative_id?: string; // Link to BrandAsset
  image_url: string;
  primary_text: string;
  headline: string;
  spend: number;
  ctr: number;
  cpc: number;
}

// --- HOSPITALITY MODULES ---

export interface Room {
  id: string;
  brand_id: string;
  name: string;
  type: 'Suite' | 'Villa' | 'Standard' | 'Retreat Hall' | 'Tent' | 'A Frame' | 'Residence Unit';
  status: 'Clean' | 'Dirty' | 'Occupied' | 'Maintenance';
  price_per_night: number;
}

export interface Booking {
  id: string;
  brand_id: string;
  room_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: 'Confirmed' | 'Pending' | 'Checked Out' | 'Cancelled';
  source: 'Direct' | 'Booking.com' | 'Airbnb' | 'Retreat Guru' | 'Traveloka' | 'ClassPass';
  total_amount: number;
}

export interface Affiliate {
  id: string;
  brand_id: string;
  name: string;
  email: string;
  code: string;
  commission_rate: number;
  total_sales: number;
}

export interface ServiceItem {
  id: string;
  brand_id: string;
  name: string;
  type: 'Experience' | 'Transport' | 'Rental' | 'Wellness' | 'Fitness';
  price: number;
  provider: string;
}

export interface FinanceEntry {
  id: string;
  brand_id: string;
  date: string;
  category: 'Revenue' | 'CAPEX' | 'Fixed Cost' | 'Variable Cost';
  description: string;
  amount: number;
}

export interface MenuItem {
  id: string;
  brand_id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Elixir' | 'Recovery';
  macros?: string;
  price: number;
  is_available: boolean;
}

export interface AppState {
  // --- BRAND OS STATE ---

  // Pod System
  pods: Pod[];
  podFiles: PodFile[];
  podDiscussions: PodDiscussion[];

  // Team & Access
  users: User[];
  currentUser: User | null;

  // Enhanced Projects & Tasks
  projects: Project[];
  tasks: Task[];
  taskComments: TaskComment[];

  // Communication
  chatThreads: ChatThread[];
  chatMessages: ChatMessage[];
  osNotifications: Notification[]; // Renamed from notifications to avoid conflict

  // Creative Engine
  creativePrompts: CreativePrompt[];
  generatedAssets: GeneratedAsset[];
  moodboards: Moodboard[];
  videoProjects: VideoProject[];
  videoScenes: VideoScene[];

  // Analytics & Dashboards
  dashboards: Dashboard[];
  teamMetrics: TeamMetrics[];

  // --- LEGACY BRAND BOOK STATE ---

  brands: Brand[];
  strategySections: BrandStrategySection[];
  identities: BrandIdentity[];
  assets: BrandAsset[];

  // New Project/Team State (Legacy - will migrate to Pod system)
  teamMembers: TeamMember[];
  llmSettings: LLMSettings[];

  // Template Studio
  brandTemplates: BrandTemplate[];

  contentPillars: ContentPillar[];
  contentIdeas: ContentIdea[];

  // Automation Engine
  socialJobs: SocialJob[];
  contentPosts: ContentPost[];
  creativeRequests: CreativeRequest[];

  // Meta Ads
  metaAccounts: MetaAdAccount[];
  metaCampaigns: MetaCampaign[];
  metaAdSets: MetaAdSet[];
  metaAds: MetaAd[];

  campaigns: Campaign[];
  connectors: ConnectorConfig[];
  activityLog: ActivityLogItem[];

  // Analytics (Legacy)
  notifications: AnalyticsNotification[];

  rooms: Room[];
  bookings: Booking[];
  affiliates: Affiliate[];
  services: ServiceItem[];
  finance: FinanceEntry[];
  menu: MenuItem[];

  activeBrandId: string | null;
}


export type ViewName =
  'dashboard' | 'setup' | 'strategy' | 'identity' | 'customer_avatar' | 'assets' |
  'ideas' | 'calendar' | 'brandbook' | 'socialkit' | 'team' |
  'integrations' | 'approvals' | 'analytics' | 'marketing_strategy' | 'llm_settings' | 'template_studio' | 'meta_ads' |
  'hospitality_pms' | 'hospitality_marketplace' | 'hospitality_finance' | 'hospitality_guest' |
  'theme_settings' | 'brand_master' | 'projects' | 'pods' | 'creative_board' | 'video_studio';
