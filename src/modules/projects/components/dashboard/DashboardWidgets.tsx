
import React from 'react';
import { RectangleStackIcon, CogIcon, ExclamationTriangleIcon, TrophyIcon, CheckCircleIcon, ClockIcon, PauseIcon } from '../../../../shared/components/Icons.tsx';
import { ProjectPhase, ProjectStatusFilter } from '../../hooks/useDashboardLogic.ts';

export const PhaseCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    count: number;
    onClick: () => void;
    isActive: boolean;
    colorTheme: { inactiveBg: string; inactiveText: string; inactiveIconBg: string; };
}> = ({ title, description, icon, count, onClick, isActive, colorTheme }) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-xl text-left transition-all duration-300 transform hover:-translate-y-1 ${isActive ? 'bg-primary text-white shadow-lg' : `${colorTheme.inactiveBg} hover:shadow-md`}`}
    >
        <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
                 <div className={`p-3 rounded-lg ${isActive ? 'bg-white/20' : colorTheme.inactiveIconBg}`}>
                    <div className={`h-8 w-8 ${isActive ? 'text-white' : colorTheme.inactiveText}`}>{icon}</div>
                </div>
                <div>
                    <h3 className={`text-xl font-bold ${isActive ? 'text-white' : colorTheme.inactiveText}`}>{title}</h3>
                    <p className={`mt-1 text-sm ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>{description}</p>
                </div>
            </div>
             <div className={`text-4xl font-bold ${isActive ? 'text-white' : colorTheme.inactiveText}`}>{count}</div>
        </div>
    </button>
);

export const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    isActive: boolean;
}> = ({ title, value, icon, color, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-lg shadow-md flex items-center space-x-4 border-l-4 w-full text-left transition-all duration-200 transform ${isActive ? 'shadow-xl -translate-y-1' : 'bg-base-100 hover:shadow-xl hover:-translate-y-1'}`}
        style={{ borderColor: color, backgroundColor: isActive ? color : undefined }}
    >
        <div className="p-3 rounded-full transition-colors duration-200" style={{ backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : `${color}1A` }}>
            <div className="h-6 w-6 transition-colors duration-200" style={{ color: isActive ? 'white' : color }}>{icon}</div>
        </div>
        <div>
            <p className={`text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>{title}</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-800'}`}>{value}</p>
        </div>
    </button>
);

export const StatCardsSection: React.FC<{
    phase: ProjectPhase;
    stats: any;
    activeFilter: ProjectStatusFilter;
    onFilterClick: (filter: ProjectStatusFilter) => void;
}> = ({ phase, stats, activeFilter, onFilterClick }) => {
    if (phase === 'investment') {
        return (
            <>
                <StatCard title="Tổng số" value={stats.total} icon={<RectangleStackIcon />} color="#1E40AF" onClick={() => onFilterClick('total')} isActive={activeFilter === 'total'} />
                <StatCard title="Đang thực hiện" value={stats.inProgress} icon={<CogIcon />} color="#3B82F6" onClick={() => onFilterClick('inProgress')} isActive={activeFilter === 'inProgress'} />
                <StatCard title="Chậm" value={stats.delayed} icon={<ExclamationTriangleIcon />} color="#EF4444" onClick={() => onFilterClick('delayed')} isActive={activeFilter === 'delayed'} />
                <StatCard title="Hoàn thành GĐ" value={stats.completed} icon={<TrophyIcon />} color="#10B981" onClick={() => onFilterClick('completed')} isActive={activeFilter === 'completed'} />
            </>
        );
    }
    if (phase === 'construction') {
        return (
            <>
                <StatCard title="Tổng số" value={stats.total} icon={<RectangleStackIcon />} color="#1E40AF" onClick={() => onFilterClick('total')} isActive={activeFilter === 'total'} />
                <StatCard title="Đúng Tiến độ" value={stats.onTime} icon={<CheckCircleIcon />} color="#10B981" onClick={() => onFilterClick('onTime')} isActive={activeFilter === 'onTime'} />
                <StatCard title="Sắp đến hạn" value={stats.dueSoon} icon={<ClockIcon />} color="#F59E0B" onClick={() => onFilterClick('dueSoon')} isActive={activeFilter === 'dueSoon'} />
                <StatCard title="Chậm Tiến độ" value={stats.delayed} icon={<ExclamationTriangleIcon />} color="#EF4444" onClick={() => onFilterClick('delayed')} isActive={activeFilter === 'delayed'} />
                <StatCard title="Chưa Bắt đầu" value={stats.notStarted} icon={<PauseIcon />} color="#6B7280" onClick={() => onFilterClick('notStarted')} isActive={activeFilter === 'notStarted'} />
            </>
        );
    }
    // Settlement
    return (
        <>
            <StatCard title="Tổng số" value={stats.total} icon={<RectangleStackIcon />} color="#1E40AF" onClick={() => onFilterClick('total')} isActive={activeFilter === 'total'} />
            <StatCard title="Đang thực hiện" value={stats.inProgress} icon={<CogIcon />} color="#3B82F6" onClick={() => onFilterClick('inProgress')} isActive={activeFilter === 'inProgress'} />
            <StatCard title="Chậm" value={stats.delayed} icon={<ExclamationTriangleIcon />} color="#EF4444" onClick={() => onFilterClick('delayed')} isActive={activeFilter === 'delayed'} />
            <StatCard title="Đã quyết toán" value={stats.completed} icon={<TrophyIcon />} color="#10B981" onClick={() => onFilterClick('completed')} isActive={activeFilter === 'completed'} />
        </>
    );
};
