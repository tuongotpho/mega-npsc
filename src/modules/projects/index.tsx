
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { auth, db, googleProvider } from './services/firebase.ts';
import type { User, Project, DailyReport } from './types.ts';
import Login from '../../shared/components/Login.tsx';
import LoadingSpinner from '../../shared/components/LoadingSpinner.tsx';
import { ChevronDownIcon } from '../../shared/components/Icons.tsx';

const Dashboard = lazy(() => import('./components/Dashboard.tsx'));
const ProjectDetails = lazy(() => import('./components/ProjectDetails.tsx'));
const AddProjectForm = lazy(() => import('./components/AddProjectForm.tsx'));
const UserManagement = lazy(() => import('./components/UserManagement.tsx'));

interface ProjectManagementModuleProps {
    currentUser: User | null;
    firebaseUser: any;
}

const ProjectManagementModule: React.FC<ProjectManagementModuleProps> = ({ currentUser, firebaseUser }) => {
    const [view, setView] = useState<'dashboard' | 'projectDetails' | 'addProject' | 'userManagement'>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);
    
    // FISCAL YEAR STATE
    const currentYear = new Date().getFullYear();
    const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(currentYear);

    // Helper to determine the effective year of a project
    const getProjectYear = (p: Project): number => {
        // Priority 1: Year from Construction Start Date
        if (p.constructionStartDate) {
            const parts = p.constructionStartDate.split('/');
            if (parts.length === 3) return parseInt(parts[2], 10);
        }
        // Priority 2: Year from Capital Plan Approval Date
        if (p.capitalPlanApproval?.date) {
            const parts = p.capitalPlanApproval.date.split('/');
            if (parts.length === 3) return parseInt(parts[2], 10);
        }
        // Priority 3: Explicit Financial Year field (if set manually and no dates available)
        if (p.financialYear) return p.financialYear;
        
        // Priority 4: Default to current year
        return currentYear;
    };

    useEffect(() => {
        if (!currentUser || !currentUser.role) return;
        
        setIsProjectsLoading(true);
        // Fetch all projects, then filter client-side for flexibility
        // (For very large datasets, a compound query with financialYear would be better)
        const unsub = db.collection('projects').onSnapshot(snap => {
            const allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
            
            // Apply financial year filter based on smart logic
            const filteredProjects = allProjects.filter(p => getProjectYear(p) === selectedFiscalYear);
            
            setProjects(filteredProjects);
            setIsProjectsLoading(false);
        });
        
        const usersUnsub = db.collection('users').onSnapshot(snap => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
        });
        
        return () => { unsub(); usersUnsub(); };
    }, [currentUser, selectedFiscalYear]);

    if (!firebaseUser) return (
        <Login 
            onLogin={async (e, p) => auth.signInWithEmailAndPassword(e, p)} 
            onGoogleLogin={async () => auth.signInWithPopup(googleProvider)} 
            error={null} 
        />
    );

    if (!currentUser || !currentUser.role) return (
        <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl text-center border border-yellow-100">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-4 uppercase">Tài khoản chờ duyệt</h3>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">Bạn đã đăng nhập thành công. Tuy nhiên, quản trị viên cần cấp quyền để bạn truy cập vào Phân hệ Quản lý Dự án.</p>
            <button onClick={() => auth.signOut()} className="w-full py-3 bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Đăng xuất</button>
        </div>
    );

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFiscalYear(parseInt(e.target.value));
        setView('dashboard'); // Reset to dashboard when year changes
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header with Year Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4 mb-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-primary tracking-tight">Quản lý Dự án</h2>
                    <div className="relative">
                        <select 
                            value={selectedFiscalYear} 
                            onChange={handleYearChange}
                            className="appearance-none bg-white border border-gray-300 hover:border-primary text-gray-700 py-2 pl-4 pr-10 rounded-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            {[...Array(5)].map((_, i) => {
                                const y = currentYear - 2 + i; // Show 2 years back, current, 2 years forward
                                return <option key={y} value={y}>Năm {y}</option>;
                            })}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {(() => {
                switch (view) {
                    case 'projectDetails':
                        const p = projects.find(p => p.id === selectedProjectId);
                        return p ? (
                            <Suspense fallback={<LoadingSpinner />}>
                                <ProjectDetails 
                                    project={p} 
                                    currentUser={currentUser} 
                                    users={users} 
                                    onBack={() => setView('dashboard')} 
                                    onAddReport={async (reportData) => {
                                        await db.collection('reports').add(reportData);
                                    }}
                                    onUpdateProject={async (projectData) => {
                                        await db.collection('projects').doc(projectData.id).update(projectData);
                                    }}
                                    onDeleteProject={(id) => {
                                        db.collection('projects').doc(id).delete();
                                        setView('dashboard');
                                    }}
                                    onUpdateReport={async (reportData) => {
                                        await db.collection('reports').doc(reportData.id).update(reportData);
                                    }}
                                    onDeleteReport={async (reportId) => {
                                        await db.collection('reports').doc(reportId).delete();
                                    }}
                                    onAddReportReview={async (projectId, reportId, comment, user) => {
                                        const review = {
                                            comment,
                                            reviewedById: user.id,
                                            reviewedByName: user.name,
                                            reviewedAt: new Date().toISOString()
                                        };
                                        await db.collection('projects').doc(projectId).update({
                                            [`reviews.${reportId}`]: review
                                        });
                                    }}
                                    files={[]} 
                                    folders={[]} 
                                    isFilesLoading={false} 
                                    onUploadFiles={()=>{}} 
                                    onCreateFolder={()=>{}} 
                                    onDeleteFile={()=>{}} 
                                    onDeleteFolder={()=>{}} 
                                    onBulkDelete={()=>{}} 
                                    uploadProgress={{}} 
                                />
                            </Suspense>
                        ) : null;
                    case 'addProject':
                        return (
                            <Suspense fallback={<LoadingSpinner />}>
                                <AddProjectForm 
                                    onAddProject={(projectData) => {
                                        // Ensure financial year matches the selection if not set
                                        const finalData = { ...projectData, financialYear: selectedFiscalYear };
                                        db.collection('projects').add(finalData).then(() => {
                                            setView('dashboard');
                                        });
                                    }} 
                                    onCancel={() => setView('dashboard')} 
                                    users={users} 
                                />
                            </Suspense>
                        );
                    case 'userManagement':
                        return (
                            <Suspense fallback={<LoadingSpinner />}>
                                <UserManagement 
                                    users={users} 
                                    currentUser={currentUser} 
                                    onUpdateUser={(u) => { db.collection('users').doc(u.id).update(u); }} 
                                    onDeleteUser={(uid) => { db.collection('users').doc(uid).delete(); }} 
                                    onBack={() => setView('dashboard')} 
                                    onApproveUser={(u, role) => { db.collection('users').doc(u.id).update({ role }); }} 
                                />
                            </Suspense>
                        );
                    default:
                        return (
                            <Suspense fallback={<LoadingSpinner />}>
                                <Dashboard 
                                    currentUser={currentUser} 
                                    projects={projects} 
                                    users={users} 
                                    isProjectsLoading={isProjectsLoading} 
                                    onSelectProject={(id) => { setSelectedProjectId(id); setView('projectDetails'); }} 
                                    onDeleteProject={(id) => { db.collection('projects').doc(id).delete(); }} 
                                    onNavigate={setView} 
                                    onApproveUser={async (u) => { /* handled in Dashboard usually */ }} 
                                />
                            </Suspense>
                        );
                }
            })()}
        </div>
    );
};

export default ProjectManagementModule;
