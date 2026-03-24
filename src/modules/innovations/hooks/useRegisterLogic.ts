
import { useState } from 'react';
import { dbSangkien as db } from '../services/firebase';
import { checkPublicSimilarity, validateInitiativeCompliance } from '../services/aiService';
import { useFileHandler } from './useFileHandler';
import { PublicCheckResult, ComplianceCheck, InitiativeScope } from '../types';

// Config
const TELEGRAM_BOT_TOKEN = "7775700636:AAGUPRIS3TIhuJLxy8tqbEmTRhqSWM4QXOc";
const TELEGRAM_CHAT_ID = "-5058192283";
const INITIATIVE_FIELDS = [
    'Thiết bị điện', 'Thí nghiệm điện', 'Tư vấn', 'CNTT', 'SC MBA', 
    'Giải pháp', 'Hành chính', 'An toàn', 'Kinh doanh'
];

export const useRegisterLogic = () => {
    const { uploadToStorage, setUploadProgress } = useFileHandler();
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        authors: '',
        unit: '',
        contactZalo: '', 
        field: [] as string[],
        content: '',
        year: new Date().getFullYear(),
        monthsApplied: 0
    });

    // Processing States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingSim, setIsCheckingSim] = useState(false);
    const [checkResult, setCheckResult] = useState<PublicCheckResult | null>(null);
    const [complianceResult, setComplianceResult] = useState<ComplianceCheck | null>(null);
    const [success, setSuccess] = useState(false);
    const [formError, setFormError] = useState('');

    const handleFieldToggle = (field: string) => {
        setFormData(prev => {
            if (prev.field.includes(field)) return { ...prev, field: prev.field.filter(f => f !== field) };
            return { ...prev, field: [...prev.field, field] };
        });
    };

    const handleCheckSimilarity = async () => {
        if (!formData.title || !formData.content) {
            setFormError("Vui lòng nhập Tiêu đề và Nội dung trước khi kiểm tra.");
            return;
        }
        setIsCheckingSim(true);
        setCheckResult(null);
        setComplianceResult(null);
        setFormError('');

        try {
            let existingItems: any[] = [];
            try {
                const snapshot = await db.collection('initiatives').get();
                existingItems = snapshot.docs.map(doc => ({ 
                    id: doc.id,
                    title: doc.data().title,
                    content: doc.data().content,
                    scope: doc.data().scope
                } as any));
            } catch (readErr) {
                console.warn("Could not fetch existing initiatives for similarity check:", readErr);
                // Continue with empty list if read fails (prevents blocking guest submissions)
            }

            const [simResult, compResult] = await Promise.all([
                checkPublicSimilarity({ title: formData.title, content: formData.content }, existingItems),
                validateInitiativeCompliance({ 
                   title: formData.title, 
                   content: formData.content, 
                   monthsApplied: formData.monthsApplied 
                })
            ]);

            setCheckResult(simResult);
            setComplianceResult(compResult);
        } catch (err: any) {
            console.error(err);
            setFormError("Lỗi khi kiểm tra AI: " + err.message);
        } finally {
            setIsCheckingSim(false);
        }
    };

    const sendTelegramNotification = async (data: any) => {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || TELEGRAM_BOT_TOKEN.includes("YOUR_")) return;
        const message = `
🚀 <b>CÓ SÁNG KIẾN MỚI!</b>

📌 <b>Tiêu đề:</b> ${data.title.toUpperCase()}
👤 <b>Tác giả:</b> ${Array.isArray(data.authors) ? data.authors.join(", ") : data.authors}
🏢 <b>Đơn vị:</b> ${Array.isArray(data.unit) ? data.unit.join(", ") : data.unit}
📅 <b>Năm:</b> ${data.year}

📝 <b>Nội dung tóm tắt:</b>
${data.content.substring(0, 200)}...

🔗 <a href="${data.driveLink || '#'}">Xem tài liệu đính kèm</a>`;

        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML', disable_web_page_preview: true })
            });
        } catch (err) { console.error("Lỗi gửi Telegram:", err); }
    };

    const submitForm = async (
        registrationFile: File | null, 
        attachmentFiles: File[], 
        imageFiles: File[]
    ) => {
        // Validation
        if (!formData.title || !formData.content || !formData.authors || !formData.unit || !formData.contactZalo) {
            setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc (bao gồm Số Zalo liên hệ).');
            return false;
        }
        if (formData.monthsApplied < 3) {
            setFormError('Hồ sơ KHÔNG HỢP LỆ: Giải pháp phải được áp dụng thực tế trên 3 tháng.');
            return false;
        }
        if (attachmentFiles.length === 0) {
            setFormError('Thiếu tài liệu đính kèm.');
            return false;
        }
        if (imageFiles.length === 0) {
            setFormError('Thiếu hình ảnh minh họa.');
            return false;
        }

        setIsSubmitting(true);
        setFormError('');
        setUploadProgress(10);
        console.log("🚀 [DEBUG] Bắt đầu quá trình nộp đơn");

        try {
            const timestamp = Date.now();
            
            // 1. Upload File Đơn đăng ký (nếu có)
            let registrationUrl = '';
            if (registrationFile) {
                console.log("👉 [DEBUG] Đang upload File Đơn Đăng Ký:", registrationFile.name);
                const safeName = registrationFile.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                registrationUrl = await uploadToStorage(registrationFile, `pending_initiatives/forms/${timestamp}_${safeName}`);
                console.log("✅ [DEBUG] Đã upload xong File Đơn:", registrationUrl);
            }
            setUploadProgress(30);

            // 2. Upload Tài liệu đính kèm
            console.log(`👉 [DEBUG] Đang upload ${attachmentFiles.length} Tài Liệu Đính Kèm...`);
            let attachmentUrls: string[] = [];
            if (attachmentFiles.length > 0) {
                attachmentUrls = await Promise.all(attachmentFiles.map(async file => {
                    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                    const url = await uploadToStorage(file, `pending_initiatives/attachments/${timestamp}_${safeName}`);
                    console.log("   ✅ [DEBUG] Upload thành công file:", file.name);
                    return url;
                }));
            }
            console.log("✅ [DEBUG] Đã upload xong Tài liệu đính kèm!");
            setUploadProgress(60);

            // 3. Upload Hình ảnh minh họa
            console.log(`👉 [DEBUG] Đang upload ${imageFiles.length} Hình ảnh minh họa...`);
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                imageUrls = await Promise.all(imageFiles.map(async file => {
                    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                    const url = await uploadToStorage(file, `pending_initiatives/images/${timestamp}_${safeName}`);
                    console.log("   ✅ [DEBUG] Upload thành công ảnh:", file.name);
                    return url;
                }));
            }
            console.log("✅ [DEBUG] Đã upload xong Hình ảnh ảnh!");
            setUploadProgress(90);

            // 4. Tạo Payload và lưu vào Firestore
            console.log("👉 [DEBUG] Đang lưu dữ liệu vào Firestore (pending_initiatives)...");
            const payload = {
                title: formData.title,
                authors: formData.authors.split(',').map(s => s.trim()).filter(Boolean),
                unit: formData.unit.split(',').map(s => s.trim()).filter(Boolean),
                contactZalo: formData.contactZalo,
                year: formData.year,
                monthsApplied: formData.monthsApplied,
                content: formData.content,
                field: formData.field,
                
                driveLink: attachmentUrls[0] || '',
                attachmentUrls: attachmentUrls,
                registrationFormUrl: registrationUrl,
                imageUrl: imageUrls[0] || '',
                imageUrls: imageUrls,
                
                status: 'pending',
                submittedAt: timestamp,
                
                publicAnalysis: checkResult ? {
                    score: checkResult.score || 0,
                    verdict: checkResult.verdict || '',
                    advice: checkResult.advice || '',
                    similarTitle: checkResult.similarTitle || null,
                    similarId: checkResult.similarId || null,
                    similarScope: checkResult.similarScope || null
                } : null,
                complianceCheck: complianceResult ? JSON.parse(JSON.stringify(complianceResult)) : null
            };

            await db.collection('pending_initiatives').add(payload);
            console.log("✅ [DEBUG] Đã lưu Firestore thành công!");
            
            console.log("👉 [DEBUG] Đang gửi Telegram Notification...");
            await sendTelegramNotification(payload);
            console.log("✅ [DEBUG] Đã gửi Telegram!");

            setUploadProgress(100);
            setSuccess(true);
            return true;

        } catch (err: any) {
            console.error("❌ [DEBUG] Lỗi submit BỊ BẮT QUẢ TANG MỘT CÁCH CHÍNH XÁC:", err);
            setFormError('Lỗi khi gửi đơn đăng ký: ' + err.message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData, setFormData,
        isSubmitting,
        isCheckingSim,
        checkResult,
        complianceResult,
        success, setSuccess,
        formError, setFormError,
        handleFieldToggle,
        handleCheckSimilarity,
        submitForm,
        INITIATIVE_FIELDS
    };
};
