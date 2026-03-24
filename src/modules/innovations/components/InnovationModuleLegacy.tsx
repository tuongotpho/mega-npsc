
import React, { useState } from 'react';
import { ArrowLeftIcon, BrainCircuitIcon, LayoutDashboardIcon, BarChart3Icon, BotIcon } from '../../../shared/components/Icons.tsx';

// GIẢ ĐỊNH: Các page này bạn đã move vào thư mục pages/
// import ListPage from '../pages/ListPage';
// import StatsPage from '../pages/StatsPage';
// import ChatPage from '../pages/ChatPage';

interface InnovationModuleProps {
    onBack: () => void;
}

const InnovationModule: React.FC<InnovationModuleProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)] gap-6 animate-fade-in">
            {/* Sidebar của app Sáng kiến */}
            <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 rounded-[2rem] flex flex-col shadow-2xl">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10 font-bold text-sm"
                >
                    <ArrowLeftIcon className="h-4 w-4" /> Quay lại Portal
                </button>

                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-orange-500 p-2 rounded-xl text-white"><BrainCircuitIcon /></div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Sáng kiến</h2>
                </div>

                <nav className="space-y-2 flex-grow">
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-orange-600 shadow-lg shadow-orange-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <LayoutDashboardIcon className="h-5 w-5" /> Danh mục
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-orange-600 shadow-lg shadow-orange-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <BarChart3Icon className="h-5 w-5" /> Thống kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chat' ? 'bg-orange-600 shadow-lg shadow-orange-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <BotIcon className="h-5 w-5" /> Trợ lý AI
                    </button>
                </nav>
                
                <div className="mt-10 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Thông tin hệ thống</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">Hệ thống tra cứu và quản lý sáng kiến cải tiến kỹ thuật NPSC.</p>
                </div>
            </aside>

            {/* Nội dung các Page của Sáng kiến */}
            <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
                {activeTab === 'list' && (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-black mb-4">Danh mục Sáng kiến</h2>
                        <p className="text-gray-500 max-w-md mx-auto italic">Tích hợp codebase ListPage.tsx của bạn tại đây để hiển thị danh sách sáng kiến...</p>
                    </div>
                )}
                {activeTab === 'stats' && (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-black mb-4">Thống kê & Biểu đồ</h2>
                        <p className="text-gray-500 max-w-md mx-auto italic">Tích hợp codebase StatsPage.tsx của bạn tại đây...</p>
                    </div>
                )}
                {activeTab === 'chat' && (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-black mb-4">Hỏi đáp Sáng kiến AI</h2>
                        <p className="text-gray-500 max-w-md mx-auto italic">Tích hợp codebase ChatPage.tsx của bạn tại đây...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InnovationModule;
