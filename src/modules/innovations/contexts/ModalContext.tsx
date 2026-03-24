
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Initiative, ResearchProject } from '../types';

interface ModalContextType {
    // Login Modal
    isLoginOpen: boolean;
    openLogin: () => void;
    closeLogin: () => void;

    // Batch Import Modal
    isBatchOpen: boolean;
    openBatch: () => void;
    closeBatch: () => void;

    // Security Audit Modal
    isSecurityOpen: boolean;
    openSecurity: () => void;
    closeSecurity: () => void;

    // Edit Initiative Modal (Also handles Add New)
    editingInitiative: Partial<Initiative> | null;
    openEditInitiative: (item?: Partial<Initiative>) => void; // Pass undefined for Add New
    closeEditInitiative: () => void;

    // View Initiative Modal
    viewingInitiative: Initiative | null;
    openViewInitiative: (item: Initiative) => void;
    closeViewInitiative: () => void;

    // Edit Research Modal
    editingProject: Partial<ResearchProject> | null;
    openEditProject: (project?: Partial<ResearchProject>) => void;
    closeEditProject: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isBatchOpen, setIsBatchOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);

    const [editingInitiative, setEditingInitiative] = useState<Partial<Initiative> | null>(null);
    const [viewingInitiative, setViewingInitiative] = useState<Initiative | null>(null);
    const [editingProject, setEditingProject] = useState<Partial<ResearchProject> | null>(null);

    const value = {
        isLoginOpen, openLogin: () => setIsLoginOpen(true), closeLogin: () => setIsLoginOpen(false),
        isBatchOpen, openBatch: () => setIsBatchOpen(true), closeBatch: () => setIsBatchOpen(false),
        isSecurityOpen, openSecurity: () => setIsSecurityOpen(true), closeSecurity: () => setIsSecurityOpen(false),

        editingInitiative,
        openEditInitiative: (item?: Partial<Initiative>) => setEditingInitiative(item || {
            // Default values for new item
            title: '', authors: [], year: new Date().getFullYear(), level: ['HLH'],
            content: '', unit: [], field: [], driveLink: '', attachmentUrls: [], imageUrls: [], approvalDocUrls: [], isScalable: false
        }),
        closeEditInitiative: () => setEditingInitiative(null),

        viewingInitiative,
        openViewInitiative: (item: Initiative) => setViewingInitiative(item),
        closeViewInitiative: () => setViewingInitiative(null),

        editingProject,
        openEditProject: (project?: Partial<ResearchProject>) => setEditingProject(project || {
            // Default values for new project
            title: '', year: new Date().getFullYear(), authors: [], mainMembers: [], experts: [],
            budget: 0, progress: 0, settlementStatus: 'chua_thanh_toan', status: 'dang_thuc_hien',
            level: 'NPSC', content: '', attachmentUrl: ''
        }),
        closeEditProject: () => setEditingProject(null)
    };

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error("useModal must be used within ModalProvider");
    return context;
};
