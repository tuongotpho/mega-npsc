
import type { User, Project } from '../types.ts';

export const permissions = {
  // ... existing simple role checks ...
  canManageUsers(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  canFetchAllUsers(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  canAddProject(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead'].includes(userRole);
  },

  // MODIFIED: Locking Logic
  // Admins can ALWAYS edit. Others can only edit if NOT locked.
  canEditProject(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    
    // Admin overrides lock
    if (userRole === 'admin') return true;

    // If locked, no one else can edit
    if (project.isLocked) return false;

    return (userRole === 'projectmanager' && project.projectManagerIds.includes(user.id));
  },

  canEditPersonnel(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead'].includes(userRole);
  },

  // MODIFIED: Locking Logic
  canAddReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    
    // If locked, ABSOLUTELY NO ONE adds reports (even Admin shouldn't add daily reports to a closed project usually, but let's keep consistency: Admin technically *could* via edit permissions, but for daily reports let's lock it for everyone to preserve "Archive" state, or allow Admin to override. Let's allow Admin override.)
    const userRole = user.role.trim().toLowerCase();
    
    if (project.isLocked && userRole !== 'admin') return false;

    return (
      (userRole === 'projectmanager' && project.projectManagerIds.includes(user.id)) ||
      (userRole === 'leadsupervisor' && project.leadSupervisorIds.includes(user.id)) ||
      userRole === 'admin' // Admin override
    );
  },
  
  canEditReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    // Only Admin can edit reports, and they can do it even if locked (to fix mistakes)
    return user.role.trim().toLowerCase() === 'admin';
  },
  
  canViewApprovalsTab(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead', 'projectmanager'].includes(userRole);
  },

  canAccessDocuments(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();

    if (['admin', 'departmenthead'].includes(userRole)) return true;
    if (userRole === 'projectmanager') return project.projectManagerIds.includes(user.id);
    return false;
  },

  // MODIFIED: Locking Logic for Documents (Upload/Create/Delete)
  // View access is still allowed via canAccessDocuments
  canCreateFolder(user: User | null, project: Project): boolean {
      if (project.isLocked && user?.role !== 'Admin') return false;
      return this.canAccessDocuments(user, project);
  },

  canUploadFile(user: User | null, project: Project): boolean {
      if (project.isLocked && user?.role !== 'Admin') return false;
      return this.canAccessDocuments(user, project);
  },

  canDeleteDocument(user: User | null, project: Project): boolean {
    if (project.isLocked && user?.role !== 'Admin') return false;
    return this.canAccessDocuments(user, project);
  },
  
  canUseAiSummary(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead'].includes(userRole);
  },

  canReviewReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    
    // Reviews are also locked for non-admins
    if (project.isLocked && userRole !== 'admin') return false;

    if (userRole === 'departmenthead') return true;
    return userRole === 'projectmanager' && project.projectManagerIds.includes(user.id);
  },

  canDeleteReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  canDeleteProject(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  canDeleteUser(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },
  
  // NEW: Check if user can Lock/Unlock projects
  canLockProject(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  }
};
