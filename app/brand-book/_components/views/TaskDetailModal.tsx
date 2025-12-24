import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Task, TaskStatus, ChatMessage } from '../types';
import { X, MessageSquare, Menu, Send, Clock, User, CheckCircle2 } from 'lucide-react';

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
    const {
        updateTask, chatThreads, chatMessages,
        createChatThread, sendChatMessage,
        currentUser, teamMembers
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<'details' | 'discussion'>('details');
    const [messageInput, setMessageInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // -- Derived Data --
    const thread = chatThreads.find(t => t.type === 'task' && t.reference_id === task.id);
    const messages = thread ? chatMessages.filter(m => m.thread_id === thread.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];

    // -- Handlers --

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentUser) return;

        let threadId = thread?.id;

        if (!threadId) {
            // Create thread if doesn't exist
            threadId = createChatThread('task', task.id, [currentUser.id]); // Should add assignee too
        }

        sendChatMessage(threadId, messageInput, currentUser.id);
        setMessageInput('');
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (activeTab === 'discussion' && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeTab]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${task.status === 'published' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <h2 className="font-bold text-lg text-gray-800 truncate max-w-md">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('discussion')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'discussion' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <MessageSquare size={14} />
                        Discussion
                        {messages.length > 0 && <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]">{messages.length}</span>}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-white relative">
                    {activeTab === 'details' && (
                        <div className="p-6 space-y-6 overflow-y-auto h-full">
                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black/5 outline-none min-h-[120px]"
                                    value={task.description}
                                    onChange={(e) => updateTask(task.id, { description: e.target.value })}
                                    placeholder="Add a more detailed description..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white"
                                        value={task.status}
                                        onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                                    >
                                        <option value="not_started">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="needs_review">Review</option>
                                        <option value="published">Done</option>
                                    </select>
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assignee</label>
                                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                            <User size={14} className="text-gray-500" />
                                        </div>
                                        <span className="text-sm font-medium">Unassigned</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock size={12} />
                                    Created on {new Date(task.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'discussion' && (
                        <div className="flex flex-col h-full">
                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-50">
                                        <MessageSquare size={32} />
                                        <p className="text-sm">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.author_id === currentUser?.id;
                                        const author = teamMembers.find(m => m.id === msg.author_id) || { name: 'Unknown', avatar_url: '' };

                                        return (
                                            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden text-xs font-bold border-2 border-white shadow-sm">
                                                    {author.avatar_url ? <img src={author.avatar_url} /> : (author.name[0] || '?')}
                                                </div>
                                                <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end flex flex-col' : ''}`}>
                                                    <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-black text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                        {msg.message}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all shadow-sm"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shadow-sm"
                                    >
                                        <Send size={16} className={messageInput.trim() ? 'ml-0.5' : ''} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
