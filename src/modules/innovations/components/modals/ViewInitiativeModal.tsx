
import React, { useState } from 'react';
import { X, Info, Calendar, Award, TrendingUp, ShieldCheck, Briefcase, Users, Building2, FileText, ImageIcon, ZoomIn, Paperclip, ExternalLink, Stamp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useModal } from '../../contexts/ModalContext';

const LEVEL_COLORS: Record<string, string> = {
   'HLH': 'bg-slate-500',
   'NPSC': 'bg-red-600',
   'NPC': 'bg-orange-600',
   'EVN': 'bg-rose-700'
};

const ViewInitiativeModal: React.FC = () => {
   const { viewingInitiative: viewingItem, closeViewInitiative } = useModal();
   const { activeTheme } = useApp();
   const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

   if (!viewingItem) return null;

   // Lightbox handlers
   const handleNextImage = (e: React.MouseEvent, total: number) => {
      e.stopPropagation();
      setLightboxIndex((prev) => (prev < total - 1 ? prev + 1 : prev));
   };
   const handlePrevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : prev));
   };

   return (
      <>
         <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-4 border-white dark:border-slate-800">
               <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                     <div className={`${activeTheme.primary} p-4 rounded-2xl text-white shadow-lg`}><Info size={24} /></div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Chi tiết sáng kiến</h3>
                  </div>
                  <button onClick={closeViewInitiative} className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm text-slate-400"><X size={28} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 custom-scrollbar">
                  <div className="space-y-4">
                     <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><Calendar size={14} /> Năm {viewingItem.year}</span>
                        {viewingItem.level?.map(l => (
                           <span key={l} className={`flex items-center gap-2 ${LEVEL_COLORS[l] || 'bg-slate-500'} text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest`}><Award size={14} /> {l}</span>
                        ))}
                        {viewingItem.scope === 'NPC' && (
                           <span className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><ShieldCheck size={14} /> Hệ thống NPC</span>
                        )}
                        {viewingItem.isScalable && (
                           <span className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse"><TrendingUp size={14} /> Nhân rộng</span>
                        )}
                        {Array.isArray(viewingItem.field) ? (
                           viewingItem.field.map(f => (
                              <span key={f} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><Briefcase size={14} /> {f}</span>
                           ))
                        ) : viewingItem.field && (
                           <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><Briefcase size={14} /> {viewingItem.field}</span>
                        )}
                     </div>
                     <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight">{viewingItem.title}</h1>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={12} /> Tác giả</p>
                           <p className="text-base font-bold text-slate-800 dark:text-white">{Array.isArray(viewingItem.authors) ? viewingItem.authors.join(', ') : viewingItem.authors}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building2 size={12} /> Đơn vị áp dụng</p>
                           <p className="text-base font-bold text-slate-800 dark:text-white">{Array.isArray(viewingItem.unit) ? viewingItem.unit.join(', ') : viewingItem.unit}</p>
                        </div>
                     </div>
                  </div>

                  {/* --- HIỂN THỊ HỒ SƠ PHÊ DUYỆT (VIEW MODE) --- */}
                  {viewingItem.approvalDocUrls && viewingItem.approvalDocUrls.length > 0 && (
                     <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-[2rem] border border-amber-200 dark:border-amber-800 space-y-4 shadow-sm">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">
                           <Stamp size={16} /> Hồ sơ pháp lý / Phê duyệt
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {viewingItem.approvalDocUrls.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-800 rounded-2xl hover:border-amber-300 transition-all group shadow-sm">
                                 <ShieldCheck size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                 <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600">Quyết định / Chứng nhận {idx + 1}</span>
                                 <ExternalLink size={14} className="ml-auto text-slate-300 group-hover:text-amber-400" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-2"><FileText size={14} /> Nội dung giải pháp</p>
                     <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{viewingItem.content}</div>
                  </div>

                  {viewingItem.imageUrls && viewingItem.imageUrls.length > 0 && (
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                           <ImageIcon size={14} /> Hình ảnh minh họa
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {viewingItem.imageUrls.map((url, idx) => (
                              <div
                                 key={idx}
                                 className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform relative group"
                                 onClick={() => setLightboxIndex(idx)}
                              >
                                 <img src={url} alt={`Minh họa ${idx + 1}`} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {((viewingItem.attachmentUrls && viewingItem.attachmentUrls.length > 0) || viewingItem.driveLink) && (
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                           <Paperclip size={14} /> Tài liệu thuyết minh
                        </p>
                        <div className="flex flex-wrap gap-3">
                           {viewingItem.attachmentUrls?.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                                 <FileText size={18} className="text-slate-400 group-hover:text-blue-500" />
                                 <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600">Tài liệu {idx + 1}</span>
                                 <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-400" />
                              </a>
                           ))}
                           {viewingItem.driveLink && (
                              <a href={viewingItem.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl hover:bg-blue-100 transition-all">
                                 <ExternalLink size={18} className="text-blue-500" />
                                 <span className="text-xs font-bold text-blue-600">Link Drive gốc</span>
                              </a>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* LIGHTBOX */}
         {lightboxIndex >= 0 && viewingItem.imageUrls && viewingItem.imageUrls.length > 0 && (
            <div
               className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
               onClick={() => setLightboxIndex(-1)}
            >
               <button
                  className="absolute top-6 right-6 p-3 bg-white/10 text-white hover:bg-white/20 hover:text-red-400 rounded-full transition-all z-50"
                  onClick={() => setLightboxIndex(-1)}
               >
                  <X size={32} strokeWidth={2.5} />
               </button>
               {lightboxIndex > 0 && (
                  <button
                     className="absolute left-4 lg:left-10 p-4 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all z-50"
                     onClick={(e) => handlePrevImage(e)}
                  >
                     <ChevronLeft size={40} />
                  </button>
               )}
               <div className="relative max-w-full max-h-full flex flex-col items-center">
                  <img
                     src={viewingItem.imageUrls[lightboxIndex]}
                     alt={`Full Preview ${lightboxIndex + 1}`}
                     className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-90 duration-300"
                     onClick={(e) => e.stopPropagation()}
                  />
                  <p className="mt-4 text-white/70 font-bold uppercase tracking-widest text-sm">
                     {lightboxIndex + 1} / {viewingItem.imageUrls.length}
                  </p>
               </div>
               {lightboxIndex < viewingItem.imageUrls.length - 1 && (
                  <button
                     className="absolute right-4 lg:right-10 p-4 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all z-50"
                     onClick={(e) => handleNextImage(e, viewingItem.imageUrls!.length)}
                  >
                     <ChevronRight size={40} />
                  </button>
               )}
            </div>
         )}
      </>
   );
};

export default ViewInitiativeModal;
