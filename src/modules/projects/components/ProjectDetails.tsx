
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import type { Project, DailyReport, User, ProjectReview, ProjectFile, ProjectFolder } from '../types.ts';
import { Role } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { useProjectReports } from '../hooks/useProjectReports.ts';
import { db } from '../services/firebase.ts'; // Import db to update lock status

// Main UI Components
import AddReportForm from './AddReportForm.tsx';
import EditReportForm from './EditReportForm.tsx';
import EditProjectForm from './EditProjectForm.tsx';
import ConfirmationModal from '../../../shared/components/ConfirmationModal.tsx';
import ImageLightbox from '../../../shared/components/ImageLightbox.tsx';
import ReportDetailsModal from './ReportDetailsModal.tsx';
import LoadingSpinner from '../../../shared/components/LoadingSpinner.tsx';
import { ArrowLeftIcon, TuneIcon, LockClosedIcon, CheckCircleIcon } from '../../../shared/components/Icons.tsx';

// Tab Content Components (Extracted)
import ProjectReportsTab from './project-details/ProjectReportsTab.tsx';
import ProjectApprovalsTab from './project-details/ProjectApprovalsTab.tsx';
import ProjectInfoTab from './project-details/ProjectInfoTab.tsx';
import ProjectWorkItemsTab from './project-details/ProjectWorkItemsTab.tsx';
import ReviewReportModal from './project-details/ReviewReportModal.tsx';

const DocumentManager = lazy(() => import('./DocumentManager.tsx'));

interface ProjectDetailsProps {
    project: Project;
    currentUser: User | null;
    users: User[];
    onBack: () => void;
    onAddReport: (reportData: Omit<DailyReport, 'id'>) => Promise<void>;
    onUpdateProject: (projectData: Project) => Promise<void>;
    onDeleteProject: (projectId: string, projectName: string) => void;
    onUpdateReport: (reportData: DailyReport) => Promise<void>;
    onDeleteReport: (reportId: string, projectId: string) => Promise<void>;
    onAddReportReview: (projectId: string, reportId: string, comment: string, user: User) => Promise<void>;
    // Document Management Props
    files: ProjectFile[];
    folders: ProjectFolder[];
    isFilesLoading: boolean;
    onUploadFiles: (files: File[], projectId: string, path: string) => void;
    onCreateFolder: (folderName: string, projectId: string, path: string) => void;
    onDeleteFile: (file: ProjectFile, projectId: string) => void;
    onDeleteFolder: (folder: ProjectFolder, projectId: string) => void;
    onBulkDelete: (items: { files: ProjectFile[], folders: ProjectFolder[] }, projectId: string) => void;
    uploadProgress: Record<string, { progress: number; name: string }>;
}

type DetailsView = 'details' | 'editProject' | 'addReport' | 'editReport';
type ActiveTab = 'reports' | 'approvals' | 'workItems' | 'info' | 'documents';

