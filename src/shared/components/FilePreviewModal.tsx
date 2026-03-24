import React from 'react';
import type { ProjectFile } from '../../modules/projects/types.ts';
import { XIcon, DownloadIcon, ExclamationCircleIcon } from './Icons.tsx';

interface FilePreviewModalProps {
    file: ProjectFile;
    onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {

    const renderPreviewContent = () => {
        if (file.type.startsWith('image/')) {
            return (
                <img
                    src={file.url}
                    alt={`Xem trước ${file.name}`}
                    className="max-w-full max-h-full object-contain"
                />
            );
        }

        if (file.type === 'application/pdf') {
            // FIX: Use Google Docs Viewer to reliably embed PDFs and bypass CORS issues.
            const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`;
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-full border-none"
                    title={`Xem trước PDF: ${file.name}`}
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center text-center h-full bg-gray-50 rounded-lg p-8">
                <ExclamationCircleIcon className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Xem trước không được hỗ trợ</h3>
                <p className="text-gray-500 mt-2">
                    Không thể hiển thị tệp <span className="font-medium">"{file.name}"</span> trực tiếp trên trình duyệt.
                </p>
                <a
                    href={file.url}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center gap-2 bg-secondary text-white font-bold py-3 px-6 rounded-md hover:opacity-90 transition-opacity"
                >
                    <DownloadIcon className="h-5 w-5" />
                    Tải về
                </a>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-gray-100 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-3 border-b flex justify-between items-center bg-white rounded-t-lg shrink-0">
                    <h3 className="text-lg font-bold text-primary truncate pr-4" title={file.name}>{file.name}</h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white text-gray-700 font-bold py-2 px-3 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors text-sm"
                        >
                            <DownloadIcon className="h-5 w-5" />
                            Tải về
                        </a>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>
                <main className="p-2 flex-grow flex items-center justify-center overflow-auto">
                    {renderPreviewContent()}
                </main>
            </div>
        </div>
    );
};

export default FilePreviewModal;