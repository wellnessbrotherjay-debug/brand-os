import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Task, Project, TaskStatus } from '../types';
import {
    Plus, CheckCircle2, Clock, AlertCircle, MoreHorizontal, Calendar, X,
    Layout, List, Filter, Search, ChevronRight, User as UserIcon
} from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';

const STATUS_COLUMNS: { id: TaskStatus, label: string, color: string }[] = [
    { id: 'not_started', label: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
    { id: 'needs_review', label: 'Review', color: 'bg-yellow-50' },
    { id: 'published', label: 'Done', color: 'bg-green-50' }
];

export const ProjectView = () => {
    const {
        projects, tasks, activeBrandId,
        addProject, addTask, updateTask, deleteTask,
        teamMembers
    } = useAppStore();

    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");

    // Derived Data
    const brandProjects = projects.filter(p => p.brand_id === activeBrandId);

    // Auto-select first project if none selected
    React.useEffect(() => {
        if (!activeProjectId && brandProjects.length > 0) {
            setActiveProjectId(brandProjects[0].id);
        }
    }, [brandProjects, activeProjectId]);

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectTasks = tasks.filter(t => t.project_id === activeProjectId);

    // -- Handlers --

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const desc = (form.elements.namedItem('description') as HTMLInputElement).value;

        if (name && activeBrandId) {
            addProject({
                id: crypto.randomUUID(),
                brand_id: activeBrandId,
                name,
                description: desc,
                status: 'Planning',
                members: [],
                deadline: new Date().toISOString(), // Mock deadline
                icon: '🚀'
            });
            setIsCreateProjectOpen(false);
        }
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;

        if (title && activeProjectId) {
            addTask({
                id: crypto.randomUUID(),
                project_id: activeProjectId,
                title,
                description: '',
                assigned_to: 'unassigned', // Default
                status: 'not_started',
                priority: 'normal',
                dependencies: [],
                created_by: 'current_user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            setIsCreateTaskOpen(false);
        }
    };

    const advanceTask = (task: Task) => {
        const order: TaskStatus[] = ['not_started', 'in_progress', 'needs_review', 'published'];
        const currentIndex = order.indexOf(task.status);
        if (currentIndex < order.length - 1) {
            updateTask(task.id, { status: order[currentIndex + 1] });
        }
    };

    const backtrackTask = (task: Task) => {
        const order: TaskStatus[] = ['not_started', 'in_progress', 'needs_review', 'published'];
        const currentIndex = order.indexOf(task.status);
        if (currentIndex > 0) {
            updateTask(task.id, { status: order[currentIndex - 1] });
        }
    };

    if (!activeBrandId) return <div className="p-8 text-center text-gray-500">Please select a brand first.</div>;

    return (
        <div className="flex h-full bg-white">
            {/* Sidebar: Projects List */}
            <div className="w-64 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500">Projects</h2>
                    <button onClick={() => setIsCreateProjectOpen(true)} className="p-1 hover:bg-gray-200 rounded"><Plus size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {brandProjects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => setActiveProjectId(project.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${activeProjectId === project.id ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-100'}`}
                        >
                            <span className="text-xl">{project.icon || '📁'}</span>
                            <div className="overflow-hidden">
                                <h3 className={`text-sm font-bold truncate ${activeProjectId === project.id ? 'text-black' : 'text-gray-600'}`}>{project.name}</h3>
                                <p className="text-[10px] text-gray-400 truncate">{project.status}</p>
                            </div>
                        </div>
                    ))}
                    {brandProjects.length === 0 && (
                        <div className="text-center py-8 px-4 text-xs text-gray-400">
                            No projects yet. Create one to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Kanban Board */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {activeProject ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{activeProject.icon}</span>
                                <div>
                                    <h1 className="font-bold text-lg">{activeProject.name}</h1>
                                    <p className="text-xs text-gray-500">{activeProject.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Avatars */}
                                <div className="flex -space-x-2">
                                    {activeProject.members.slice(0, 3).map(mid => {
                                        const member = teamMembers.find(m => m.id === mid);
                                        return member ? (
                                            <img key={mid} src={member.avatar_url} className="w-8 h-8 rounded-full border-2 border-white" title={member.name} />
                                        ) : null;
                                    })}
                                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold border-2 border-white text-gray-500">+</button>
                                </div>
                                <div className="h-6 w-px bg-gray-200 mx-2" />
                                <button onClick={() => setIsCreateTaskOpen(true)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors">
                                    <Plus size={16} /> New Task
                                </button>
                            </div>
                        </div>

                        {/* Kanban Board */}
                        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                            <div className="flex h-full gap-6 min-w-max">
                                {STATUS_COLUMNS.map(column => {
                                    const tasksInColumn = projectTasks.filter(t => t.status === column.id);

                                    return (
                                        <div key={column.id} className="w-80 flex flex-col h-full rounded-xl bg-gray-50/50 border border-gray-100">
                                            {/* Column Header */}
                                            <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${column.color} bg-opacity-20 rounded-t-xl`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${column.id === 'published' ? 'bg-green-500' : 'bg-black'}`}></span>
                                                    <h3 className="font-bold text-sm text-gray-700">{column.label}</h3>
                                                </div>
                                                <span className="text-xs font-mono text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">{tasksInColumn.length}</span>
                                            </div>

                                            {/* Task List */}
                                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                                {tasksInColumn.map(task => (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => setSelectedTask(task)}
                                                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative cursor-pointer"
                                                    >
                                                        {/* Priority & User */}
                                                        <div className="flex justify-between items-start mb-2">
                                                            {task.priority === 'urgent' && (
                                                                <span className="bg-red-50 text-red-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <AlertCircle size={10} /> Urgent
                                                                </span>
                                                            )}
                                                            {task.priority === 'normal' && <span />}

                                                            <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity absolute top-2 right-2">
                                                                <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"><X size={12} /></button>
                                                            </div>
                                                        </div>

                                                        <h4 className="font-bold text-sm text-gray-800 mb-1">{task.title}</h4>
                                                        {task.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>}

                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <div className="flex items-center gap-2">
                                                                {/* Assignee Avatar Stub */}
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                    <UserIcon size={12} />
                                                                </div>
                                                                <span className="text-[10px] text-gray-400">{new Date(task.updated_at).toLocaleDateString()}</span>
                                                            </div>

                                                            {/* Quick Actions */}
                                                            <div className="flex items-center gap-1">
                                                                {column.id !== 'not_started' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); backtrackTask(task); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black" title="Move Back">
                                                                        <ChevronRight size={14} className="rotate-180" />
                                                                    </button>
                                                                )}
                                                                {column.id !== 'published' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); advanceTask(task); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black" title="Move Forward">
                                                                        <ChevronRight size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Column Footer */}
                                            <div className="p-3">
                                                <button
                                                    onClick={() => {
                                                        // Pre-fill active ID and open modal
                                                        setIsCreateTaskOpen(true);
                                                        // Note: In a real app we'd set the column too
                                                    }}
                                                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={12} /> Add Task
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Layout size={48} className="mb-4 opacity-20" />
                        <p>Select a project to view the board</p>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {isCreateProjectOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreateProject} className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">Create Project</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Project Name</label>
                                <input name="name" className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="e.g. Q4 Launch" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Description</label>
                                <textarea name="description" className="w-full border border-gray-200 rounded p-2 text-sm h-24" placeholder="Goal of this project..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setIsCreateProjectOpen(false)} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-50 rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-black text-white font-bold rounded">Create</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Create Task Modal */}
            {isCreateTaskOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreateTask} className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">New Task</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Task Title</label>
                                <input name="title" className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="What needs doing?" autoFocus />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-50 rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-black text-white font-bold rounded">Add Task</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    );
};
