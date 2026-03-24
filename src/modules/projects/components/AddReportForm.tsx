import React, { useState } from 'react';
import type { DailyReport, User } from '../types.ts';
import { XIcon } from '../../../shared/components/Icons.tsx';
import AlertModal from '../../../shared/components/AlertModal.tsx';
import heic2any from 'heic2any';
import { storage } from '../services/firebase.ts';
// FIX: Removed v9 modular import for firebase/storage.
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AddReportFormProps {
  projectId: string;
  currentUser: User;
  onAddReport: (reportData: Omit<DailyReport, 'id'>) => Promise<void>;
  onCancel: () => void;
}

const AddReportForm: React.FC<AddReportFormProps> = ({ projectId, currentUser, onAddReport, onCancel }) => {
  const getTodayString = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [newReportDate, setNewReportDate] = useState(getTodayString());
  const [newReportTasks, setNewReportTasks] = useState('');
  const [newReportImages, setNewReportImages] = useState<string[]>([]);
  const [progressPercentage, setProgressPercentage] = useState<number | ''>('');
  const [personnelCount, setPersonnelCount] = useState<number | ''>('');
  const [equipmentOnSite, setEquipmentOnSite] = useState('');
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper to convert DD/MM/YYYY to YYYY-MM-DD for date input value
  const toYMD = (dmy: string): string => {
    if (!dmy || typeof dmy !== 'string') return '';
    const parts = dmy.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Helper to convert YYYY-MM-DD from date input to DD/MM/YYYY for state
  const toDMY = (ymd: string): string => {
    if (!ymd || typeof ymd !== 'string') return '';
    const parts = ymd.split('-');
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  const optimizeAndConvertToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));
                
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    0.75 // Quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const uploadImageToStorage = async (imageFile: File): Promise<string> => {
    const optimizedBlob = await optimizeAndConvertToBlob(imageFile);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${imageFile.name}`;
    // FIX: Switched to v8 syntax for storage reference.
    const storageRef = storage.ref(`reports/${projectId}/${uniqueFileName}`);
    // FIX: Switched to v8 syntax for uploading file.
    const snapshot = await storageRef.put(optimizedBlob);
    // FIX: Switched to v8 syntax for getting download URL.
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsProcessingImages(true);
    const originalFiles = Array.from(e.target.files);
    const allFailedFiles: string[] = [];

    // Step 1: Convert HEIC files to JPEG
    // FIX: Add explicit type 'File' to the 'file' parameter to resolve TypeScript errors.
    const conversionPromises = originalFiles.map(async (file: File) => {
        const isHeic = file.type.includes('heic') || file.type.includes('heif') || /\.heic$/i.test(file.name);
        if (isHeic) {
            try {
                const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
                const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
                return new File([finalBlob], newName, { type: 'image/jpeg' });
            } catch (err) {
                console.error(`Could not convert HEIC file: ${file.name}`, err);
                allFailedFiles.push(file.name);
                return null; // Mark as failed
            }
        }
        return file; // Pass through non-HEIC files
    });
    
    const filesToProcess = (await Promise.all(conversionPromises)).filter((f): f is File => f !== null);

    // Step 2: Upload all valid files to storage
    const uploadResults = await Promise.allSettled(filesToProcess.map(uploadImageToStorage));
    
    const successfulImageUrls: string[] = [];

    uploadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successfulImageUrls.push(result.value);
        } else {
            console.error(`Error uploading file ${filesToProcess[index].name}:`, result.reason);
            if (!allFailedFiles.includes(filesToProcess[index].name)) {
                allFailedFiles.push(filesToProcess[index].name);
            }
        }
    });

    // Step 3: Update state and notify user
    if (successfulImageUrls.length > 0) {
        setNewReportImages(prev => [...prev, ...successfulImageUrls]);
    }

    if (allFailedFiles.length > 0) {
        const failedFilesList = allFailedFiles.join(', ');
        setValidationError(`Không thể xử lý các tệp sau: ${failedFilesList}. Các tệp không hợp lệ đã được bỏ qua.`);
    }
    
    setIsProcessingImages(false);
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewReportImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAddReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTasks.trim() || !newReportDate.trim()) {
        setValidationError('Vui lòng điền đầy đủ ngày báo cáo và nội dung công việc.');
        return;
    }
    if (progressPercentage === '' || isNaN(Number(progressPercentage)) || Number(progressPercentage) < 0 || Number(progressPercentage) > 100) {
        setValidationError('Vui lòng nhập tiến độ hoàn thành hợp lệ (từ 0 đến 100).');
        return;
    }
    if (personnelCount === '' || isNaN(Number(personnelCount)) || Number(personnelCount) < 0) {
        setValidationError('Vui lòng nhập số lượng nhân lực hợp lệ (số không âm).');
        return;
    }
    if (!equipmentOnSite.trim()) {
        setValidationError('Vui lòng liệt kê thiết bị máy móc tại hiện trường.');
        return;
    }
    if (newReportImages.length === 0) {
        setValidationError('Vui lòng tải lên ít nhất một hình ảnh cho báo cáo. Đây là yêu cầu bắt buộc.');
        return;
    }
    setIsSubmitting(true);
    const reportData = {
        projectId,
        date: newReportDate,
        tasks: newReportTasks,
        images: newReportImages,
        submittedBy: currentUser.name,
        progressPercentage: Number(progressPercentage),
        personnelCount: Number(personnelCount),
        equipmentOnSite,
    };
    await onAddReport(reportData);
    setIsSubmitting(false);
    onCancel(); // Close form on success
  };

  return (
    <>
      <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
        <h3 className="text-xl font-bold text-primary mb-6">Gửi báo cáo mới</h3>
        <form onSubmit={handleAddReportSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                 <div>
                    <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày báo cáo
                    </label>
                    <input
                        id="reportDate"
                        type="date"
                        value={toYMD(newReportDate)}
                        onChange={(e) => setNewReportDate(toDMY(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        style={{ colorScheme: 'light' }}
                        required
                    />
                 </div>
                 <div>
                    <label htmlFor="progressPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                        Tiến độ hoàn thành (%) <span className="text-error font-bold">*</span>
                    </label>
                    <input
                        id="progressPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={progressPercentage}
                        onChange={(e) => setProgressPercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        placeholder="VD: 25.5"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="personnelCount" className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng nhân lực (người) <span className="text-error font-bold">*</span>
                    </label>
                    <input
                        id="personnelCount"
                        type="number"
                        min="0"
                        value={personnelCount}
                        onChange={(e) => setPersonnelCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        placeholder="VD: 10"
                        required
                    />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                  <div>
                    <label htmlFor="reportTasks" className="block text-sm font-medium text-gray-700 mb-1">
                        Nội dung công việc <span className="text-error font-bold">*</span>
                    </label>
                    <textarea
                        id="reportTasks"
                        rows={5}
                        value={newReportTasks}
                        onChange={(e) => setNewReportTasks(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        placeholder="Mô tả chi tiết các công việc đã làm trong ngày..."
                        required
                    />
                  </div>
                  <div>
                    <label htmlFor="equipmentOnSite" className="block text-sm font-medium text-gray-700 mb-1">
                        Thiết bị máy móc tại hiện trường <span className="text-error font-bold">*</span>
                    </label>
                    <textarea
                        id="equipmentOnSite"
                        rows={3}
                        value={equipmentOnSite}
                        onChange={(e) => setEquipmentOnSite(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        placeholder="Liệt kê các máy móc, thiết bị được sử dụng trong ngày..."
                        required
                    />
                </div>
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh đính kèm <span className="text-error font-bold">*</span>
            </label>
            
            {newReportImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                    {newReportImages.map((image, index) => (
                        <div key={index} className="relative group">
                            <img src={image} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md shadow-sm" />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-0 right-0 -mt-2 -mr-2 bg-error text-white rounded-full p-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                aria-label="Remove image"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-center space-x-4">
                <label htmlFor="imageUploadAdd" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>Thêm ảnh...</span>
                    <input id="imageUploadAdd" name="imageUploadAdd" type="file" className="sr-only" multiple accept="image/*,.heic,.heif" onChange={handleImageChange} />
                </label>
                {isProcessingImages && <div className="text-sm text-gray-500">Đang xử lý...</div>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isProcessingImages || isSubmitting}
              className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi Báo cáo'}
            </button>
          </div>
        </form>
      </div>
      {validationError && (
        <AlertModal
          title="Thông báo lỗi"
          message={validationError}
          onClose={() => setValidationError(null)}
        />
      )}
    </>
  );
};

export default AddReportForm;
