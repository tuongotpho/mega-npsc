
import React from 'react';
import { UploadCloud, Loader2, CheckCircle2, FileText, X, ImageIcon, Trash2 } from 'lucide-react';

interface RegisterUploadsProps {
    // Auto-fill props
    onAutoFillUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isAnalyzing: boolean;
    registrationFile: File | null;
    
    // Attachments props
    attachmentFiles: File[];
    onAttachmentSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAttachment: (index: number) => void;
    
    // Images props
    imageFiles: File[];
    imagePreviews: string[];
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: (index: number) => void;
    isCompressing: boolean;
}

export const AutoFillUpload: React.FC<Pick<RegisterUploadsProps, 'onAutoFillUpload' | 'isAnalyzing' | 'registrationFile'>> = ({ onAutoFillUpload, isAnalyzing, registrationFile }) => (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/30">
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-indigo-500 shrink-0">
                {isAnalyzing ? <Loader2 className="animate-spin" size={32}/> : <UploadCloud size={32} />}
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight">Bước 1: Tải đơn đăng ký (Tự động điền)</h3>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Upload file (.pdf, .doc, .docx), AI sẽ tự động trích xuất thông tin.</p>
                {registrationFile && (
                    <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500">Đã nhận: {registrationFile.name}</span>
                    </div>
                )}
            </div>
            <div className="relative shrink-0">
                <input type="file" accept=".pdf,.doc,.docx" onChange={onAutoFillUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isAnalyzing} />
                <button className={`px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20 flex items-center gap-2 hover:bg-indigo-700 transition-all ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isAnalyzing ? 'Đang đọc file...' : 'Chọn File Đơn'}
                </button>
            </div>
        </div>
    </div>
);

export const AttachmentsList: React.FC<Pick<RegisterUploadsProps, 'attachmentFiles' | 'onAttachmentSelect' | 'onRemoveAttachment'>> = ({ attachmentFiles, onAttachmentSelect, onRemoveAttachment }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center ml-2">
            <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">Tài liệu đính kèm (Thuyết minh, Bản vẽ...)</label>
            <span className="text-[10px] font-bold text-slate-400">{attachmentFiles.length} file</span>
        </div>
        
        <div className="flex flex-col gap-3">
            {attachmentFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FileText size={16}/></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => onRemoveAttachment(idx)} className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><X size={16}/></button>
                </div>
            ))}

            <label className="flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                <UploadCloud size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 uppercase">Thêm tài liệu (PDF, Office, Zip, Rar...)</span>
                {/* Updated accept attribute to include compressed formats and ensure broader compatibility */}
                <input 
                    type="file" 
                    multiple 
                    onChange={onAttachmentSelect} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z" 
                />
            </label>
        </div>
    </div>
);

export const ImageGallery: React.FC<Pick<RegisterUploadsProps, 'imageFiles' | 'imagePreviews' | 'onImageSelect' | 'onRemoveImage' | 'isCompressing'>> = ({ imageFiles, imagePreviews, onImageSelect, onRemoveImage, isCompressing }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center ml-2">
            <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">Hình ảnh minh họa <span className="text-rose-500">*</span></label>
            <span className="text-[10px] font-bold text-slate-400">{imageFiles.length} ảnh</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imagePreviews.map((src, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-200 dark:border-slate-700">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => onRemoveImage(idx)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}

            <label className={`aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
                {isCompressing ? <Loader2 className="animate-spin text-purple-500"/> : <ImageIcon size={24} className="text-slate-300 group-hover:text-purple-500 transition-colors"/>}
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-purple-600 uppercase text-center px-2">
                    {isCompressing ? 'Đang xử lý...' : 'Thêm ảnh'}
                </span>
                <input type="file" multiple onChange={onImageSelect} className="hidden" accept="image/*,.heic" />
            </label>
        </div>
    </div>
);
