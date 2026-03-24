
import { useState, useEffect } from 'react';
import { db } from '../services/firebase.ts';
import { DailyReport, Project, ProjectReview } from '../types.ts';
import { generateProjectSummary } from '../../../shared/services/geminiService.ts';

export const useProjectReports = (project: Project) => {
    const [reports, setReports] = useState<(DailyReport & { managerReview?: ProjectReview })[]>([]);
    const [isReportsLoading, setIsReportsLoading] = useState(true);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [aiSummary, setAiSummary] = useState<string>('');

    useEffect(() => {
        if (!project.id) return;

        setIsReportsLoading(true);
        const reportsQuery = db.collection('reports').where('projectId', '==', project.id);

        const unsubscribe = reportsQuery.onSnapshot(snapshot => {
            const reviewsMap = project.reviews || {};
            const fetchedReports = snapshot.docs.map(doc => {
                const report = { id: doc.id, ...doc.data() } as DailyReport;
                return {
                    ...report,
                    managerReview: reviewsMap[report.id],
                };
            }).sort((a, b) => { // Sort by date DD/MM/YYYY descending
                const [dayA, monthA, yearA] = a.date.split('/').map(Number);
                const [dayB, monthB, yearB] = b.date.split('/').map(Number);
                return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
            });

            setReports(fetchedReports);
            setIsReportsLoading(false);
        }, error => {
            console.error("Error fetching reports for project:", error);
            setIsReportsLoading(false);
        });

        return () => unsubscribe();
    }, [project.id, project.reviews]);

    const generateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        try {
            const summary = await generateProjectSummary(project, reports);
            setAiSummary(summary);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            setAiSummary("Đã xảy ra lỗi khi tạo tóm tắt. Vui lòng thử lại.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    return {
        reports,
        isReportsLoading,
        isGeneratingSummary,
        aiSummary,
        generateSummary,
        setAiSummary 
    };
};
