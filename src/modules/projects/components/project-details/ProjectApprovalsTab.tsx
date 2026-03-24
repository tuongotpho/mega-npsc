
import React from 'react';
import type { Project } from '../../types.ts';
import ApprovalTimeline from '../ApprovalTimeline.tsx';

interface ProjectApprovalsTabProps {
    project: Project;
}

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <dt className="font-medium text-gray-500">{label}</dt>
        <dd className="text-gray-900 font-semibold text-right">
            {value ? value : <span className="text-gray-400 font-normal">--/--/----</span>}
        </dd>
    </div>
);

const DateSectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 bg-gray-50 rounded-md border h-full">
        <h5 className="font-semibold text-gray-800 mb-3 text-base">{title}</h5>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const ProjectApprovalsTab: React.FC<ProjectApprovalsTabProps> = ({ project }) => {
    return (
        <div className="animate-fade-in">
            <ApprovalTimeline project={project} />
            <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <DateSectionCard title="1. Giao danh mục">
                        <DetailItem label="Số QĐ giao" value={project.capitalPlanApproval?.decisionNumber} />
                        <DetailItem label="Ngày giao DM" value={project.capitalPlanApproval?.date} />
                    </DateSectionCard>

                    <DateSectionCard title="2. Đấu thầu: Tư vấn thiết kế">
                        <DetailItem label="Ngày P.hành HSMT" value={project.designBidding?.itbIssuanceDate} />
                        <DetailItem label="Ngày ký Hợp đồng" value={project.designBidding?.contractSignDate} />
                    </DateSectionCard>

                    <DateSectionCard title="3. Phê duyệt: Phương án kỹ thuật">
                        <DetailItem label="Ngày nộp" value={project.technicalPlanStage?.submissionDate} />
                        <DetailItem label="Ngày duyệt" value={project.technicalPlanStage?.approvalDate} />
                    </DateSectionCard>

                    <DateSectionCard title="4. Phê duyệt: Dự toán">
                        <DetailItem label="Ngày nộp" value={project.budgetStage?.submissionDate} />
                        <DetailItem label="Ngày duyệt" value={project.budgetStage?.approvalDate} />
                    </DateSectionCard>

                    <DateSectionCard title="5. Đấu thầu: Giám sát thi công">
                        <DetailItem label="Ngày P.hành HSMT" value={project.supervisionBidding?.itbIssuanceDate} />
                        <DetailItem label="Ngày ký Hợp đồng" value={project.supervisionBidding?.contractSignDate} />
                    </DateSectionCard>

                    <DateSectionCard title="6. Đấu thầu: Thi công sửa chữa">
                        <DetailItem label="Ngày P.hành HSMT" value={project.constructionBidding?.itbIssuanceDate} />
                        <DetailItem label="Ngày ký Hợp đồng" value={project.constructionBidding?.contractSignDate} />
                    </DateSectionCard>
                    
                    <DateSectionCard title="7. Triển khai thi công">
                        <DetailItem label="Ngày triển khai" value={project.constructionStartDate} />
                        <DetailItem label="Ngày nghiệm thu KH" value={project.plannedAcceptanceDate} />
                    </DateSectionCard>

                    <DateSectionCard title="8. Quyết toán">
                        <DetailItem label="Ngày nộp" value={project.finalSettlementStage?.submissionDate} />
                        <DetailItem label="Ngày duyệt" value={project.finalSettlementStage?.approvalDate} />
                    </DateSectionCard>
                </div>
            </div>
        </div>
    );
};

export default ProjectApprovalsTab;
