
import { useState, useRef } from 'react';
import { storageSangkien as storage } from '../services/firebase';
import { autoFillRegisterForm } from '../services/aiService';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export const useFileHandler = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Upload Helper
    const uploadToStorage = async (file: File, path: string): Promise<string> => {
        const storageRef = storage.ref(path);
        const uploadTask = storageRef.put(file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // Logic tính toán progress tổng có thể phức tạp hơn nếu upload nhiều file
                },
                (error) => reject(error),
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve(downloadURL);
                }
            );
        });
    };

    // Auto-fill Logic
    const processAutoFillFile = async (file: File): Promise<any> => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const fileType = file.name.split('.').pop()?.toLowerCase();
            let aiData = null;

            if (fileType === 'pdf') {
                const reader = new FileReader();
                const promise = new Promise<any>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const base64String = (reader.result as string).split(',')[1];
                            const data = await autoFillRegisterForm(base64String, false);
                            resolve(data);
                        } catch (e) { reject(e); }
                    };
                    reader.onerror = reject;
                });
                reader.readAsDataURL(file);
                aiData = await promise;
            } 
            else if (fileType === 'docx') {
                const reader = new FileReader();
                const promise = new Promise<any>((resolve, reject) => {
                    reader.onload = async (event) => {
                        try {
                            const arrayBuffer = event.target?.result as ArrayBuffer;
                            const mammoth = (window as any).mammoth;
                            if (!mammoth) throw new Error("Thư viện đọc file Word chưa tải xong.");
                            
                            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                            const text = result.value;
                            const data = await autoFillRegisterForm(text, true);
                            resolve(data);
                        } catch (e) { reject(e); }
                    };
                    reader.onerror = reject;
                });
                reader.readAsArrayBuffer(file);
                aiData = await promise;
            } else {
                throw new Error("Vui lòng chọn file .pdf hoặc .docx");
            }
            return aiData;
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Lỗi xử lý file");
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Image Processing Logic
    const processImages = async (files: File[]): Promise<{ files: File[], previews: string[] }> => {
        setIsCompressing(true);
        const processedFiles: File[] = [];
        const newPreviews: string[] = [];
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };

        try {
            for (const file of files) {
                let inputFile: File = file;
                // HEIC Conversion
                if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                    try {
                        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
                        const finalBlob = Array.isArray(blob) ? blob[0] : blob;
                        inputFile = new File([finalBlob as Blob], file.name.replace(/\.heic$/i, ".jpg"), { type: 'image/jpeg' });
                    } catch (err) { continue; }
                }
                // Compression
                try {
                    const compressed = await imageCompression(inputFile, options);
                    processedFiles.push(compressed as File);
                    newPreviews.push(URL.createObjectURL(compressed));
                } catch (compErr) {
                    processedFiles.push(inputFile);
                    newPreviews.push(URL.createObjectURL(inputFile));
                }
            }
            return { files: processedFiles, previews: newPreviews };
        } catch (err) {
            setError("Lỗi khi xử lý ảnh.");
            return { files: [], previews: [] };
        } finally {
            setIsCompressing(false);
        }
    };

    return {
        isAnalyzing,
        isCompressing,
        uploadProgress,
        setUploadProgress,
        fileError: error,
        uploadToStorage,
        processAutoFillFile,
        processImages
    };
};