const getDefaultTabForRole = (role: Role | null): ActiveTab => {
    switch (role) {
        case Role.ProjectManager:
        case Role.DepartmentHead:
            return 'reports';
        case Role.LeadSupervisor:
        default:
            return 'reports';
    }
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
    project,
    currentUser,
    users,
    onBack,
    onAddReport,
    onUpdateProject,
    onUpdateReport,
    onDeleteReport,
    onAddReportReview,
    files,
    folders,
    onUploadFiles,
    onCreateFolder,
    onDeleteFile,
    onDeleteFolder,
    onBulkDelete,
    uploadProgress
}) => {
    // Custom hook for report data logic
    const { 
        reports, 
        isReportsLoading, 
        isGeneratingSummary, 
        aiSummary, 
        generateSummary,
        setAiSummary 
    } = useProjectReports(project);

    // View State
    const [view, setView] = useState<DetailsView>('details');
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => getDefaultTabForRole(currentUser?.role || null));
    const [isAdvancedToolsVisible, setIsAdvancedToolsVisible] = useState(false);

    // Modal/Interaction States
    const [selectedReportToEdit, setSelectedReportToEdit] = useState<DailyReport | null>(null);
    const [reportToDelete, setReportToDelete] = useState<{ id: string; date: string } | null>(null);
    const [reportToReview, setReportToReview] = useState<DailyReport | null>(null);
    const [viewingReport, setViewingReport] = useState<(DailyReport & { managerReview?: ProjectReview }) | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lockModalOpen, setLockModalOpen] = useState(false);

    // Permissions
    const canAddReport = useMemo(() => permissions.canAddReport(currentUser, project), [currentUser, project]);
    const canEditProject = useMemo(() => permissions.canEditProject(currentUser, project), [currentUser, project]);
    const canViewApprovals = useMemo(() => permissions.canViewApprovalsTab(currentUser), [currentUser]);
    const canAccessDocuments = useMemo(() => permissions.canAccessDocuments(currentUser, project), [currentUser, project]);
    const canUseAi = useMemo(() => permissions.canUseAiSummary(currentUser), [currentUser]);
    const canManageLock = useMemo(() => permissions.canLockProject(currentUser), [currentUser]);

    // Reset state on project change
    useEffect(() => {
        setAiSummary('');
        setActiveTab(getDefaultTabForRole(currentUser?.role || null));
        setIsAdvancedToolsVisible(false);
    }, [project.id, currentUser?.role, setAiSummary]);

    // Handlers
    const handleEditReport = (report: DailyReport) => {
        setViewingReport(null);
        setSelectedReportToEdit(report);
        setView('editReport');
    };
    
    const handleDeleteReportConfirm = (reportId: string, reportDate: string) => {
        setViewingReport(null);
        setReportToDelete({ id: reportId, date: reportDate });
    };

    const executeDeleteReport = async () => {
        if (reportToDelete) {
            await onDeleteReport(reportToDelete.id, project.id);
            setReportToDelete(null);
        }
    };

    const handleUpdateReport = async (reportData: DailyReport) => {
        await onUpdateReport(reportData);
        setView('details');
        setSelectedReportToEdit(null);
    };

    const handleUpdateProject = async (projectData: Project) => {
        await onUpdateProject(projectData);
        setView('details');
    };

    const handleStartReview = (report: DailyReport) => {
      setViewingReport(null);
      setReportToReview(report);
    };

    const handleToggleLock = async () => {
        try {
            await db.collection('projects').doc(project.id).update({
                isLocked: !project.isLocked
            });
            setLockModalOpen(false);
        } catch (error) {
            console.error("Error toggling lock:", error);
            alert("Không thể thay đổi trạng thái khóa.");
        }
    };

    // Sub-view Renders
    if (view === 'editProject') {
        return <EditProjectForm project={project} users={users} currentUser={currentUser} onUpdateProject={handleUpdateProject} onCancel={() => setView('details')} />;
    }

    if (view === 'addReport') {
        if (!currentUser) return null;
        return <AddReportForm projectId={project.id} currentUser={currentUser} onAddReport={async (data) => { await onAddReport(data); setView('details'); }} onCancel={() => setView('details')} />;
    }
    
    if (view === 'editReport' && selectedReportToEdit) {
        return <EditReportForm report={selectedReportToEdit} onUpdateReport={handleUpdateReport} onCancel={() => { setView('details'); setSelectedReportToEdit(null); }} />;
    }
    
    const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 sm:px-5 py-2 font-semibold text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 ${
                activeTab === tabName ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-primary/10 hover:text-primary'
            }`}
        >
            {label}
        </button>
    );

    return (
      <div className="animate-fade-in relative">
        <header className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-secondary hover:text-accent font-semibold flex items-center">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Trở về Dashboard
                </button>
                {/* Project Status Indicator */}
                {project.isLocked ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase border border-red-200">
                        <LockClosedIcon className="h-3 w-3"/> Đã quyết toán / Khóa sổ
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase border border-green-200">
                        <CheckCircleIcon className="h-3 w-3"/> Đang hoạt động
                    </div>
                )}
            </div>

            <div className="flex justify-between items-start flex-wrap gap-4">
                 <button 
                    onClick={() => canUseAi && setIsAdvancedToolsVisible(prev => !prev)}
                    className={`flex items-center gap-3 text-left ${canUseAi ? 'cursor-pointer group' : ''}`}
                    aria-expanded={isAdvancedToolsVisible}
                    aria-controls="advanced-tools-panel"
                    disabled={!canUseAi}
                >
                    <h2 className="text-3xl font-bold text-gray-800 group-hover:text-primary transition-colors leading-tight">{project.name}</h2>
                    {canUseAi && (
                       <TuneIcon className={`h-6 w-6 transition-colors duration-300 ${isAdvancedToolsVisible ? 'text-accent' : 'text-gray-400 group-hover:text-primary'}`} />
                    )}
                </button>
                
                <div className="flex gap-2 sm:gap-4 flex-wrap">
                    {/* Lock/Unlock Button for Admin */}
                    {canManageLock && (
                        <button 
                            onClick={() => setLockModalOpen(true)}
                            className={`font-bold py-2 px-4 rounded-md transition-colors border ${project.isLocked ? 'bg-white text-green-600 border-green-200 hover:bg-green-50' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
                        >
                            {project.isLocked ? 'Mở khóa dự án' : 'Khóa sổ / Quyết toán'}
                        </button>
                    )}

                    {canEditProject && (
                        <button onClick={() => setView('editProject')} className="bg-neutral text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                            Chỉnh sửa Dự án
                        </button>
                    )}
                    {canAddReport && (
                        <button onClick={() => setView('addReport')} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                            Thêm Báo cáo +
                        </button>
                    )}
                </div>
            </div>
        </header>

        <div className="mb-6">
            <nav className="flex space-x-2 p-1 bg-gray-200/70 rounded-lg max-w-max overflow-x-auto" aria-label="Tabs">
                <TabButton tabName="reports" label="Báo cáo" />
                {canViewApprovals && <TabButton tabName="approvals" label="Phê duyệt" />}
                {canAccessDocuments && <TabButton tabName="documents" label="Tài liệu" />}
                <TabButton tabName="workItems" label="Bảng tiến độ thi công" />
                <TabButton tabName="info" label="Thông tin" />
            </nav>
        </div>

        <div>
            {activeTab === 'reports' && (
                <ProjectReportsTab 
                    reports={reports}
                    isReportsLoading={isReportsLoading}
                    isGeneratingSummary={isGeneratingSummary}
                    aiSummary={aiSummary}
                    onGenerateSummary={generateSummary}
                    canUseAi={canUseAi}
                    isAdvancedToolsVisible={isAdvancedToolsVisible}
                    onViewReportDetails={setViewingReport}
                />
            )}
            
            {activeTab === 'approvals' && canViewApprovals && (
                <ProjectApprovalsTab project={project} />
            )}

            {activeTab === 'documents' && canAccessDocuments && (
                <Suspense fallback={<LoadingSpinner />}>
                    <DocumentManager 
                        project={project} 
                        currentUser={currentUser} 
                        files={files}
                        folders={folders}
                        onUploadFiles={onUploadFiles}
                        onCreateFolder={onCreateFolder}
                        onDeleteFile={onDeleteFile}
                        onDeleteFolder={onDeleteFolder}
                        onBulkDelete={onBulkDelete}
                        uploadProgress={uploadProgress}
                    />
                </Suspense>
            )}

            {activeTab === 'workItems' && (
                 <ProjectWorkItemsTab project={project} canEditProject={canEditProject} />
            )}
            
            {activeTab === 'info' && (
                <ProjectInfoTab project={project} currentUser={currentUser} users={users} />
            )}
        </div>

        {/* Global Modals for ProjectDetails */}
        {reportToDelete && (
            <ConfirmationModal 
                message={`Bạn có chắc chắn muốn xóa báo cáo ngày ${reportToDelete.date}?`}
                onConfirm={executeDeleteReport}
                onCancel={() => setReportToDelete(null)}
            />
        )}
        
        {reportToReview && currentUser && (
            <ReviewReportModal 
                report={reportToReview}
                currentUser={currentUser}
                onClose={() => setReportToReview(null)}
                onAddReview={onAddReportReview}
            />
        )}
        
        {lightboxImages && (
            <ImageLightbox 
                images={lightboxImages}
                startIndex={lightboxIndex}
                onClose={() => setLightboxImages(null)}
            />
        )}
        
        {/* Lock Confirmation Modal */}
        {lockModalOpen && (
            <ConfirmationModal 
                message={project.isLocked 
                    ? "Bạn có chắc chắn muốn MỞ KHÓA dự án này? Các thành viên sẽ có thể thêm báo cáo và chỉnh sửa lại."
                    : "Bạn có chắc chắn muốn KHÓA SỔ (Quyết toán) dự án này? Dữ liệu sẽ chuyển sang chế độ Chỉ Xem đối với các thành viên."
                }
                confirmText={project.isLocked ? "Mở khóa" : "Khóa sổ ngay"}
                confirmButtonClass={project.isLocked ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}
                onConfirm={handleToggleLock}
                onCancel={() => setLockModalOpen(false)}
            />
        )}
        
        {viewingReport && (() => {
            const reportIndex = reports.findIndex(r => r.id === viewingReport.id);
            const previousReport = reports[reportIndex + 1];
            const previousProgress = previousReport?.progressPercentage ?? 0;
            return (
                <ReportDetailsModal 
                    report={viewingReport}
                    project={project}
                    currentUser={currentUser}
                    review={viewingReport.managerReview}
                    reviewerName={viewingReport.managerReview?.reviewedByName}
                    onClose={() => setViewingReport(null)}
                    onEdit={handleEditReport}
                    onDelete={handleDeleteReportConfirm}
                    onReview={handleStartReview}
                    onImageClick={(imgs, idx) => { setLightboxImages(imgs); setLightboxIndex(idx); }}
                    previousProgressPercentage={previousProgress}
                />
            );
        })()}
      </div>
    );
};

export default ProjectDetails;
