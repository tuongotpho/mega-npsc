
import { useState, useMemo } from 'react';
import type { Project } from '../types.ts';

export type ProjectPhase = 'investment' | 'construction' | 'settlement';
export type ProjectStatusFilter = 'total' | 'inProgress' | 'onTime' | 'dueSoon' | 'delayed' | 'notStarted' | 'completed';

const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? null : date;
};

const diffDays = (start: Date, end: Date): number => {
    const difference = end.getTime() - start.getTime();
    return Math.round(difference / (1000 * 60 * 60 * 24));
};

export const useDashboardLogic = (projects: Project[]) => {
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);
    const [selectedTimelineProjectIds, setSelectedTimelineProjectIds] = useState<string[]>([]);
    const [activePhase, setActivePhase] = useState<ProjectPhase | null>(null);
    const [activeFilter, setActiveFilter] = useState<ProjectStatusFilter>('total');

    // Initialize timeline with all projects
    useMemo(() => {
        if (projects.length > 0 && selectedTimelineProjectIds.length === 0) {
            setSelectedTimelineProjectIds(projects.map(p => p.id));
        }
    }, [projects.length]);

    const { categorizedProjects, phaseStats } = useMemo(() => {
        const categories: Record<ProjectPhase, Project[]> = { investment: [], construction: [], settlement: [] };
        const stats: Record<ProjectPhase, Record<ProjectStatusFilter, number>> = {
            investment: { total: 0, inProgress: 0, delayed: 0, completed: 0, onTime:0, dueSoon:0, notStarted:0 },
            construction: { total: 0, onTime: 0, dueSoon: 0, delayed: 0, notStarted: 0, inProgress:0, completed:0 },
            settlement: { total: 0, inProgress: 0, delayed: 0, completed: 0, onTime:0, dueSoon:0, notStarted:0 },
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const project of projects) {
            const constructionStartDate = parseDate(project.constructionStartDate);
            const settlementSubmissionDate = parseDate(project.finalSettlementStage?.submissionDate);

            if (settlementSubmissionDate) {
                categories.settlement.push(project);
            } else if (constructionStartDate && today >= constructionStartDate) {
                categories.construction.push(project);
            } else {
                categories.investment.push(project);
            }
        }
        
        // Calculate Stats
        stats.investment.total = categories.investment.length;
        categories.investment.forEach(p => {
            const techSubmit = parseDate(p.technicalPlanStage?.submissionDate);
            const techApprove = parseDate(p.technicalPlanStage?.approvalDate);
            const budgetSubmit = parseDate(p.budgetStage?.submissionDate);
            const budgetApprove = parseDate(p.budgetStage?.approvalDate);
            const constractSigned = parseDate(p.constructionBidding?.contractSignDate);

            let isDelayed = false;
            if (techSubmit && !techApprove && diffDays(techSubmit, today) > 30) isDelayed = true;
            if (budgetSubmit && !budgetApprove && diffDays(budgetSubmit, today) > 30) isDelayed = true;
            
            if (constractSigned) stats.investment.completed++;
            else if (isDelayed) stats.investment.delayed++;
            else stats.investment.inProgress++;
        });

        stats.construction.total = categories.construction.length;
        categories.construction.forEach(p => {
            const startDate = parseDate(p.constructionStartDate);
            const endDate = parseDate(p.plannedAcceptanceDate);
            if (!startDate || !endDate) return;

            if (today < startDate) {
                stats.construction.notStarted++;
            } else {
                const daysRemaining = diffDays(today, endDate);
                if (daysRemaining < 0) stats.construction.delayed++;
                else if (daysRemaining <= 7) stats.construction.dueSoon++;
                else stats.construction.onTime++;
            }
        });
        
        stats.settlement.total = categories.settlement.length;
        categories.settlement.forEach(p => {
            const acceptanceDate = parseDate(p.plannedAcceptanceDate);
            const approvalDate = parseDate(p.finalSettlementStage?.approvalDate);
            if(approvalDate) stats.settlement.completed++;
            else if (acceptanceDate && diffDays(acceptanceDate, today) > 90) stats.settlement.delayed++;
            else stats.settlement.inProgress++;
        });
        
        return { categorizedProjects: categories, phaseStats: stats };
    }, [projects]);

    const filteredProjects = useMemo(() => {
        if (!activePhase) return projects;
        const projectsInPhase = categorizedProjects[activePhase];
        if (activeFilter === 'total') return projectsInPhase;

        return projectsInPhase.filter(project => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (activePhase === 'investment') {
                const techSubmit = parseDate(project.technicalPlanStage?.submissionDate);
                const techApprove = parseDate(project.technicalPlanStage?.approvalDate);
                const budgetSubmit = parseDate(project.budgetStage?.submissionDate);
                const budgetApprove = parseDate(project.budgetStage?.approvalDate);
                const constractSigned = parseDate(project.constructionBidding?.contractSignDate);

                let isDelayed = false;
                if (techSubmit && !techApprove && diffDays(techSubmit, today) > 30) isDelayed = true;
                if (budgetSubmit && !budgetApprove && diffDays(budgetSubmit, today) > 30) isDelayed = true;
                
                if (activeFilter === 'completed' && constractSigned) return true;
                if (activeFilter === 'delayed' && !constractSigned && isDelayed) return true;
                if (activeFilter === 'inProgress' && !constractSigned && !isDelayed) return true;
            }
            else if (activePhase === 'construction') {
                const startDate = parseDate(project.constructionStartDate);
                const endDate = parseDate(project.plannedAcceptanceDate);
                if (!startDate || !endDate) return false;

                if (today < startDate) return activeFilter === 'notStarted';
                const daysRemaining = diffDays(today, endDate);
                
                if (activeFilter === 'delayed' && daysRemaining < 0) return true;
                if (activeFilter === 'dueSoon' && daysRemaining >= 0 && daysRemaining <= 7) return true;
                if (activeFilter === 'onTime' && daysRemaining > 7) return true;
            }
            else if (activePhase === 'settlement') {
                const acceptanceDate = parseDate(project.plannedAcceptanceDate);
                const approvalDate = parseDate(project.finalSettlementStage?.approvalDate);
                if (activeFilter === 'completed' && approvalDate) return true;
                if (activeFilter === 'delayed' && !approvalDate && acceptanceDate && diffDays(acceptanceDate, today) > 90) return true;
                if (activeFilter === 'inProgress' && !approvalDate && (!acceptanceDate || diffDays(acceptanceDate, today) <= 90)) return true;
            }
            return false;
        });
    }, [activePhase, activeFilter, categorizedProjects, projects]);

    const timelineProjects = useMemo(() => {
        return projects.filter(p => selectedTimelineProjectIds.includes(p.id));
    }, [projects, selectedTimelineProjectIds]);

    return {
        isTimelineVisible, setIsTimelineVisible,
        selectedTimelineProjectIds, setSelectedTimelineProjectIds,
        activePhase, setActivePhase,
        activeFilter, setActiveFilter,
        categorizedProjects, phaseStats,
        filteredProjects, timelineProjects
    };
};
