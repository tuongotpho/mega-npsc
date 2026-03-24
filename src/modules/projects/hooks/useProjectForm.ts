
import React, { useState } from 'react';
import type { Project } from '../types.ts';
import { toDMY } from '../../../shared/utils/dateUtils.ts';

// Initial state definition remains the same
const initialState: Omit<Project, 'id'> = {
    name: '',
    financialYear: new Date().getFullYear(),
    isLocked: false,
    projectManagerIds: [],
    leadSupervisorIds: [],
    constructionStartDate: '',
    plannedAcceptanceDate: '',
    capitalPlanApproval: { decisionNumber: '', date: '' },
    technicalPlanApproval: { decisionNumber: '', date: '' },
    budgetApproval: { decisionNumber: '', date: '' },
    designUnit: { companyName: '', personnelName: '', phone: '' },
    constructionUnit: { companyName: '', personnelName: '', phone: '' },
    supervisionUnit: { companyName: '', personnelName: '', phone: '' },
    projectManagementUnits: [{ departmentName: '', personnelName: '', phone: '' }],
    supervisorA: { enterpriseName: '', personnelName: '', phone: '' },
    scheduleSheetUrl: '',
    scheduleSheetEditUrl: '',
    technicalPlanStage: { submissionDate: '', approvalDate: '' },
    budgetStage: { submissionDate: '', approvalDate: '' },
    designBidding: { itbIssuanceDate: '', contractSignDate: '' },
    supervisionBidding: { itbIssuanceDate: '', contractSignDate: '' },
    constructionBidding: { itbIssuanceDate: '', contractSignDate: '' },
    finalSettlementStage: { submissionDate: '', approvalDate: '' },
};

export const useProjectForm = (initialData?: Project) => {
    // If initialData is provided (Edit mode), use it, otherwise use initialState (Add mode)
    const [formData, setFormData] = useState<Omit<Project, 'id'>>(initialData || initialState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Use imported utility
        const finalValue = type === 'date' ? toDMY(value) : (type === 'number' ? parseInt(value) : value);
        const keys = name.split('.');

        if (keys[0] === 'projectManagementUnits' && keys.length === 3) {
            const index = parseInt(keys[1], 10);
            const field = keys[2];
            setFormData(prev => {
                const newUnits = [...(prev.projectManagementUnits || [])];
                if (newUnits[index]) {
                    newUnits[index] = { ...newUnits[index], [field]: finalValue };
                }
                return { ...prev, projectManagementUnits: newUnits };
            });
        } else if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    ...(prev[keys[0] as keyof typeof prev] as Record<string, any>),
                    [keys[1]]: finalValue
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: finalValue
            }));
        }
    };

    const handleContractorChange = (type: 'designUnit' | 'constructionUnit' | 'supervisionUnit', data: { companyName: string; personnelName: string; phone: string }) => {
        setFormData(prev => ({
            ...prev,
            [type]: data
        }));
    };

    const handleMultiSelectCheckboxChange = (name: string, selectedIds: string[]) => {
        setFormData(prev => ({ ...prev, [name]: selectedIds }));
    };

    const handleAddPmContact = () => {
        setFormData(prev => ({
            ...prev,
            projectManagementUnits: [
                ...(prev.projectManagementUnits || []),
                { departmentName: '', personnelName: '', phone: '' }
            ]
        }));
    };

    const handleRemovePmContact = (index: number) => {
        setFormData(prev => {
            const newUnits = (prev.projectManagementUnits || []).filter((_, i) => i !== index);
            if (newUnits.length === 0) newUnits.push({ departmentName: '', personnelName: '', phone: '' });
            return { ...prev, projectManagementUnits: newUnits };
        });
    };

    return {
        formData,
        handleChange,
        handleContractorChange,
        handleMultiSelectCheckboxChange,
        handleAddPmContact,
        handleRemovePmContact,
    };
};
