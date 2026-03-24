
import React from 'react';
import type { Project } from '../../types.ts';
import { ExternalLinkIcon } from '../../../../shared/components/Icons.tsx';

interface ProjectWorkItemsTabProps {
    project: Project;
    canEditProject: boolean;
}

const ProjectWorkItemsTab: React.FC<ProjectWorkItemsTabProps> = ({ project, canEditProject }) => {
    return (
        <div className="bg-base-100 rounded-lg shadow-md border border-gray-200 animate-fade-in overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-white">
                <h3 className="text-xl font-bold text-primary">Bảng tiến độ thi công</h3>
                {project.scheduleSheetEditUrl && (
                    <a 
                        href={project.scheduleSheetEditUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                    >
                        <ExternalLinkIcon className="h-5 w-5" />
                        Mở để Chỉnh sửa
                    </a>
                )}
            </div>
            <div>
                {project.scheduleSheetUrl ? (
                    <iframe src={project.scheduleSheetUrl} className="w-full h-[70vh] border-none" title="Bảng tiến độ thi công"></iframe>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>Chưa có kế hoạch tiến độ nào được thêm vào.</p>
                        {canEditProject && <p className="mt-2 text-sm">Vui lòng vào mục "Chỉnh sửa dự án" để thêm link nhúng từ Google Sheet.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectWorkItemsTab;
