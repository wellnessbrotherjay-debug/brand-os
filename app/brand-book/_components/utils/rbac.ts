// RBAC (Role-Based Access Control) Helper Functions

import { UserRole, Permission, PodType, User } from '../types';

/**
 * Get default permissions for a given role
 */
export function getDefaultPermissions(role: UserRole): Permission {
    const permissionMap: Record<UserRole, Permission> = {
        admin: {
            can_view_pods: ['brand', 'marketing', 'creative', 'projects', 'operations', 'analytics', 'team'],
            can_edit_pods: ['brand', 'marketing', 'creative', 'projects', 'operations', 'analytics', 'team'],
            can_upload: true,
            can_approve: true,
            can_publish: true,
            can_manage_team: true,
        },
        project_manager: {
            can_view_pods: ['brand', 'marketing', 'creative', 'projects', 'operations', 'analytics'],
            can_edit_pods: ['marketing', 'projects', 'operations'],
            can_upload: true,
            can_approve: true,
            can_publish: false,
            can_manage_team: false,
        },
        creative_director: {
            can_view_pods: ['brand', 'marketing', 'creative', 'projects', 'analytics'],
            can_edit_pods: ['creative', 'projects'],
            can_upload: true,
            can_approve: true,
            can_publish: false,
            can_manage_team: false,
        },
        designer: {
            can_view_pods: ['brand', 'creative', 'projects'],
            can_edit_pods: ['creative'],
            can_upload: true,
            can_approve: false,
            can_publish: false,
            can_manage_team: false,
        },
        video_editor: {
            can_view_pods: ['brand', 'creative', 'projects'],
            can_edit_pods: ['creative'],
            can_upload: true,
            can_approve: false,
            can_publish: false,
            can_manage_team: false,
        },
        marketing_manager: {
            can_view_pods: ['brand', 'marketing', 'creative', 'projects', 'analytics'],
            can_edit_pods: ['marketing', 'analytics'],
            can_upload: true,
            can_approve: true,
            can_publish: false,
            can_manage_team: false,
        },
        analyst: {
            can_view_pods: ['brand', 'marketing', 'projects', 'analytics'],
            can_edit_pods: ['analytics'],
            can_upload: false,
            can_approve: false,
            can_publish: false,
            can_manage_team: false,
        },
        contributor: {
            can_view_pods: ['projects'],
            can_edit_pods: [],
            can_upload: true,
            can_approve: false,
            can_publish: false,
            can_manage_team: false,
        },
        viewer: {
            can_view_pods: ['brand', 'marketing', 'creative', 'projects', 'analytics'],
            can_edit_pods: [],
            can_upload: false,
            can_approve: false,
            can_publish: false,
            can_manage_team: false,
        },
    };

    return permissionMap[role];
}

/**
 * Check if user can view a specific pod type
 */
export function canViewPod(user: User, podType: PodType): boolean {
    return user.permissions.can_view_pods.includes(podType);
}

/**
 * Check if user can edit a specific pod type
 */
export function canEditPod(user: User, podType: PodType): boolean {
    return user.permissions.can_edit_pods.includes(podType);
}

/**
 * Check if user can perform an action
 */
export function canPerformAction(
    user: User,
    action: 'upload' | 'approve' | 'publish' | 'manage_team'
): boolean {
    switch (action) {
        case 'upload':
            return user.permissions.can_upload;
        case 'approve':
            return user.permissions.can_approve;
        case 'publish':
            return user.permissions.can_publish;
        case 'manage_team':
            return user.permissions.can_manage_team;
        default:
            return false;
    }
}

/**
 * Filter pods based on user permissions
 */
export function filterPodsByPermission<T extends { type: PodType }>(
    pods: T[],
    user: User,
    mode: 'view' | 'edit' = 'view'
): T[] {
    const allowedTypes = mode === 'view'
        ? user.permissions.can_view_pods
        : user.permissions.can_edit_pods;

    return pods.filter(pod => allowedTypes.includes(pod.type));
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
        admin: 'Admin',
        project_manager: 'Project Manager',
        creative_director: 'Creative Director',
        designer: 'Designer',
        video_editor: 'Video Editor',
        marketing_manager: 'Marketing Manager',
        analyst: 'Analyst',
        contributor: 'Contributor',
        viewer: 'Viewer',
    };

    return displayNames[role];
}

/**
 * Get role color for UI badges
 */
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        admin: 'bg-purple-100 text-purple-800',
        project_manager: 'bg-blue-100 text-blue-800',
        creative_director: 'bg-pink-100 text-pink-800',
        designer: 'bg-green-100 text-green-800',
        video_editor: 'bg-yellow-100 text-yellow-800',
        marketing_manager: 'bg-orange-100 text-orange-800',
        analyst: 'bg-cyan-100 text-cyan-800',
        contributor: 'bg-gray-100 text-gray-800',
        viewer: 'bg-slate-100 text-slate-800',
    };

    return colors[role];
}
