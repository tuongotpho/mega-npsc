
import React from 'react';
import { Users, Building2, ArrowRight, Edit, Trash2, TrendingUp, Briefcase } from 'lucide-react';
import { Initiative, InitiativeLevel } from '../types';

interface InitiativeCardProps {
  item: Initiative;
  activeTheme: any;
  user: any;
  onView: (item: Initiative) => void;
  onEdit: (item: Initiative) => void;
  onDelete: (id: string) => void;
}

const LEVEL_COLORS: Record<InitiativeLevel, string> = {
  'HLH': 'bg-slate-500',
  'NPSC': 'bg-red-600',
  'NPC': 'bg-orange-600',
  'EVN': 'bg-rose-700'
};

const InitiativeCard: React.FC<InitiativeCardProps> = ({ item, activeTheme, user, onView, onEdit, onDelete }) => {
  const unitsDisplay = Array.isArray(item.unit) ? item.unit.join(', ') : (item.unit || 'N/A');
  const fieldDisplay = Array.isArray(item.field) ? item.field.join(', ') : (item.field || '---');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all group animate-slide relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${activeTheme.gradient} opacity-0 group-hover:opacity-10 -mr-12 -mt-12 rounded-full transition-opacity duration-500`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-wrap gap-2">
          <span className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm">{item.year}</span>
          {item.level?.map(lvl => (
            <span key={lvl} className={`${LEVEL_COLORS[lvl as InitiativeLevel]} text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm`}>{lvl}</span>
          ))}
          {/* Badge Khả năng nhân rộng */}
          {item.isScalable && (
            <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm flex items-center gap-1 animate-pulse">
               <TrendingUp size={10} /> Nhân rộng
            </span>
          )}
        </div>
        {user && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className={`p-2.5 ${activeTheme.accent} dark:bg-slate-800 ${activeTheme.text} rounded-xl hover:scale-110 transition-all`}><Edit size={16} /></button>
            <button onClick={() => onDelete(item.id)} className="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-400 rounded-xl hover:scale-110 transition-all"><Trash2 size={16} /></button>
          </div>
        )}
      </div>
      
      <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white mb-4 leading-tight line-clamp-3 min-h-[3.5rem] group-hover:text-orange-600 transition-colors tracking-tight uppercase relative z-10">{item.title}</h3>
      
      {/* Hiển thị tác giả */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs mb-2 relative z-10">
        <Users size={14} className={activeTheme.text} /> 
        <span className="truncate">{Array.isArray(item.authors) ? item.authors.join(', ') : item.authors}</span>
      </div>

      {/* Hiển thị lĩnh vực (NEW) */}
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-xs mb-6 relative z-10">
        <Briefcase size={14} /> 
        <span className="truncate">{fieldDisplay}</span>
      </div>
      
      <div className="flex items-center justify-between mt-auto relative z-10">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5 truncate max-w-[150px]"><Building2 size={12} /> {unitsDisplay}</span>
        <button onClick={() => onView(item)} className={`${activeTheme.text} font-black text-[10px] lg:text-xs flex items-center gap-2 hover:gap-3 transition-all pb-1 uppercase tracking-widest`}>Chi tiết <ArrowRight size={14} /></button>
      </div>
    </div>
  );
};

export default InitiativeCard;
