import React, { useRef } from 'react';
import { useAppStore } from '../store';
import { Pod, PodFile } from '../types';
import {
    FileText, File, Image, Film, MoreHorizontal, Download,
    Trash2, Upload, History, FilePlus
} from 'lucide-react';

interface PodFilesViewProps {
    pod: Pod;
}

export const PodFilesView: React.FC<PodFilesViewProps> = ({ pod }) => {
    const { podFiles, addPodFile, deletePodFile, uploadFileVersion, currentUser } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter files for this pod
    // Only show latest versions (conceptually). For now we show all.
    // In a real app we'd group by a 'file_series_id' or similar. 
    // Here we'll just show flat list for simplicity.
    const files = podFiles.filter(f => f.pod_id === pod.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newFile: PodFile = {
                id: crypto.randomUUID(),
                pod_id: pod.id,
                name: file.name,
                file_url: '#', // Mock URL
                file_type: file.name.split('.').pop() || 'unknown',
                size_bytes: file.size,
                uploaded_by: currentUser?.id || 'unknown',
                version: 1,
                created_at: new Date().toISOString()
            };
            addPodFile(newFile);
        }
    };

    const handleVersionUpload = (fileId: string) => {
        // In reality, this would open a file picker, get the new file, and call uploadFileVersion
        // We'll simulate it for the demo
        const parentFile = podFiles.find(f => f.id === fileId);
        if (!parentFile) return;

        const newVersion: PodFile = {
            ...parentFile,
            id: crypto.randomUUID(),
            version: parentFile.version + 1,
            parent_version_id: parentFile.id,
            created_at: new Date().toISOString(),
            size_bytes: parentFile.size_bytes + 1024 // Mock change
        };

        uploadFileVersion(fileId, newVersion);
        alert(`Uploaded version ${newVersion.version} of ${newVersion.name}`);
    };

    const getFileIcon = (type: string) => {
        if (['jpg', 'png', 'jpeg'].includes(type)) return <Image size={20} className="text-purple-500" />;
        if (['mp4', 'mov'].includes(type)) return <Film size={20} className="text-red-500" />;
        if (['pdf'].includes(type)) return <FileText size={20} className="text-orange-500" />;
        return <File size={20} className="text-gray-400" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold">Files & Assets</h2>
                    <p className="text-xs text-gray-500">Manage your team's documents.</p>
                </div>
                <div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800"
                    >
                        <Upload size={16} /> Upload File
                    </button>
                </div>
            </div>

            {/* File List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Size</th>
                            <th className="px-6 py-4">Version</th>
                            <th className="px-6 py-4">Uploaded</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {files.map(file => (
                            <tr key={file.id} className="hover:bg-gray-50 group transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        {getFileIcon(file.file_type)}
                                    </div>
                                    <div>
                                        <div className="truncate max-w-[200px]" title={file.name}>{file.name}</div>
                                        <div className="text-[10px] text-gray-400 uppercase">{file.file_type}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{formatSize(file.size_bytes)}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono font-bold text-gray-600">v{file.version}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(file.created_at).toLocaleDateString()}
                                    <div className="text-[10px]">by {currentUser?.id === file.uploaded_by ? 'You' : 'Team'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleVersionUpload(file.id)}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-500"
                                            title="Upload New Version"
                                        >
                                            <History size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-gray-200 rounded text-gray-500">
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => deletePodFile(file.id)}
                                            className="p-2 hover:bg-red-50 rounded text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {files.length === 0 && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <FilePlus size={48} className="mb-4 opacity-20" />
                        <p>No files yet. Upload one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
