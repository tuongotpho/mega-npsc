
import React, { useState } from 'react';
import { AlertTriangle, Check, Globe, Loader2, Eye, Info } from 'lucide-react';
import { dbSangkien as db } from '../../services/firebase';
import { useModal } from '../../contexts/ModalContext';
import { Initiative } from '../../types';

interface AnalysisSectionProps {
    checkResult: any;
    isChecking: boolean;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ checkResult, isChecking }) => {
    const { openViewInitiative } = useModal();
    const [isFetchingRef, setIsFetchingRef] = useState(false);

    const handleViewReference = async (id?: string) => {
        if (!id) return;
        setIsFetchingRef(true);
        try {
            const doc = await db.collection('initiatives').doc(id).get();
            if (doc.exists) {
                openViewInitiative({ id: doc.id, ...doc.data() } as Initiative);
            } else {
                alert("Sáng kiến này không còn tồn tại hoặc đã bị xóa khỏi hệ thống.");
            }
        } catch (e) {
            console.error(e);
            alert("Không thể tải dữ liệu tham chiếu.");
        } finally {
            setIsFetchingRef(false);
        }
    };

    if (isChecking) return null;
    if (!checkResult) return null;

    const isDuplicate = checkResult.score > 50;

    return (
        <div className={`mt-4 p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-500 ${isDuplicate ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'}`}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${isDuplicate ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isDuplicate ? <AlertTriangle size={24}/> : <Check size={24}/>}
                </div>
                <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-black uppercase ${isDuplicate ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {isDuplicate ? 'Cảnh báo trùng lặp ý tưởng' : 'Ý tưởng mới & Tiềm năng'}
                        </h4>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black text-white ${isDuplicate ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                            {Math.round(checkResult.score)}% Giống
                        </span>
                    </div>
                    
                    {checkResult.similarTitle && (
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="font-bold uppercase text-slate-400 text-[10px] flex items-center gap-1.5 mb-1">
                                Sáng kiến giống nhất:
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${checkResult.similarScope === 'NPC' ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                    {checkResult.similarScope === 'NPC' ? <><Globe size={8} className="inline mr-0.5"/> Nguồn NPC</> : 'Nội bộ'}
                                </span>
                            </span>
                            <div className="flex items-start justify-between gap-2">
                                <span className="italic">"{checkResult.similarTitle}"</span>
                                {checkResult.similarId && (
                                    <button 
                                        type="button"
                                        onClick={() => handleViewReference(checkResult.similarId)}
                                        disabled={isFetchingRef}
                                        className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm ${isFetchingRef ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30'}`}
                                    >
                                        {isFetchingRef ? <Loader2 size={10} className="animate-spin"/> : <Eye size={10}/>}
                                        Xem để học tập
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {checkResult.advice}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisSection;
