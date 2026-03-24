import React, { useMemo } from 'react';
import type { DailyReport } from '../types.ts';
import { ChartBarIcon, DocumentDuplicateIcon, PhotographIcon, TrendingUpIcon } from '../../../shared/components/Icons.tsx';

// Helper to parse date string DD/MM/YYYY to Date object
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    // Note: month is 0-indexed in JS Date
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
};

// Helper to get the start of the week (Monday) for a given date
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

interface ProjectStatsProps {
    reports: (DailyReport & { managerReview?: any })[];
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg text-secondary">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="font-bold text-lg text-gray-900">{value}</p>
        </div>
    </div>
);


const ProjectStats: React.FC<ProjectStatsProps> = ({ reports }) => {
    const stats = useMemo(() => {
        if (reports.length === 0) {
            return {
                totalReports: 0,
                totalImages: 0,
                avgProgress: '0.0%',
                weeklyActivity: [],
                maxWeeklyCount: 0,
            };
        }

        const totalReports = reports.length;
        const totalImages = reports.reduce((acc, report) => acc + report.images.length, 0);

        let totalProgressToday = 0;
        let progressReportCount = 0;
        // The reports are sorted descending, so we iterate forwards
        for (let i = 0; i < reports.length - 1; i++) {
            const currentReport = reports[i];
            const previousReport = reports[i + 1]; // The report from the day before this one
            
            if (currentReport.progressPercentage !== undefined && previousReport.progressPercentage !== undefined) {
                const progressToday = currentReport.progressPercentage - previousReport.progressPercentage;
                if (progressToday >= 0) { // Only count positive progress
                    totalProgressToday += progressToday;
                    progressReportCount++;
                }
            }
        }
        
        // Handle the very first report's progress
        const firstReport = reports[reports.length - 1];
        if (firstReport.progressPercentage !== undefined && firstReport.progressPercentage > 0) {
            totalProgressToday += firstReport.progressPercentage;
            progressReportCount++;
        }
        
        const avgProgress = progressReportCount > 0 ? (totalProgressToday / progressReportCount).toFixed(1) + '%' : '0.0%';

        // Weekly activity calculation
        const weeklyCounts: { [weekStart: string]: { count: number; date: Date } } = {};
        reports.forEach(report => {
            const reportDate = parseDate(report.date);
            if (reportDate) {
                const startOfWeek = getStartOfWeek(reportDate);
                const weekKey = startOfWeek.toISOString().split('T')[0];
                if (!weeklyCounts[weekKey]) {
                    weeklyCounts[weekKey] = { count: 0, date: startOfWeek };
                }
                weeklyCounts[weekKey].count++;
            }
        });

        const sortedWeeks = Object.values(weeklyCounts).sort((a, b) => a.date.getTime() - b.date.getTime());
        const recentWeeks = sortedWeeks.slice(-6); // Get last 6 weeks
        const maxWeeklyCount = Math.max(...recentWeeks.map(w => w.count), 0);
        
        const weeklyActivity = recentWeeks.map(week => ({
            label: `${week.date.getDate()}/${week.date.getMonth() + 1}`,
            count: week.count
        }));

        return {
            totalReports,
            totalImages,
            avgProgress,
            weeklyActivity,
            maxWeeklyCount
        };
    }, [reports]);

    return (
        <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-primary mb-4">Thống kê nhanh</h3>
                <div className="space-y-4">
                    <StatItem icon={<DocumentDuplicateIcon className="h-6 w-6" />} label="Tổng số báo cáo" value={stats.totalReports} />
                    <StatItem icon={<PhotographIcon className="h-6 w-6" />} label="Tổng số hình ảnh" value={stats.totalImages} />
                    <StatItem icon={<TrendingUpIcon className="h-6 w-6" />} label="Tiến độ TB/ngày" value={stats.avgProgress} />
                </div>
            </div>

            <div className="mt-6">
                <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-gray-500"/>
                    Hoạt động theo tuần
                </h4>
                {stats.weeklyActivity.length > 0 ? (
                    <div className="flex justify-around items-end h-24 gap-2 border-t pt-2">
                        {stats.weeklyActivity.map((week, index) => (
                            <div key={index} className="flex flex-col items-center justify-end h-full w-full group">
                                <div className="text-xs font-bold text-white bg-secondary px-1.5 py-0.5 rounded-md mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {week.count} BC
                                </div>
                                <div
                                    className="w-full bg-secondary rounded-t-md hover:bg-accent transition-colors"
                                    style={{ height: `${stats.maxWeeklyCount > 0 ? (week.count / stats.maxWeeklyCount) * 100 : 0}%` }}
                                    title={`${week.count} báo cáo`}
                                ></div>
                                <div className="text-xs text-gray-500 mt-1">{week.label}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic text-center pt-4">Chưa đủ dữ liệu.</p>
                )}
            </div>
        </div>
    );
};

export default ProjectStats;
