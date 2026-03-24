
import React, { useState, useMemo, useRef } from 'react';
import { 
  Zap, Award, Building2, Activity, Calendar, Briefcase, 
  BarChart3, FileText, Loader2, Sparkles, Bot, ChevronLeft, ChevronRight,
  Trophy, Medal, Star, Users, Info, UserCheck, Landmark,
  ShieldCheck, Flame, TrendingUp, Gem, CheckCircle2, Calculator, ChevronDown, ChevronUp, Edit3, X, Save, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Initiative, InitiativeLevel, PointConfig } from '../types';
import { getAIInstance, AI_SYSTEM_INSTRUCTION } from '../services/aiService';

interface StatsPageProps {
  initiatives: Initiative[];
  activeTheme: any;
  onViewItem: (item: Initiative) => void;
  pointConfig: PointConfig;
  onUpdatePointConfig: (config: PointConfig) => Promise<boolean>;
  user: any;
}

const ITEMS_PER_PAGE = 5;
const HOF_LIMIT_EXPANDED = 23; // Giới hạn mới theo yêu cầu

const StatsPage: React.FC<StatsPageProps> = ({ initiatives, activeTheme, onViewItem, pointConfig, onUpdatePointConfig, user }) => {
  const [statsView, setStatsView] = useState<'level' | 'year' | 'unit' | 'field' | 'author'>('level');
  const [hallOfFameTab, setHallOfFameTab] = useState<'author' | 'unit'>('author');
  const [isHofExpanded, setIsHofExpanded] = useState(false);
  const [statsDetailValue, setStatsDetailValue] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // States for Image Export
  const [isExporting, setIsExporting] = useState(false);
  const hofRef = useRef<HTMLDivElement>(null);

  // States for Editing Point Config
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<PointConfig>(pointConfig);

  const dashboardStats = useMemo(() => {
    const total = initiatives.length;
    
    const dist = (key: keyof Initiative) => initiatives.reduce((acc, curr) => {
      const val = curr[key];
      if (Array.isArray(val)) {
        val.forEach(v => { 
          const cleanVal = typeof v === 'string' ? v.trim() : v;
          acc[cleanVal] = (acc[cleanVal] || 0) + 1; 
        });
      } else if (val) {
        const cleanVal = typeof val === 'string' ? val.trim() : val;
        acc[cleanVal as string] = (acc[cleanVal as string] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Tính điểm & Metadata cho Tác giả & Đơn vị
    const authorScores: Record<string, { score: number, count: number, years: Set<number>, hasEVN: boolean }> = {};
    const unitScores: Record<string, { score: number, count: number, years: Set<number>, hasEVN: boolean }> = {};

    initiatives.forEach(item => {
      // Use dynamic point config
      const maxWeight = item.level && item.level.length > 0 
        ? Math.max(...item.level.map(l => pointConfig[l as keyof PointConfig] || 0))
        : 1;
      
      const isEVN = item.level?.includes('EVN');

      // Tác giả
      if (item.authors && Array.isArray(item.authors)) {
        item.authors.forEach(author => {
          const name = author.trim();
          if (!authorScores[name]) authorScores[name] = { score: 0, count: 0, years: new Set(), hasEVN: false };
          authorScores[name].score += maxWeight;
          authorScores[name].count += 1;
          authorScores[name].years.add(item.year);
          if (isEVN) authorScores[name].hasEVN = true;
        });
      }

      // Đơn vị
      const units = Array.isArray(item.unit) ? item.unit : (item.unit ? [item.unit] : []);
      units.forEach(u => {
        const unitName = u.trim();
        if (!unitScores[unitName]) unitScores[unitName] = { score: 0, count: 0, years: new Set(), hasEVN: false };
        unitScores[unitName].score += maxWeight;
        unitScores[unitName].count += 1;
        unitScores[unitName].years.add(item.year);
        if (isEVN) unitScores[unitName].hasEVN = true;
      });
    });

    return { 
      total, 
      levelDist: dist('level'), 
      yearDist: dist('year'), 
      unitDist: dist('unit'), 
      fieldDist: dist('field'),
      authorDist: dist('authors'),
      authorScores,
      unitScores
    };
  }, [initiatives, pointConfig]); // Re-calculate when pointConfig changes

  // Sắp xếp toàn bộ danh sách
  const allAuthorsSorted = useMemo(() => {
    return Object.entries(dashboardStats.authorScores).sort((a: any, b: any) => b[1].score - a[1].score);
  }, [dashboardStats.authorScores]);

  const allUnitsSorted = useMemo(() => {
    return Object.entries(dashboardStats.unitScores).sort((a: any, b: any) => b[1].score - a[1].score);
  }, [dashboardStats.unitScores]);

  // Danh sách hiển thị dựa trên tab và trạng thái mở rộng
  const displayedHofItems = useMemo(() => {
    const baseList = hallOfFameTab === 'author' ? allAuthorsSorted : allUnitsSorted;
    const limit = isHofExpanded ? HOF_LIMIT_EXPANDED : 10;
    return baseList.slice(0, limit);
  }, [hallOfFameTab, isHofExpanded, allAuthorsSorted, allUnitsSorted]);

  const getBadges = (data: { score: number, count: number, years: Set<number>, hasEVN: boolean }) => {
    const badges = [];
    if (data.hasEVN) badges.push({ icon: <Gem size={10}/>, label: 'Đẳng cấp EVN', color: 'text-rose-400 bg-rose-500/10' });
    if (data.count >= 5) badges.push({ icon: <Flame size={10}/>, label: 'Cây sáng kiến', color: 'text-orange-400 bg-orange-500/10' });
    if (data.years.size >= 3) badges.push({ icon: <ShieldCheck size={10}/>, label: 'Bền bỉ', color: 'text-blue-400 bg-blue-500/10' });
    return badges;
  };

  const drillDownList = useMemo(() => {
    if (!statsDetailValue) return [];
    return initiatives.filter(i => {
      if (statsView === 'level') return i.level?.includes(statsDetailValue as InitiativeLevel);
      if (statsView === 'year') return i.year === Number(statsDetailValue);
      if (statsView === 'unit') {
        const units = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
        return units.includes(statsDetailValue as string);
      }
      if (statsView === 'field') {
        // Fix TS2367: i.field is string[], statsDetailValue is string. Use includes instead of ===
        const fields = Array.isArray(i.field) ? i.field : (i.field ? [i.field as string] : []);
        return fields.includes(statsDetailValue as string);
      }
      if (statsView === 'author') return i.authors?.some(a => a.trim() === statsDetailValue);
      return false;
    });
  }, [initiatives, statsView, statsDetailValue]);

  const paginatedList = drillDownList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const generateInsight = async () => {
    setIsGenerating(true);
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Phân tích dữ liệu: ${JSON.stringify(dashboardStats)}. Hãy dự báo xu hướng và gợi ý định hướng sáng kiến cho năm tới để nâng cao hiệu quả sản xuất kinh doanh.`,
        config: { systemInstruction: AI_SYSTEM_INSTRUCTION }
      });
      setAiInsight(response.text || "");
    } catch (e) {
      setAiInsight("Không thể tạo phân tích lúc này.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportHof = async () => {
    if (!hofRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(hofRef.current, {
        backgroundColor: '#020617', // Match slate-950
        scale: 2, // High resolution
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `Bang_Vang_NPSC_${new Date().getFullYear()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Không thể xuất ảnh lúc này. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const getRankBadge = (index: number) => {
    const baseClass = "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 shadow-xl z-20 transition-all";
    switch(index) {
      case 0: return <div className={`${baseClass} bg-amber-400 text-amber-950 border-2 border-amber-200 group-hover:scale-110`}><Trophy size={12}/> Hạng 1</div>;
      case 1: return <div className={`${baseClass} bg-slate-300 text-slate-900 border-2 border-slate-100 group-hover:scale-110`}><Medal size={12}/> Hạng 2</div>;
      case 2: return <div className={`${baseClass} bg-orange-700 text-orange-100 border-2 border-orange-500 group-hover:scale-110`}><Medal size={12}/> Hạng 3</div>;
      default: return <div className={`${baseClass} bg-slate-800 text-slate-400 border border-slate-700 group-hover:scale-110`}><Star size={10}/> Top {index + 1}</div>;
    }
  };

  const handleSaveConfig = async () => {
    const success = await onUpdatePointConfig(tempConfig);
    if (success) setIsEditConfigOpen(false);
  };

  return (
    <div className="space-y-10 animate-slide pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Trung tâm Phân tích</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Nền tảng vinh danh & Quản trị tri thức thông minh</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
          <TrendingUp size={14} className="text-emerald-500 animate-bounce"/> +12% Hiệu suất năm nay
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng sáng kiến', value: dashboardStats.total, icon: Zap, color: 'blue' },
          { label: 'Cấp EVN', value: dashboardStats.levelDist['EVN'] || 0, icon: Award, color: 'rose' },
          { label: 'Cấp NPC', value: dashboardStats.levelDist['NPC'] || 0, icon: Building2, color: 'orange' },
          { label: 'Đơn vị tham gia', value: Object.keys(dashboardStats.unitScores).length, icon: Landmark, color: 'amber' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-orange-500">
            <div className={`p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-white rounded-2xl mb-4 mx-auto w-fit group-hover:scale-110 transition-transform shadow-inner`}>
              <stat.icon size={24} className={stat.color === 'amber' ? 'text-amber-500' : ''} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] mb-1 tracking-widest">{stat.label}</p>
            <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Bảng Vàng Vinh Danh */}
      <div ref={hofRef} className="bg-slate-950 rounded-[4rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
               <div className="p-5 bg-amber-500/20 rounded-3xl text-amber-500 border border-amber-500/20 shadow-2xl shadow-amber-500/10 animate-pulse"><Trophy size={42}/></div>
               <div className="flex flex-col">
                  <h3 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3 leading-snug mb-6">Bảng Vàng Danh Dự <Gem className="text-amber-500" size={24}/></h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button onClick={() => { setHallOfFameTab('author'); setIsHofExpanded(false); }} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent ${hallOfFameTab === 'author' ? 'text-slate-950 bg-amber-500' : 'text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white'}`}>
                      <UserCheck size={14}/> Kiện tướng cá nhân
                    </button>
                    <button onClick={() => { setHallOfFameTab('unit'); setIsHofExpanded(false); }} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent ${hallOfFameTab === 'unit' ? 'text-slate-950 bg-amber-500' : 'text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white'}`}>
                      <Landmark size={14}/> Tập thể tiên phong
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3" data-html2canvas-ignore>
               {/* Export Button */}
               <button 
                onClick={handleExportHof}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-950 shadow-lg"
               >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>}
                {isExporting ? 'Đang xuất...' : 'Xuất ảnh vinh danh'}
               </button>

               {/* Toggle View Mode */}
               <button 
                onClick={() => setIsHofExpanded(!isHofExpanded)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${isHofExpanded ? 'bg-amber-500 text-slate-950 border-transparent shadow-2xl shadow-amber-500/20' : 'bg-white/5 text-slate-400 border-white/10 hover:border-amber-500/50'}`}
               >
                {isHofExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                {isHofExpanded ? 'Thu gọn' : 'Xem tất cả'}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 min-h-[300px] transition-all duration-700">
            {displayedHofItems.map(([name, data], idx) => {
               const badges = getBadges(data);
               return (
                  <button 
                    key={name}
                    onClick={() => { 
                      setStatsView(hallOfFameTab === 'author' ? 'author' : 'unit'); 
                      setStatsDetailValue(name); 
                      setCurrentPage(1); 
                    }}
                    className={`p-8 pt-14 rounded-[3.5rem] transition-all flex flex-col items-center justify-between text-center group relative overflow-visible ${statsDetailValue === name ? 'bg-amber-500 text-slate-900 scale-105 shadow-2xl shadow-amber-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/5'} ${isHofExpanded ? 'scale-95 hover:scale-100' : ''}`}
                  >
                    {getRankBadge(idx)}
                    
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full">
                      <h4 className={`text-base font-black uppercase leading-tight tracking-tight break-words w-full px-2 ${statsDetailValue === name ? 'text-slate-950' : 'text-white'}`}>
                        {name}
                      </h4>

                      {/* Badges Display */}
                      <div className="flex flex-wrap justify-center gap-2 min-h-[20px]">
                         {badges.map((b, i) => (
                           <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 ${statsDetailValue === name ? 'bg-slate-950/20 text-slate-950 border-slate-950/20' : b.color}`} title={b.label}>
                             {b.icon}
                             <span className="text-[8px] font-black uppercase tracking-tighter leading-none pt-0.5">{b.label}</span>
                           </div>
                         ))}
                      </div>

                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 justify-center">
                           <Zap size={14} className={statsDetailValue === name ? 'text-slate-950' : 'text-amber-500'} />
                           <span className={`text-3xl font-black tracking-tighter ${statsDetailValue === name ? 'text-slate-950' : 'text-white'}`}>{data.score}</span>
                           <span className={`text-[10px] font-black uppercase opacity-60`}>Điểm</span>
                        </div>
                        <p className={`text-[9px] font-black uppercase ${statsDetailValue === name ? 'text-slate-800' : 'text-slate-500'}`}>({data.count} sáng kiến)</p>
                      </div>
                    </div>
                  </button>
               );
            })}
          </div>

          {/* Chú giải cách tính điểm & Danh hiệu */}
          <div className="pt-10 border-t border-white/10 space-y-10">
            {/* 1. Cách tính điểm - Dynamic */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Calculator size={18} className="text-amber-500"/>
                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Cơ chế tính điểm tích lũy</h5>
                    <div className="w-10 h-px bg-white/5"></div>
                    <p className="text-[9px] font-bold text-slate-500 italic hidden md:block">Áp dụng cho cả {hallOfFameTab === 'author' ? 'Tác giả' : 'Đơn vị'}</p>
                </div>
                {user && (
                    <button 
                        onClick={() => { setTempConfig(pointConfig); setIsEditConfigOpen(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase text-amber-500 transition-colors"
                        data-html2canvas-ignore
                    >
                        <Edit3 size={10} /> Cấu hình điểm
                    </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'HLH', pts: pointConfig.HLH, desc: 'Hợp lý hóa', color: 'border-slate-500/20 bg-slate-500/5' },
                  { label: 'NPSC', pts: pointConfig.NPSC, desc: 'Cấp Công ty', color: 'border-red-500/20 bg-red-500/5' },
                  { label: 'NPC', pts: pointConfig.NPC, desc: 'Cấp Tổng công ty', color: 'border-orange-500/20 bg-orange-500/5' },
                  { label: 'EVN', pts: pointConfig.EVN, desc: 'Cấp Tập đoàn', color: 'border-rose-500/20 bg-rose-500/5' }
                ].map(rule => (
                  <div key={rule.label} className={`p-4 rounded-2xl border ${rule.color} flex flex-col items-center gap-1 group hover:border-amber-500/50 transition-all`}>
                    <span className="text-[10px] font-black text-white mb-1">{rule.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-amber-500">{rule.pts}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase">Điểm</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{rule.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-start gap-3">
                 <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                   <strong className="text-white">Quy tắc tối ưu:</strong> Nếu một sáng kiến đạt nhiều cấp công nhận (ví dụ đạt cả cấp NPC và NPSC), hệ thống sẽ <span className="text-amber-500">chỉ tính điểm cho cấp cao nhất đạt được</span> để đảm bảo tính công bằng và khuyến khích nâng cao chất lượng hồ sơ.
                 </p>
              </div>
            </div>

            {/* 2. Hệ thống Danh hiệu */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <Medal size={18} className="text-amber-500"/>
                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Hệ thống danh hiệu vinh danh</h5>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Cây sáng kiến', icon: <Flame size={16}/>, desc: 'Dành cho đối tượng có từ 5 sáng kiến trở lên trong kho dữ liệu.', color: 'text-orange-400' },
                  { label: 'Bền bỉ', icon: <ShieldCheck size={16}/>, desc: 'Ghi nhận sự đóng góp liên tục trong ít nhất 3 năm tài chính khác nhau.', color: 'text-blue-400' },
                  { label: 'Đẳng cấp EVN', icon: <Gem size={16}/>, desc: 'Sở hữu ít nhất một sáng kiến được công nhận cấp Tập đoàn.', color: 'text-rose-400' }
                ].map(rule => (
                  <div key={rule.label} className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                    <div className={`p-3 rounded-2xl bg-black/40 ${rule.color} group-hover:scale-110 transition-transform`}>{rule.icon}</div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{rule.label}</span>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 lg:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-[2rem] border border-slate-100 dark:border-slate-700 w-fit">
          {[
            { id: 'level', label: 'Cấp độ', icon: Award },
            { id: 'year', label: 'Năm', icon: Calendar },
            { id: 'unit', label: 'Đơn vị', icon: Building2 },
            { id: 'field', label: 'Lĩnh vực', icon: Briefcase },
            { id: 'author', label: 'Tác giả', icon: Users }
          ].map(v => (
            <button 
              key={v.id} 
              onClick={() => { setStatsView(v.id as any); setStatsDetailValue(null); setCurrentPage(1); }} 
              className={`px-8 py-4 rounded-[1.5rem] font-black text-sm flex items-center gap-2 transition-all ${statsView === v.id ? `${activeTheme.primary} text-white shadow-xl` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <v.icon size={16}/> {v.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phân bổ dữ liệu</p>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
              {Object.entries(
                statsView === 'level' ? dashboardStats.levelDist :
                statsView === 'year' ? dashboardStats.yearDist :
                statsView === 'unit' ? dashboardStats.unitDist :
                statsView === 'author' ? dashboardStats.authorDist :
                dashboardStats.fieldDist
              ).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([key, count]) => {
                const percentage = Math.round(((count as number) / (dashboardStats.total || 1)) * 100);
                return (
                  <button 
                    key={key} 
                    onClick={() => { setStatsDetailValue(key); setCurrentPage(1); }}
                    className={`w-full p-5 rounded-3xl border transition-all text-left ${statsDetailValue === key ? `${activeTheme.primary} border-transparent text-white shadow-xl` : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-black text-sm uppercase tracking-tight truncate flex-1">{key}</span>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${statsDetailValue === key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>{count} Sáng kiến</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full ${statsDetailValue === key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'} overflow-hidden`}>
                      <div className={`h-full ${statsDetailValue === key ? 'bg-white' : activeTheme.primary} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-800/20 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 flex flex-col min-h-[500px] shadow-inner">
            {statsDetailValue ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`${activeTheme.primary} p-3 rounded-2xl text-white shadow-lg`}><FileText size={20}/></div>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter max-w-[300px] truncate">{statsDetailValue}</h4>
                  </div>
                  <span className={`text-[10px] font-black ${activeTheme.text} px-4 py-2 bg-white dark:bg-slate-800 rounded-full uppercase border dark:border-slate-700 shadow-sm`}>{drillDownList.length} Mục</span>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {paginatedList.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => onViewItem(item)}
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-orange-200 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black ${activeTheme.text} uppercase`}>Năm {item.year}</span>
                        <div className="flex flex-wrap gap-1">
                          {item.level?.map(lvl => (
                            <span key={lvl} className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-md">{lvl}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-base font-bold text-slate-800 dark:text-white leading-tight uppercase group-hover:text-orange-600 transition-colors line-clamp-2">{item.title}</p>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <span>{Array.isArray(item.unit) ? item.unit[0] : item.unit}</span>
                         <span className="flex items-center gap-1"><Users size={10}/> {item.authors?.length} tác giả</span>
                      </div>
                    </div>
                  ))}
                </div>
                {drillDownList.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-black flex items-center px-4">{currentPage} / {Math.ceil(drillDownList.length / ITEMS_PER_PAGE)}</span>
                    <button disabled={currentPage === Math.ceil(drillDownList.length / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)} className="p-2 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={18}/></button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-full text-slate-200 dark:text-slate-700 mb-6 shadow-inner"><BarChart3 size={64} /></div>
                <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Chọn danh mục bên trái hoặc xem Bảng Vàng</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Point Config Modal */}
      {isEditConfigOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative overflow-hidden border-4 border-white dark:border-slate-800">
              <div className="flex items-center justify-between mb-8 border-b dark:border-slate-800 pb-4">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Edit3 size={24}/> Cấu hình điểm số</h3>
                 <button onClick={() => setIsEditConfigOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="space-y-6">
                {(['HLH', 'NPSC', 'NPC', 'EVN'] as (keyof PointConfig)[]).map((level) => (
                    <div key={level} className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">{level} - {level === 'HLH' ? 'Hợp lý hóa' : level === 'NPSC' ? 'Cấp Công ty' : level === 'NPC' ? 'Cấp Tổng Cty' : 'Cấp Tập đoàn'}</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-black text-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                                value={tempConfig[level]}
                                onChange={(e) => setTempConfig({...tempConfig, [level]: parseInt(e.target.value) || 0})}
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Điểm</span>
                        </div>
                    </div>
                ))}
              </div>
              <div className="mt-8 flex gap-4">
                 <button onClick={() => setIsEditConfigOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Hủy bỏ</button>
                 <button onClick={handleSaveConfig} className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"><Save size={16}/> Lưu thay đổi</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StatsPage;


