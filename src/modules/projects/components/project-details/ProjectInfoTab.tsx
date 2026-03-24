
import React from 'react';
import type { Project, User } from '../../types.ts';
import { Role } from '../../types.ts';
import { CompanyIcon, PhoneIcon, UserCircleIcon, UserGroupIcon } from '../../../../shared/components/Icons.tsx';

interface ProjectInfoTabProps {
    project: Project;
    currentUser: User | null;
    users: User[];
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold text-primary border-b-2 border-primary/20 pb-2 mb-4">{title}</h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm items-start">
        <dt className="font-medium text-gray-500 flex items-center">
            {icon && <span className="mr-2 text-gray-400">{icon}</span>}
            {label}
        </dt>
        <dd className="text-gray-900 md:col-span-2">
            {value ? (
                value
            ) : (
                <span className="italic text-red-600 bg-red-100 px-2 py-0.5 rounded-md font-medium">Chưa có thông tin</span>
            )}
        </dd>
    </div>
);

const ContactCard: React.FC<{ title: string; details: { label: string; value: string; icon?: React.ReactNode }[] }> = ({ title, details }) => (
    <div className="p-4 bg-gray-50 rounded-md border h-full">
        <h5 className="font-semibold text-gray-800 mb-3 text-base">{title}</h5>
        <div className="space-y-2">
            {details.map(item => <DetailItem key={item.label} label={item.label} value={item.value} icon={item.icon} />)}
        </div>
    </div>
);

const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({ project, currentUser, users }) => {
    
    const projectManagers = users.filter(u => project.projectManagerIds.includes(u.id)).map(u => u.name).join(', ') || <span className="italic text-gray-400">Chưa gán</span>;
    const leadSupervisors = users.filter(u => project.leadSupervisorIds.includes(u.id)).map(u => u.name).join(', ') || <span className="italic text-gray-400">Chưa gán</span>;

    return (
        <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200 animate-fade-in">
            {currentUser?.role === Role.Admin && (
                <DetailSection title="Nhân sự Phụ trách (Phân quyền)">
                    <DetailItem label="Cán bộ Quản lý" value={projectManagers} icon={<UserGroupIcon />} />
                    <DetailItem label="Giám sát trưởng" value={leadSupervisors} icon={<UserGroupIcon />} />
                </DetailSection>
            )}

            <DetailSection title="Thông tin các Đơn vị & Cán bộ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ContactCard title="Đơn vị Thiết kế" details={[
                        { label: "Công ty", value: project.designUnit?.companyName, icon: <CompanyIcon /> },
                        { label: "Chủ nhiệm", value: project.designUnit?.personnelName, icon: <UserCircleIcon /> },
                        { label: "SĐT", value: project.designUnit?.phone, icon: <PhoneIcon /> },
                    ]} />
                    <ContactCard title="Đơn vị Thi công" details={[
                        { label: "Công ty", value: project.constructionUnit?.companyName, icon: <CompanyIcon /> },
                        { label: "Chỉ huy trưởng", value: project.constructionUnit?.personnelName, icon: <UserCircleIcon /> },
                        { label: "SĐT", value: project.constructionUnit?.phone, icon: <PhoneIcon /> },
                    ]} />
                    <ContactCard title="Đơn vị Giám sát" details={[
                        { label: "Công ty", value: project.supervisionUnit?.companyName, icon: <CompanyIcon /> },
                        { label: "Giám sát trưởng", value: project.supervisionUnit?.personnelName, icon: <UserCircleIcon /> },
                        { label: "SĐT", value: project.supervisionUnit?.phone, icon: <PhoneIcon /> },
                    ]} />
                    {project.projectManagementUnits && project.projectManagementUnits.length > 0 ? (
                        project.projectManagementUnits.map((unit, index) => (
                            <ContactCard 
                                key={`pm-unit-${index}`} 
                                title={`Cán bộ QLDA ${project.projectManagementUnits && project.projectManagementUnits.length > 1 ? `#${index + 1}` : ''}`} 
                                details={[
                                    { label: "Phòng", value: unit.departmentName, icon: <CompanyIcon /> },
                                    { label: "Cán bộ", value: unit.personnelName, icon: <UserCircleIcon /> },
                                    { label: "SĐT", value: unit.phone, icon: <PhoneIcon /> },
                                ]} 
                            />
                        ))
                    ) : (
                        <ContactCard 
                            title="Cán bộ QLDA" 
                            details={[
                                { label: "Phòng", value: "", icon: <CompanyIcon /> },
                                { label: "Cán bộ", value: "", icon: <UserCircleIcon /> },
                                { label: "SĐT", value: "", icon: <PhoneIcon /> },
                            ]} 
                        />
                    )}
                    <ContactCard title="Giám sát A (QLVH)" details={[
                        { label: "XNDV", value: project.supervisorA?.enterpriseName, icon: <CompanyIcon /> },
                        { label: "Cán bộ", value: project.supervisorA?.personnelName, icon: <UserCircleIcon /> },
                        { label: "SĐT", value: project.supervisorA?.phone, icon: <PhoneIcon /> },
                    ]} />
                </div>
            </DetailSection>
        </div>
    );
};

export default ProjectInfoTab;
