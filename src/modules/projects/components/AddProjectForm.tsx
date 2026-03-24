
import React from 'react';
import type { Project, User } from '../types.ts';
import { Role } from '../types.ts';
import { XIcon } from '../../../shared/components/Icons.tsx';
import ContractorSelect from './ContractorSelect.tsx';
import { Input, MultiSelectCheckbox } from './common/FormControls.tsx';
import { useProjectForm } from '../hooks/useProjectForm.ts';
import { toYMD } from '../../../shared/utils/dateUtils.ts';

interface AddProjectFormProps {
    onAddProject: (project: Omit<Project, 'id'>) => void;
    onCancel: () => void;
    users: User[];
}

const AddProjectForm: React.FC<AddProjectFormProps> = ({ onAddProject, onCancel, users }) => {
    const { 
        formData, 
        handleChange, 
        handleContractorChange, 
        handleMultiSelectCheckboxChange, 
        handleAddPmContact, 
        handleRemovePmContact
    } = useProjectForm();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddProject(formData);
    };

    const projectManagerOptions = users.filter(u => u.role === Role.ProjectManager).map(user => ({ value: user.id, label: user.name }));
    const leadSupervisorOptions = users.filter(u => u.role === Role.LeadSupervisor).map(user => ({ value: user.id, label: user.name }));

    return (
        <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Thêm dự án mới</h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 font-semibold">
                    &larr; Quay lại
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* GENERAL INFO */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3">
                        <Input label="Tên Dự án" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700 mb-1">Năm Tài chính</label>
                        <select
                            id="financialYear"
                            name="financialYear"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                            value={formData.financialYear}
                            onChange={handleChange}
                        >
                            {[...Array(5)].map((_, i) => {
                                const y = new Date().getFullYear() - 1 + i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* SCHEDULE LINKS */}
                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Kế hoạch Tiến độ (Google Sheet)</legend>
                    <div className="mt-2 space-y-4">
                        <div>
                            <Input label="Link nhúng (src)" name="scheduleSheetUrl" value={formData.scheduleSheetUrl || ''} onChange={handleChange} placeholder="Dán link nhúng..." />
                            <p className="text-xs text-gray-500 mt-1">Chọn 'Tệp' {'>'} 'Chia sẻ' {'>'} 'Xuất bản lên web' {'>'} 'Nhúng'.</p>
                        </div>
                        <div>
                            <Input label="Link Chỉnh sửa" name="scheduleSheetEditUrl" value={formData.scheduleSheetEditUrl || ''} onChange={handleChange} placeholder="Link trình duyệt..." />
                        </div>
                    </div>
                </fieldset>

                {/* PERSONNEL */}
                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Gán Nhân sự</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <MultiSelectCheckbox label="Cán bộ Quản lý" name="projectManagerIds" options={projectManagerOptions} selectedValues={formData.projectManagerIds} onChange={(selected) => handleMultiSelectCheckboxChange('projectManagerIds', selected)} />
                        <MultiSelectCheckbox label="Giám sát trưởng" name="leadSupervisorIds" options={leadSupervisorOptions} selectedValues={formData.leadSupervisorIds} onChange={(selected) => handleMultiSelectCheckboxChange('leadSupervisorIds', selected)} />
                    </div>
                </fieldset>

                {/* TIMELINE DATES */}
                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Các Mốc Thời gian</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">1. Giao danh mục</h4>
                            <Input label="Số QĐ" name="capitalPlanApproval.decisionNumber" value={formData.capitalPlanApproval.decisionNumber} onChange={handleChange} />
                            <Input label="Ngày giao" name="capitalPlanApproval.date" value={toYMD(formData.capitalPlanApproval.date)} onChange={handleChange} type="date" />
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">2. TV Thiết kế</h4>
                            <Input label="Phát hành HSMT" name="designBidding.itbIssuanceDate" value={toYMD(formData.designBidding.itbIssuanceDate)} onChange={handleChange} type="date" />
                            <Input label="Ký Hợp đồng" name="designBidding.contractSignDate" value={toYMD(formData.designBidding.contractSignDate)} onChange={handleChange} type="date" />
                        </div>
                        {/* More timeline fields can be added here following the pattern */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                            <h4 className="font-medium text-gray-800">7. Thi công</h4>
                            <Input label="Khởi công" name="constructionStartDate" value={toYMD(formData.constructionStartDate)} onChange={handleChange} type="date" />
                            <Input label="Nghiệm thu KH" name="plannedAcceptanceDate" value={toYMD(formData.plannedAcceptanceDate)} onChange={handleChange} type="date" />
                        </div>
                    </div>
                </fieldset>

                {/* CONTACT INFO */}
                <fieldset className="p-4 border rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Thông tin Đơn vị</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md border md:col-span-1">
                            <h4 className="font-medium text-gray-800">Cán bộ QLDA</h4>
                            {(formData.projectManagementUnits || []).map((contact, index) => (
                                <div key={index} className="space-y-3 p-3 border rounded-md relative bg-white shadow-sm">
                                    {(formData.projectManagementUnits?.length || 0) > 1 && (
                                        <button type="button" onClick={() => handleRemovePmContact(index)} className="absolute top-2 right-2 text-error"><XIcon className="h-4 w-4" /></button>
                                    )}
                                    <Input label="Tên phòng" name={`projectManagementUnits.${index}.departmentName`} value={contact.departmentName} onChange={handleChange} />
                                    <Input label="Cán bộ" name={`projectManagementUnits.${index}.personnelName`} value={contact.personnelName} onChange={handleChange} />
                                    <Input label="SĐT" name={`projectManagementUnits.${index}.phone`} value={contact.phone} onChange={handleChange} />
                                </div>
                            ))}
                            <button type="button" onClick={handleAddPmContact} className="text-sm text-secondary font-semibold hover:underline mt-2">+ Thêm cán bộ</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <ContractorSelect label="Đơn vị Thiết kế" type="Design" value={formData.designUnit} onChange={(val) => handleContractorChange('designUnit', val)} />
                        <ContractorSelect label="Đơn vị Thi công" type="Construction" value={formData.constructionUnit} onChange={(val) => handleContractorChange('constructionUnit', val)} />
                        <ContractorSelect label="Đơn vị Giám sát" type="Supervision" value={formData.supervisionUnit} onChange={(val) => handleContractorChange('supervisionUnit', val)} />
                    </div>
                </fieldset>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">Hủy</button>
                    <button type="submit" className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700">Tạo Dự án</button>
                </div>
            </form>
        </div>
    );
}

export default AddProjectForm;
