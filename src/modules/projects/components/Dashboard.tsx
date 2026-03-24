
import React, { useMemo, Suspense, lazy } from 'react';
import type { User, Project } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { ChevronDownIcon, ChevronUpIcon, PencilSquareIcon, HardHatIcon, DocumentCheckIcon } from '../../../shared/components/Icons.tsx';
import ProjectCard from './ProjectCard.tsx';
import ProjectCardSkeleton from './ProjectCardSkeleton.tsx';
import { useDashboardLogic, ProjectStatusFilter } from '../hooks/useDashboardLogic.ts';
import { PhaseCard, StatCardsSection } from './dashboard/DashboardWidgets.tsx';

const OverallTimeline = lazy(() => import('./OverallTimeline.tsx'));

type ProjectManagementView = 'dashboard' | 'projectDetails' | 'addProject' | 'userManagement';

interface DashboardProps {
    currentUser: User;
    projects: Project[];
    users: User[];
    isProjectsLoading: boolean;
    onSelectProject: (projectId: string) => void;
    onDeleteProject: (projectId: string, projectName: string) => void;
    onNavigate: (view: ProjectManagementView) => void;
    onApproveUser: (user: User) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    currentUser,
    projects,
    users,
    isProjectsLoading,
    onSelectProject,
    onDeleteProject,
    onNavigate,
    onApproveUser,
}) => {
    const {
        isTimelineVisible, setIsTimelineVisible,
        selectedTimelineProjectIds, setSelectedTimelineProjectIds,
        activePhase, setActivePhase,
        activeFilter, setActiveFilter,
        categorizedProjects, phaseStats,
        filteredProjects, timelineProjects
    } = useDashboardLogic(projects);

    const pendingUsers = useMemo(() => users.filter(u => !u.role), [users]);

    const handleFilterClick = (filter: ProjectStatusFilter) => {
        if (filter === 'total') return;
        setActiveFilter(prev => (prev === filter ? 'total' : filter));
    };

    const handleTimelineProjectToggle = (projectId: string) => {
        setSelectedTimelineProjectIds(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Timeline Section */}
            {permissions.canUseAiSummary(currentUser) && (
                <div className="bg-base-100 rounded-lg shadow-md border border-gray-200">
                    <button
                        onClick={() => setIsTimelineVisible(!isTimelineVisible)}
                        className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-primary hover:bg-neutral/50 rounded-lg"
                    >
                        <span>Dòng thời gian Tổng thể các Dự án</span>
                        {isTimelineVisible ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
                    </button>
                    {isTimelineVisible && (
                        <div className="border-t border-gray-200 p-4">
                            <div className="mb-4 bg-gray-50 p-3 rounded-md border">
                                <h4 className="font-semibold text-gray-700 mb-2">Chọn dự án để hiển thị:</h4>
                                <div className="flex gap-4 mb-3">
                                    <button onClick={() => setSelectedTimelineProjectIds(projects.map(p => p.id))} className="text-sm text-secondary hover:underline">Chọn tất cả</button>
                                    <button onClick={() => setSelectedTimelineProjectIds([])} className="text-sm text-secondary hover:underline">Bỏ chọn tất cả</button>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 max-h-24 overflow-y-auto">
                                    {projects.map(project => (
                                        <label key={project.id} className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTimelineProjectIds.includes(project.id)}
                                                onChange={() => handleTimelineProjectToggle(project.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary shrink-0"
                                            />
                                            <span className="whitespace-nowrap" title={project.name}>{project.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <Suspense fallback={<div className="text-center p-8">Đang tải dòng thời gian...</div>}>
                                <OverallTimeline projects={timelineProjects} onSelectProject={onSelectProject} />
                            </Suspense>
                        </div>
                    )}
                </div>
            )}
            
            {/* Phase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PhaseCard 
                    title="Chuẩn bị đầu tư"
                    description="Các thủ tục, phê duyệt trước thi công."
                    icon={<PencilSquareIcon />}
                    count={categorizedProjects.investment.length}
                    onClick={() => { setActivePhase(p => p === 'investment' ? null : 'investment'); setActiveFilter('total'); }}
                    isActive={activePhase === 'investment'}
                    colorTheme={{ inactiveBg: 'bg-cyan-50', inactiveText: 'text-cyan-800', inactiveIconBg: 'bg-cyan-100' }}
                />
                <PhaseCard 
                    title="Thi công"
                    description="Triển khai xây dựng tại hiện trường."
                    icon={<HardHatIcon />}
                    count={categorizedProjects.construction.length}
                    onClick={() => { setActivePhase(p => p === 'construction' ? null : 'construction'); setActiveFilter('total'); }}
                    isActive={activePhase === 'construction'}
                    colorTheme={{ inactiveBg: 'bg-orange-50', inactiveText: 'text-orange-800', inactiveIconBg: 'bg-orange-100' }}
                />
                <PhaseCard 
                    title="Quyết toán"
                    description="Hoàn thiện hồ sơ, phê duyệt cuối cùng."
                    icon={<DocumentCheckIcon />}
                    count={categorizedProjects.settlement.length}
                    onClick={() => { setActivePhase(p => p === 'settlement' ? null : 'settlement'); setActiveFilter('total'); }}
                    isActive={activePhase === 'settlement'}
                    colorTheme={{ inactiveBg: 'bg-green-50', inactiveText: 'text-green-800', inactiveIconBg: 'bg-green-100' }}
                />
            </div>
            
            {/* Filter Stats */}
            {activePhase && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCardsSection phase={activePhase} stats={phaseStats[activePhase]} activeFilter={activeFilter} onFilterClick={handleFilterClick} />
                </div>
            )}

            {/* Pending Users */}
            {permissions.canManageUsers(currentUser) && pendingUsers.length > 0 && (
                <div className="p-4 sm:p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md">
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-4">Tài khoản chờ Phê duyệt ({pendingUsers.length})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                                <div><p className="font-semibold text-gray-800">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                                <button onClick={() => onApproveUser(user)} className="bg-success text-white font-bold py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm">Phê duyệt</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Projects Grid */}
            <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">Danh sách Dự án</h2>
                    <div className="flex gap-2 sm:gap-4">
                        {permissions.canManageUsers(currentUser) && <button onClick={() => onNavigate('userManagement')} className="bg-neutral text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-300">Quản lý User</button>}
                        {permissions.canAddProject(currentUser) && <button onClick={() => onNavigate('addProject')} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90">Thêm Dự án +</button>}
                    </div>
                </div>
                {isProjectsLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}</div>
                ) : (
                    filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(project => (
                                <ProjectCard key={project.id} project={project} currentUser={currentUser} onSelectProject={onSelectProject} onDeleteProject={onDeleteProject} />
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-8">{projects.length > 0 ? 'Không có dự án nào khớp với bộ lọc này.' : 'Không có dự án nào để hiển thị.'}</p>
                    )
                )}
            </div>
        </div>
    );
};

export default Dashboard;
