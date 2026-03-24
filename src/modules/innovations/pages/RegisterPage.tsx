
import React, { useState } from 'react';
import { Send, User, Building2, Layers, CheckCircle2, Loader2, Sparkles, Lightbulb, AlertTriangle, Phone, CalendarClock, ScanSearch, FileText } from 'lucide-react';
import { useRegisterLogic } from '../hooks/useRegisterLogic';
import { useFileHandler } from '../hooks/useFileHandler';
import { AutoFillUpload, AttachmentsList, ImageGallery } from '../components/register/RegisterUploads';
import AnalysisSection from '../components/register/AnalysisSection';

interface RegisterPageProps {
  activeTheme: any;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ activeTheme }) => {
  const { 
    formData, setFormData, 
    isSubmitting, isCheckingSim, checkResult, 
    success, setSuccess, formError, setFormError, 
    handleFieldToggle, handleCheckSimilarity, submitForm, INITIATIVE_FIELDS 
  } = useRegisterLogic();

  const { 
    isAnalyzing, isCompressing, uploadProgress, 
    processAutoFillFile, processImages, fileError 
  } = useFileHandler();

  // Local file states for UI display before submission
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Handlers ---

  const handleAutoFillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegistrationFile(file);
    
    const aiData = await processAutoFillFile(file);
    if (aiData) {
        let formattedContent = aiData.content || '';
        if (formattedContent) {
            formattedContent = formattedContent.replace(/([^\n])\s*-\s/g, "$1\n- ");
            formattedContent = formattedContent.replace(/\.\s*-/g, ".\n-");
            if (formattedContent.trim().length > 0 && !formattedContent.trim().startsWith('-')) {
               formattedContent = '- ' + formattedContent;
            }
        }
        setFormData(prev => ({
            ...prev,
            title: aiData.title || '',
            authors: aiData.authors || '',
            unit: aiData.unit || '',
            content: formattedContent,
            field: Array.isArray(aiData.field) ? aiData.field.filter((f: string) => INITIATIVE_FIELDS.includes(f)) : [],
            year: aiData.year || new Date().getFullYear(),
            monthsApplied: aiData.monthsApplied || 0
        }));
        showToast("Trích xuất thông tin Đơn đăng ký thành công!", "success");
    } else {
        showToast("Có lỗi xảy ra khi trích xuất hoặc định dạng file không được hỗ trợ.", "error");
    }
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setAttachmentFiles(prev => [...prev, ...selectedFiles]);
      showToast(`Đã thêm ${selectedFiles.length} tài liệu đính kèm.`, "success");
    }
    e.target.value = '';
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const { files, previews } = await processImages(Array.from(e.target.files));
        setImageFiles(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...previews]);
        showToast(`Đã thêm ${files.length} hình ảnh minh họa.`, "success");
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attachmentFiles.length === 0 || imageFiles.length === 0) {
        setShowWarningModal(true);
        return;
    }
    // Clean up previews before submit (optional, but good practice)
    const success = await submitForm(registrationFile, attachmentFiles, imageFiles);
    if (success) {
        // Reset local file states
        setRegistrationFile(null);
        setAttachmentFiles([]);
        setImageFiles([]);
        setImagePreviews([]);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-slide text-center space-y-6 p-10">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-xl mb-4">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Đăng ký thành công!</h2>
        <p className="text-slate-500 max-w-md">Sáng kiến của bạn đã được gửi lên hệ thống và thông báo đến quản trị viên.</p>
        <button onClick={() => setSuccess(false)} className={`px-8 py-4 ${activeTheme.primary} text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all`}>Gửi sáng kiến khác</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide pb-20 relative">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 text-[10px] font-black uppercase tracking-widest">
           <Sparkles size={12} className="text-orange-500" /> Cổng thông tin mở
        </div>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Đăng ký Sáng kiến Mới</h2>
        <p className="text-slate-400 font-medium max-w-2xl mx-auto">Chia sẻ ý tưởng, giải pháp của bạn. Hệ thống hỗ trợ AI tự điền form và đánh giá trùng lặp.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 lg:p-12 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
        
        <AutoFillUpload 
            onAutoFillUpload={handleAutoFillUpload} 
            isAnalyzing={isAnalyzing} 
            registrationFile={registrationFile} 
        />

        <form onSubmit={handleSubmit} className="space-y-8">
          {(formError || fileError) && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold text-center flex flex-col gap-1 items-center animate-in fade-in">
             <AlertTriangle size={24} className="mb-1"/>
             <span>{formError || fileError}</span>
          </div>}

          <div className="space-y-2">
             <label className="text-xs font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><Lightbulb size={12}/> Tên sáng kiến <span className="text-rose-500">*</span></label>
             <input type="text" required placeholder="Nhập tên đầy đủ của sáng kiến..." className="w-full px-6 py-4 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 text-lg transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-xs font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><User size={12}/> Tác giả <span className="text-rose-500">*</span></label>
               <input type="text" required placeholder="Nguyễn Văn A, Trần Thị B..." className="w-full px-6 py-4 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.authors} onChange={e => setFormData({...formData, authors: e.target.value})} />
               <p className="text-[10px] text-slate-400 ml-2 italic">Phân cách nhiều tác giả bằng dấu phẩy (,)</p>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><Building2 size={12}/> Đơn vị áp dụng <span className="text-rose-500">*</span></label>
               <input type="text" required placeholder="Phòng Kỹ thuật, Đội 1..." className="w-full px-6 py-4 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><Phone size={12}/> Zalo / SĐT liên hệ <span className="text-rose-500">*</span></label>
                <input type="text" required placeholder="Nhập số điện thoại Zalo của người đại diện..." className="w-full px-6 py-4 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.contactZalo} onChange={e => setFormData({...formData, contactZalo: e.target.value})} />
                <p className="text-[10px] text-slate-400 ml-2 italic">Bắt buộc để Admin liên hệ nếu hồ sơ cần bổ sung/chỉnh sửa.</p>
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-between ml-2">
                   <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><CalendarClock size={12}/> Đã áp dụng thực tế (Tháng)</label>
                   {formData.monthsApplied < 3 && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Yêu cầu &gt; 3 tháng</span>}
                </div>
                <div className="relative">
                   <input 
                      type="number" 
                      readOnly 
                      className={`w-full px-6 py-4 border rounded-2xl font-black text-center outline-none transition-all cursor-not-allowed ${formData.monthsApplied < 3 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300'}`}
                      value={formData.monthsApplied} 
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-lg">Auto AI</span>
                </div>
                <p className="text-[10px] text-slate-400 ml-2 italic">Dữ liệu được AI trích xuất tự động. Nếu sai, vui lòng cập nhật trong file và tải lên lại.</p>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><Layers size={12}/> Lĩnh vực chuyên môn</label>
            <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {INITIATIVE_FIELDS.map(field => (
                <button key={field} type="button" onClick={() => handleFieldToggle(field)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.field.includes(field) ? `${activeTheme.primary} text-white border-transparent shadow-md` : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}>
                  {field}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between items-center ml-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><FileText size={12}/> Nội dung tóm tắt <span className="text-rose-500">*</span></label>
                {formData.content && <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Sparkles size={10}/> AI Support</span>}
             </div>
             <textarea required rows={12} placeholder="Mô tả ngắn gọn về giải pháp, tính mới và hiệu quả áp dụng..." className="w-full px-6 py-4 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-[2rem] font-medium dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 resize-none transition-all leading-relaxed whitespace-pre-wrap" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
             
             <div className="flex justify-end pt-2">
                <button 
                  type="button" 
                  onClick={handleCheckSimilarity}
                  disabled={isCheckingSim || !formData.title || !formData.content}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl text-[11px] font-black uppercase transition-all disabled:opacity-50"
                >
                   {isCheckingSim ? <Loader2 size={14} className="animate-spin"/> : <ScanSearch size={14}/>}
                   {isCheckingSim ? 'Đang thẩm định toàn diện...' : 'AI Thẩm định & Tra cứu (Toàn NPC)'}
                </button>
             </div>
             
             <AnalysisSection checkResult={checkResult} isChecking={isCheckingSim} />
          </div>

          <AttachmentsList 
            attachmentFiles={attachmentFiles} 
            onAttachmentSelect={handleAttachmentSelect} 
            onRemoveAttachment={(i) => setAttachmentFiles(prev => prev.filter((_, idx) => idx !== i))} 
          />

          <ImageGallery 
            imageFiles={imageFiles} 
            imagePreviews={imagePreviews} 
            onImageSelect={handleImageSelect}
            onRemoveImage={(i) => {
                setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
            }}
            isCompressing={isCompressing}
          />
          
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {isSubmitting && <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden"><div className={`h-full ${activeTheme.primary} transition-all duration-300`} style={{ width: `${uploadProgress}%` }}></div></div>}
            <button 
               type="submit" 
               disabled={isSubmitting || isAnalyzing || isCompressing || formData.monthsApplied < 3} 
               className={`w-full py-5 ${formData.monthsApplied < 3 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : `${activeTheme.primary} text-white shadow-xl hover:brightness-110`} rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {isSubmitting ? 'Đang tải lên hồ sơ...' : 'Gửi đơn đăng ký'}
            </button>
          </div>
        </form>
      </div>
      
      {showWarningModal && (
         <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border-4 border-white dark:border-slate-800 text-center space-y-6">
               <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto"><AlertTriangle size={40} strokeWidth={3}/></div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white">Thiếu hồ sơ minh chứng!</h3>
                  <p className="text-sm text-slate-500 font-medium">Bạn cần tải lên ít nhất một tài liệu đính kèm và một hình ảnh minh họa giải pháp để Hội đồng xem xét.</p>
               </div>
               <button onClick={() => setShowWarningModal(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs transition-all">Đã hiểu, quay lại</button>
            </div>
         </div>
      )}

      {/* Toast Notification positioned fixed at bottom right */}
      {toastMessage && (
          <div className={`fixed bottom-6 right-6 z-[3000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {toastMessage.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              <span className="font-bold text-sm tracking-wide">{toastMessage.text}</span>
          </div>
      )}
    </div>
  );
};

export default RegisterPage;