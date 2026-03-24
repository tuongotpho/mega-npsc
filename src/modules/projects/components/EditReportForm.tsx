import React, { useState } from 'react';
import type { DailyReport } from '../types.ts';
import { XIcon } from '../../../shared/components/Icons.tsx';
import heic2any from 'heic2any';
import { storage } from '../services/firebase.ts';
// FIX: Removed v9 modular import for firebase/storage.
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EditReportFormProps {
  report: DailyReport;
  onUpdateReport: (report: DailyReport) => void;
  onCancel: () => void;
}

const EditReportForm: React.FC<EditReportFormProps> = ({ report, onUpdateReport, onCancel }) => {
  const [tasks, setTasks] = useState(report.tasks);
  const [images, setImages] = useState(report.images);
  const [progressPercentage, setProgressPercentage] = useState<number | ''>(report.progressPercentage ?? '');
  const [personnelCount, setPersonnelCount] = useState<number | ''>(report.personnelCount ?? '');
  const [equipmentOnSite, setEquipmentOnSite] = useState(report.equipmentOnSite || '');
  const [isProcessingImages, setIsProcessingImages] = useState(false);

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
    const storageRef = storage.ref(`reports/${report.projectId}/${uniqueFileName}`);
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
          setImages(prev => [...prev, ...successfulImageUrls]);
      }

      if (allFailedFiles.length > 0) {
          const failedFilesList = allFailedFiles.join(', ');
          alert(`Không thể xử lý các tệp sau: ${failedFilesList}. Các tệp không hợp lệ đã được bỏ qua.`);
      }

      setIsProcessingImages(false);
      e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
      // Note: This only removes the URL from the report.
      // For a complete solution, you might want to delete the file from Firebase Storage as well,
      // but that requires more complex logic (e.g., using the URL to get the file reference).
      setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasks.trim()) {
      alert('Nội dung công việc không được để trống.');
      return;
    }
    if (progressPercentage === '' || isNaN(Number(progressPercentage)) || Number(progressPercentage) < 0 || Number(progressPercentage) > 100) {
      alert('Vui lòng nhập tiến độ hoàn thành hợp lệ (từ 0 đến 100).');
      return;
    }
    if (personnelCount === '' || isNaN(Number(personnelCount)) || Number(personnelCount) < 0) {
        alert('Vui lòng nhập số lượng nhân lực hợp lệ (số không âm).');
        return;
    }
    if (!equipmentOnSite.trim()) {
      alert('Vui lòng liệt kê thiết bị máy móc tại hiện trường.');
      return;
    }
    onUpdateReport({ 
        ...report, 
        tasks, 
        images, 
        progressPercentage: Number(progressPercentage),
        personnelCount: Number(personnelCount),
        equipmentOnSite,
    });
  };

  return (
    <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
        <h2 className="text-2xl font-bold text-primary mb-2">Chỉnh sửa Báo cáo</h2>
        <p className="text-gray-600 mb-6">Ngày: {report.date}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div>
                        <label htmlFor="progressPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                            Tiến độ hoàn thành (%)
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
                            Số lượng nhân lực (người)
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
                 <div className="md:col-span-2">
                    <label htmlFor="reportTasks" className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung công việc đã thực hiện
                    </label>
                    <textarea
                    id="reportTasks"
                    rows={3}
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                    placeholder="Mô tả chi tiết các công việc đã làm trong ngày..."
                    required
                    />
                </div>
                 <div className="md:col-span-3">
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quản lý hình ảnh
                </label>
                
                {images.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                        {images.map((image, index) => (
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
                ) : <p className="text-sm text-gray-500 mb-4 italic">Hiện không có hình ảnh nào.</p>}
                
                <div className="flex items-center space-x-4">
                    <label htmlFor="imageUpload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <span>Thêm ảnh...</span>
                        <input id="imageUpload" name="imageUpload" type="file" className="sr-only" multiple accept="image/*,.heic,.heif" onChange={handleImageChange} />
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
                    disabled={isProcessingImages}
                    className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Lưu Thay Đổi
                </button>
            </div>
        </form>
    </div>
  );
};

export default EditReportForm;
