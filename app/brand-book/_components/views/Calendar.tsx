
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { PostStatus, ContentPost } from '../types';
import { startOfWeek, addDays, format, parseISO, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

// Unified type using the store's ContentPost
// We map 'channel' from the prompt to 'platform' in our store

const channels = ['Instagram', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn'];

export const CalendarView: React.FC = () => {
  const { contentPosts, addContentPost, updateContentPost, deleteContentPost, changePostStatus, activeBrandId } =
    useAppStore();

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [creatingDate, setCreatingDate] = useState<Date | null>(null);

  const activePosts = contentPosts.filter(p => p.brand_id === activeBrandId);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const postsByDate = useMemo(() => {
    const map: Record<string, ContentPost[]> = {};
    activePosts.forEach((p) => {
      const date = p.scheduled_for.slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(p);
    });
    return map;
  }, [activePosts]);

  const handleCreatePost = (date: Date) => {
    setCreatingDate(date);
  };

  const handleSaveNewPost = (partial: {
    title: string;
    caption: string;
    platform: string;
    time: string;
  }) => {
    if (!creatingDate || !activeBrandId) return;

    const scheduled_for = `${format(creatingDate, 'yyyy-MM-dd')}T${partial.time || '09:00'}:00`;
    const id = crypto.randomUUID();

    const newPost: ContentPost = {
      id,
      brand_id: activeBrandId,
      platform: partial.platform,
      title: partial.title,
      caption: partial.caption,
      media_urls: [],
      scheduled_for,
      status: 'pending_approval',
      metrics_views: 0,
      metrics_likes: 0,
      metrics_comments: 0,
      metrics_saves: 0,
      metrics_shares: 0
    };

    addContentPost(newPost);
    setCreatingDate(null);
  };

  const handleUpdatePost = (updates: Partial<ContentPost>) => {
    if (!editingPost) return;
    updateContentPost(editingPost.id, updates);
    setEditingPost(null);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'approved': return 'bg-green-100 border-green-200';
          case 'scheduled': return 'bg-blue-100 border-blue-200';
          case 'published': return 'bg-black text-white border-black';
          default: return 'bg-white border-gray-200';
      }
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold font-serif-brand">Content Scheduler</h1>
            <p className="opacity-60 mt-1">Plan, approve and schedule posts across all channels.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-black/10 shadow-sm">
          <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))} className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium w-48 text-center">
            {format(currentWeekStart, 'MMM d')} –{' '}
            {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-7 gap-4 min-h-0">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDate[dateStr] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div key={dateStr} className={`flex flex-col bg-gray-50/50 rounded-xl border ${isToday ? 'border-black/20 bg-blue-50/20' : 'border-black/5'} overflow-hidden`}>
              <div className={`p-3 border-b border-black/5 flex justify-between items-center ${isToday ? 'bg-black text-white' : 'bg-white'}`}>
                <strong className="text-sm">
                  {format(day, 'EEE d')}
                </strong>
                <button 
                    onClick={() => handleCreatePost(day)}
                    className={`p-1 rounded hover:bg-white/20 transition-colors ${isToday ? 'text-white' : 'text-black/40 hover:text-black'}`}
                >
                    <Plus size={14} />
                </button>
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {dayPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className={`p-3 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all group ${getStatusColor(post.status || 'draft')}`}
                    onClick={() => setEditingPost(post)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">{post.platform}</span>
                      <span className="text-[10px] opacity-40">{format(parseISO(post.scheduled_for), 'HH:mm')}</span>
                    </div>
                    <h4 className="font-bold text-xs mb-1 line-clamp-2">{post.title || post.caption || "Untitled"}</h4>
                    
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); changePostStatus(post.id, 'approved'); }} 
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600" 
                            title="Approve"
                        >
                            <CheckCircle2 size={10} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteContentPost(post.id); }} 
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                            title="Delete"
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                  </div>
                ))}
                
                {dayPosts.length === 0 && (
                    <div 
                        onClick={() => handleCreatePost(day)}
                        className="h-full min-h-[100px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <div className="text-center">
                            <Plus className="mx-auto mb-1 opacity-20" />
                            <span className="text-xs opacity-30 font-medium">Add Content</span>
                        </div>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {(creatingDate || editingPost) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <PostModal 
                initialData={editingPost}
                date={creatingDate || (editingPost ? parseISO(editingPost.scheduled_for) : new Date())}
                onClose={() => { setCreatingDate(null); setEditingPost(null); }}
                onSave={(data) => {
                    if (editingPost) {
                        handleUpdatePost(data);
                    } else {
                        handleSaveNewPost(data);
                    }
                }}
            />
        </div>
      )}
    </div>
  );
};

interface PostModalProps {
  initialData: ContentPost | null;
  date: Date;
  onClose: () => void;
  onSave: (data: { title: string; caption: string; platform: string; time: string }) => void;
}

const PostModal: React.FC<PostModalProps> = ({ initialData, date, onClose, onSave }) => {
  const [platform, setPlatform] = useState(initialData?.platform || 'Instagram');
  const [title, setTitle] = useState(initialData?.title || '');
  const [caption, setCaption] = useState(initialData?.caption || '');
  const [time, setTime] = useState(initialData ? format(parseISO(initialData.scheduled_for), 'HH:mm') : '09:00');

  return (
      <div className="bg-white w-[500px] rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full"><X size={18}/></button>
        <h3 className="font-bold text-lg mb-1">{initialData ? 'Edit Post' : 'New Post'}</h3>
        <p className="text-sm opacity-50 mb-6 flex items-center gap-2"><CalendarIcon size={14}/> {format(date, 'PPPP')}</p>
        
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Platform</label>
                <div className="flex gap-2">
                    {channels.map(ch => (
                        <button 
                            key={ch}
                            onClick={() => setPlatform(ch)}
                            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${platform === ch ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black/30'}`}
                        >
                            {ch}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Title (Internal)</label>
                    <input 
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Summer Promo"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Time</label>
                    <input 
                        type="time"
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Caption</label>
                <textarea 
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm h-32"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption..."
                />
            </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t border-black/5 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black">Cancel</button>
          <button
            onClick={() => onSave({ title, caption, platform, time })}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-bold hover:opacity-90"
          >
            Save Post
          </button>
        </div>
      </div>
  );
};
