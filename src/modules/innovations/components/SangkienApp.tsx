
import React, { useMemo } from 'react';
import { dbSangkien } from "../services/firebase";
import { useInitiatives } from "../hooks/useInitiatives";
import Sidebar from "./Sidebar";
import ListPage from "../pages/ListPage";
import ChatPage from "../pages/ChatPage";
import StatsPage from "../pages/StatsPage";
import BubblePage from "../pages/BubblePage";
import TreeMapPage from "../pages/TreeMapPage";
import ReferencePage from "../pages/ReferencePage";
import ResearchPage from "../pages/ResearchPage";
import RegisterPage from "../pages/RegisterPage";
import ApprovalPage from "../pages/ApprovalPage";
import ErrorBoundary from "./ErrorBoundary";
import BatchImportModal from "./BatchImportModal";
import SecurityAuditModal from "./SecurityAuditModal";
import LoginModal from "./modals/LoginModal";
import EditInitiativeModal from "./modals/EditInitiativeModal";
import ViewInitiativeModal from "./modals/ViewInitiativeModal";
import EditResearchModal from "./modals/EditResearchModal";

import { useApp } from "../contexts/AppContext";
import { useModal } from "../contexts/ModalContext";

interface SangkienAppProps {
    onBack: () => void;
}

const SangkienApp: React.FC<SangkienAppProps> = ({ onBack }) => {
    const {
        activeTab, setActiveTab,
        theme, setTheme, activeTheme,
        isDarkMode, setIsDarkMode,
        user,
        currentScope, setCurrentScope,
        pointConfig, savePointConfig
    } = useApp();

    const {
        isBatchOpen, closeBatch, openBatch,
        isSecurityOpen, closeSecurity, openSecurity,
        openLogin, openEditInitiative, openViewInitiative, openEditProject
    } = useModal();

    const { initiatives: allInitiatives } = useInitiatives();

    // Filter data by Scope
    const displayInitiatives = useMemo(() => {
        return allInitiatives.filter(i => {
            const scope = i.scope || 'Company';
            return scope === currentScope;
        });
    }, [allInitiatives, currentScope]);

    return (
        <ErrorBoundary>
            <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
                <Sidebar
                    activeTab={activeTab} setActiveTab={setActiveTab}
                    isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
                    activeTheme={activeTheme} setTheme={setTheme}
                    user={user}
                    onLogout={() => import('../services/firebase').then(m => m.authSangkien.signOut())}
                    onLogin={openLogin}
                    onAdd={() => activeTab === 'research' ? openEditProject() : openEditInitiative()}
                    onBatch={openBatch}
                    onSecurity={openSecurity}
                    currentScope={currentScope} setCurrentScope={setCurrentScope}
                    onBack={onBack}
                />

                <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
                    <div className="animate-slide">
                        {activeTab === 'register' && <RegisterPage activeTheme={activeTheme} />}
                        {activeTab === 'approvals' && <ApprovalPage activeTheme={activeTheme} />}
                        {activeTab === 'list' && <ListPage initiatives={displayInitiatives} activeTheme={activeTheme} user={user} onView={openViewInitiative} onEdit={openEditInitiative} onDelete={(id) => dbSangkien.collection("initiatives").doc(id).delete()} />}
                        {activeTab === 'stats' && <StatsPage initiatives={displayInitiatives} activeTheme={activeTheme} onViewItem={openViewInitiative} pointConfig={pointConfig} onUpdatePointConfig={savePointConfig} user={user} />}
                        {activeTab === 'chat' && <ChatPage initiatives={displayInitiatives} activeTheme={activeTheme} />}
                        {activeTab === 'references' && <ReferencePage activeTheme={activeTheme} user={user} />}
                        {activeTab === 'research' && <ResearchPage activeTheme={activeTheme} user={user} onEdit={openEditProject} onAdd={openEditProject} />}
                        {activeTab === 'bubble' && <BubblePage initiatives={displayInitiatives} activeTheme={activeTheme} user={user} onView={openViewInitiative} onEdit={openEditInitiative} onDelete={(id) => dbSangkien.collection("initiatives").doc(id).delete()} />}
                        {activeTab === 'treemap' && <TreeMapPage initiatives={displayInitiatives} activeTheme={activeTheme} user={user} onView={openViewInitiative} onEdit={openEditInitiative} onDelete={(id) => dbSangkien.collection("initiatives").doc(id).delete()} />}
                    </div>
                </main>

                {/* Global Modals Managed by Context */}
                <LoginModal />
                <BatchImportModal isOpen={isBatchOpen} onClose={closeBatch} activeTheme={activeTheme} />
                <SecurityAuditModal isOpen={isSecurityOpen} onClose={closeSecurity} activeTheme={activeTheme} user={user} />
                <EditInitiativeModal />
                <ViewInitiativeModal />
                <EditResearchModal />
            </div>
        </ErrorBoundary>
    );
};

export default SangkienApp;
