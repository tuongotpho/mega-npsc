
import React from 'react';
import { Link } from 'react-router-dom';
import { RectangleStackIcon, TrophyIcon, FlagIcon, HeartHandshakeIcon, FireIcon, CogIcon, ChartBarIcon } from './Icons.tsx';

const ModuleCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
    to?: string;
    isComingSoon?: boolean;
}> = ({ title, description, icon, color, badge, to, isComingSoon }) => {
    const content = (
        <>
            <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.03] rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 group-hover:opacity-[0.08]" style={{ backgroundColor: color }}></div>

            <div className="p-5 rounded-3xl mb-8 w-max shadow-inner transition-transform group-hover:rotate-6" style={{ backgroundColor: `${color}15`, color: color }}>
                <div className="h-14 w-14">{icon}</div>
            </div>

            <h3 className="text-3xl font-black text-gray-800 mb-4 uppercase tracking-tighter leading-tight">{title}</h3>
            <p className="text-gray-500 flex-grow leading-relaxed font-medium text-lg">{description}</p>

            <div className="mt-10 flex items-center justify-between border-t border-gray-50 pt-6">
                <span className={`font-black text-sm uppercase tracking-[0.2em] ${isComingSoon ? 'text-gray-400' : ''}`} style={{ color: isComingSoon ? undefined : color }}>
                    {isComingSoon ? 'Sắp ra mắt...' : 'Khám phá ngay →'}
                </span>
                {badge && (
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isComingSoon ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {badge}
                    </span>
                )}
            </div>
        </>
    );

    const className = `bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 transition-all duration-500 text-left flex flex-col h-full group relative overflow-hidden ${isComingSoon ? 'opacity-70 cursor-default grayscale-[0.3]' : 'transform hover:-translate-y-3 hover:shadow-2xl'}`;

    if (isComingSoon || !to) {
        return <div className={className}>{content}</div>;
    }

    return (
        <Link to={to} className={className}>
            {content}
        </Link>
    );
};

const ModuleSelector: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
            {/* Trang trí nền */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-6xl w-full relative z-10">
                <div className="text-center mb-20 space-y-6">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">NPSC Unified Portal v2.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Hệ thống điều hành<br /><span className="text-blue-600">Doanh nghiệp số</span></h1>
                    <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">Giải pháp tập trung quản lý dự án, thúc đẩy sáng kiến và số hóa công tác đảng đoàn tại NPSC.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ModuleCard
                        title="Quản lý Dự án"
                        description="Theo dõi tiến độ thi công hiện trường, quản lý hồ sơ hoàn công và báo cáo nhật ký công trình hàng ngày."
                        icon={<RectangleStackIcon />}
                        color="#1E40AF"
                        badge="Nội bộ NPSC"
                        to="/SCL"
                    />
                    <ModuleCard
                        title="Quản lý Sáng kiến"
                        description="Kho dữ liệu sáng kiến toàn công ty và NPC. Tra cứu giải pháp kỹ thuật thông minh với sự hỗ trợ của AI."
                        icon={<TrophyIcon />}
                        color="#F97316"
                        badge="Công khai nội bộ"
                        to="/sangkien"
                    />
                    <ModuleCard
                        title="Hồ sơ Đảng viên"
                        description="Số hóa lý lịch, quá trình sinh hoạt và công tác phát triển Đảng viên. Quản lý nghị quyết và nhiệm vụ chi bộ."
                        icon={<FlagIcon />}
                        color="#E11D48"
                        badge="Sắp ra mắt"
                        isComingSoon={true}
                    />
                    <ModuleCard
                        title="Công tác Công đoàn"
                        description="Quản lý đoàn viên, hoạt động phong trào và chế độ phúc lợi. Kết nối và chăm lo đời sống người lao động."
                        icon={<HeartHandshakeIcon />}
                        color="#0D9488"
                        badge="Sắp ra mắt"
                        isComingSoon={true}
                    />
                    <ModuleCard
                        title="Đoàn Thanh niên"
                        description="Quản lý hồ sơ đoàn viên, chương trình rèn luyện và phong trào thanh niên."
                        icon={<FireIcon />}
                        color="#3B82F6"
                        badge="Sắp ra mắt"
                        isComingSoon={true}
                    />
                    <ModuleCard
                        title="Quản lý SCTX"
                        description="Theo dõi, quản lý tiến độ và hồ sơ các công trình sửa chữa thường xuyên."
                        icon={<CogIcon />}
                        color="#8B5CF6"
                        badge="Sắp ra mắt"
                        isComingSoon={true}
                    />
                    <ModuleCard
                        title="Quản lý SCMBA"
                        description="Quản lý quá trình sửa chữa máy biến áp, theo dõi vật tư và tiến độ thực hiện."
                        icon={<ChartBarIcon />}
                        color="#0EA5E9"
                        badge="Sắp ra mắt"
                        isComingSoon={true}
                    />
                </div>

                <div className="mt-24 text-center">
                    <div className="flex items-center justify-center gap-8 mb-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <img src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/npsc.png" alt="NPSC" className="h-12 w-auto" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">© 2025 North Power Service Company | Northern Power Corporation</p>
                </div>
            </div>
        </div>
    );
};

export default ModuleSelector;
