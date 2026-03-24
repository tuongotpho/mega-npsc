
import React, { useState, useEffect, useMemo } from 'react';
import type { DailyReport, ProjectReview } from '../../types.ts';
import ReportCard from '../ReportCard.tsx';
import ReportCardSkeleton from '../ReportCardSkeleton.tsx';
import CalendarView from '../CalendarView.tsx';
import ProjectStats from '../ProjectStats.tsx';

interface ProjectReportsTabProps {
    reports: (DailyReport & { managerReview?: ProjectReview })[];
    isReportsLoading: boolean;
    isGeneratingSummary: boolean;
    aiSummary: string;
    onGenerateSummary: () => void;
    canUseAi: boolean;
    isAdvancedToolsVisible: boolean;
    onViewReportDetails: (report: DailyReport) => void;
}

// Helper component for mobile tabs
const TabButtonMobile: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`${
            active
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
    >
        {children}
    </button>
);

const ProjectReportsTab: React.FC<ProjectReportsTabProps> = ({ 
    reports, 
    isReportsLoading, 
    isGeneratingSummary, 
    aiSummary, 
    onGenerateSummary, 
    canUseAi,
    isAdvancedToolsVisible,
    onViewReportDetails
}) => {
    const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
    const [displayedAiSummary, setDisplayedAiSummary] = useState<string>('');
    const [mobileAdvancedTab, setMobileAdvancedTab] = useState<'summary' | 'calendar' | 'stats'>('summary');

    // AI typing effect
    useEffect(() => {
        if (aiSummary) {
            setDisplayedAiSummary('');
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedAiSummary(prev => prev + aiSummary.charAt(i));
                i++;
                if (i > aiSummary.length) {
                    clearInterval(interval);
                }
            }, 10);
            return () => clearInterval(interval);
        }
    }, [aiSummary]);

    useEffect(() => {
        setDisplayedAiSummary(''); // Reset when reports/project might change
    }, [reports]);

    const reportDatesSet = useMemo(() => new Set(reports.map(r => r.date)), [reports]);

    const filteredReports = useMemo(() => {
        if (!selectedDateFilter) return reports;
        return reports.filter(r => r.date === selectedDateFilter);
    }, [reports, selectedDateFilter]);

    const aiSummaryContent = (
        <>
            <h3 className="text-xl font-bold text-primary mb-4">Tóm tắt tiến độ bằng AI</h3>
            <div className="prose prose-sm max-w-none text-gray-800 mb-4 whitespace-pre-wrap min-h-[100px]">{displayedAiSummary || (isGeneratingSummary ? 'AI đang phân tích...' : 'Bấm nút để tạo tóm tắt.')}</div>
            <button onClick={onGenerateSummary} disabled={isGeneratingSummary || reports.length === 0} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 disabled:bg-gray-400">
                {isGeneratingSummary ? 'Đang tạo...' : 'Tạo tóm tắt'}
            </button>
            {reports.length === 0 && <p className="text-xs text-gray-500 mt-2 italic">Cần có ít nhất một báo cáo để tạo tóm tắt.</p>}
        </>
    );

    const calendarContent = (
        <>
            <h3 className="text-xl font-bold text-primary mb-4">Lịch báo cáo</h3>
            <CalendarView 
                reportDates={reportDatesSet}
                onDateSelect={(date) => setSelectedDateFilter(date)}
                selectedDate={selectedDateFilter}
            />
        </>
    );

    return (
        <div className="space-y-6">
            <div 
                id="advanced-tools-panel"
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isAdvancedToolsVisible ? 'max-h-[1000px] lg:max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                {canUseAi && (
                    <>
                        {/* --- DESKTOP VIEW: GRID --- */}
                        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">{aiSummaryContent}</div>
                            <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">{calendarContent}</div>
                            <ProjectStats reports={reports} />
                        </div>

                        {/* --- MOBILE VIEW: TABS --- */}
                        <div className="lg:hidden mb-6 bg-base-100 rounded-lg shadow-md border border-gray-200">
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                                    <TabButtonMobile active={mobileAdvancedTab === 'summary'} onClick={() => setMobileAdvancedTab('summary')}>Tóm tắt AI</TabButtonMobile>
                                    <TabButtonMobile active={mobileAdvancedTab === 'calendar'} onClick={() => setMobileAdvancedTab('calendar')}>Lịch</TabButtonMobile>
                                    <TabButtonMobile active={mobileAdvancedTab === 'stats'} onClick={() => setMobileAdvancedTab('stats')}>Thống kê</TabButtonMobile>
                                </nav>
                            </div>
                            <div>
                                {mobileAdvancedTab === 'summary' && <div className="p-6">{aiSummaryContent}</div>}
                                {mobileAdvancedTab === 'calendar' && <div className="p-6">{calendarContent}</div>}
                                {mobileAdvancedTab === 'stats' && <ProjectStats reports={reports} />}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {selectedDateFilter && (
                <div className="flex justify-center items-center gap-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm font-semibold text-blue-800">
                        Đang hiển thị báo cáo cho ngày: {selectedDateFilter}
                    </p>
                    <button 
                        onClick={() => setSelectedDateFilter(null)}
                        className="bg-white text-blue-700 text-xs font-bold py-1 px-3 rounded-full border border-blue-300 hover:bg-blue-100"
                    >
                        Xem tất cả
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {isReportsLoading ? (
                    [...Array(12)].map((_, i) => <ReportCardSkeleton key={i} />)
                ) : filteredReports.length > 0 ? (
                    filteredReports.map((report) => {
                        // Find the correct previous report from the original sorted 'reports' array
                        const originalIndex = reports.findIndex(r => r.id === report.id);
                        const previousReport = reports[originalIndex + 1];
                        const previousProgress = previousReport?.progressPercentage ?? 0;
                        return (
                            <ReportCard 
                                key={report.id} 
                                report={report}
                                onViewDetails={() => onViewReportDetails(report)}
                                review={report.managerReview}
                                reviewerName={report.managerReview?.reviewedByName}
                                previousProgressPercentage={previousProgress}
                            />
                        );
                    })
                ) : (
                    <p className="col-span-full text-center text-gray-500 py-8">
                        {selectedDateFilter ? `Không có báo cáo nào cho ngày ${selectedDateFilter}.` : 'Chưa có báo cáo nào cho dự án này.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProjectReportsTab;
