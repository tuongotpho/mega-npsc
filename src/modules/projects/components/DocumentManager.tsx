
import React, { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import type { Project, User, ProjectFile, ProjectFolder } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { FolderIcon, UploadIcon, FileIcon, TrashIcon, XIcon, DownloadIcon, EyeIcon } from '../../../shared/components/Icons.tsx';
import ConfirmationModal from '../../../shared/components/ConfirmationModal.tsx';
import LoadingSpinner from '../../../shared/components/LoadingSpinner.tsx';
import { formatBytes } from '../../../shared/utils/formatters.ts';

const FilePreviewModal = lazy(() => import('../../../shared/components/FilePreviewModal.tsx'));

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <img src="https://img.icons8.com/fluency/48/image-file.png" alt="Image" className="h-6 w-6" />;
    if (mimeType.includes('pdf')) return <img src="https://img.icons8.com/fluency/48/adobe-acrobat.png" alt="PDF" className="h-6 w-6" />;
    if (mimeType.includes('word')) return <img src="https://img.icons8.com/fluency/48/microsoft-word-2019.png" alt="Word" className="h-6 w-6" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <img src="https://img.icons8.com/fluency/48/microsoft-excel-2019.png" alt="Excel" className="h-6 w-6" />;
    return <FileIcon className="h-6 w-6 text-gray-500" />;
};

// --- Sub-components ---
const CreateFolderModal: React.FC<{
    onClose: () => void;
    onCreate: (folderName: string) => void;
}> = ({ onClose, onCreate }) => {
    const [folderName, setFolderName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (folderName.trim()) {
            onCreate(folderName.trim());
        }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b">
                        <h3 className="text-lg font-bold text-primary">Tạo thư mục mới</h3>
                    </header>
                    <main className="p-6">
                        <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">Tên thư mục</label>
                        <input
                            id="folderName"
                            type="text"
                            value={folderName}
                            onChange={e => setFolderName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                            autoFocus
                            required
                        />
                    </main>
                    <footer className="p-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700">Tạo</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const UploadProgress: React.FC<{
    uploads: Record<string, { progress: number; name: string }>;
}> = ({ uploads }) => {
    const activeUploads = Object.entries(uploads);
    if (activeUploads.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-lg p-4 z-50 border animate-fade-in">
            <h4 className="font-bold text-sm mb-2">Đang tải lên ({activeUploads.length})...</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
                {activeUploads.map(([id, upload]) => {
                    const { name, progress } = upload as { name: string; progress: number };
                    return (
                    <div key={id}>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="truncate pr-2">{name}</span>
                            <span className="font-semibold">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-secondary h-2 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};

const BulkActionBar: React.FC<{
    selectedCount: number;
    onClearSelection: () => void;
    onDelete: () => void;
}> = ({ selectedCount, onClearSelection, onDelete }) => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-max bg-primary text-white rounded-lg shadow-2xl flex items-center gap-4 px-4 py-2 z-20 animate-fade-in">
            <span className="font-semibold">{selectedCount} mục đã chọn</span>
            <div className="h-6 w-px bg-blue-300"></div>
            <button
                onClick={onDelete}
                className="flex items-center gap-2 font-semibold hover:bg-blue-600 p-2 rounded-md transition-colors"
            >
                <TrashIcon className="h-5 w-5" />
                Xóa
            </button>
            <button
                onClick={onClearSelection}
                className="flex items-center gap-2 font-semibold hover:bg-blue-600 p-2 rounded-md transition-colors"
            >
                <XIcon className="h-5 w-5" />
                Bỏ chọn
            </button>
        </div>
    );
};


// --- Main Component ---
interface DocumentManagerProps {
    project: Project;
    currentUser: User | null;
    files: ProjectFile[];
    folders: ProjectFolder[];
    onUploadFiles: (files: File[], projectId: string, path: string) => void;
    onCreateFolder: (folderName: string, projectId: string, path: string) => void;
    onDeleteFile: (file: ProjectFile, projectId: string) => void;
    onDeleteFolder: (folder: ProjectFolder, projectId: string) => void;
    onBulkDelete: (items: { files: ProjectFile[], folders: ProjectFolder[] }, projectId: string) => void;
    uploadProgress: Record<string, { progress: number; name: string }>;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
    project,
    currentUser,
    files,
    folders,
    onUploadFiles,
    onCreateFolder,
    onDeleteFile,
    onDeleteFolder,
    onBulkDelete,
    uploadProgress
}) => {
    const [currentPath, setCurrentPath] = useState('/');
    const [isCreateFolderModalOpen, setCreateFolderModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'file' | 'folder', data: ProjectFile | ProjectFolder } | null>(null);
    const [isBulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canCreate = permissions.canCreateFolder(currentUser, project);
    const canUpload = permissions.canUploadFile(currentUser, project);
    const canDelete = permissions.canDeleteDocument(currentUser, project);

    const filteredItems = useMemo(() => {
        const currentFolders = folders.filter(f => f.path === currentPath).sort((a,b) => a.name.localeCompare(b.name));
        const currentFiles = files.filter(f => f.path === currentPath).sort((a,b) => a.name.localeCompare(b.name));
        return { folders: currentFolders, files: currentFiles };
    }, [files, folders, currentPath]);
    
    // Clear selection when path changes
    useEffect(() => {
        setSelectedItems(new Set());
    }, [currentPath]);


    const breadcrumbs = useMemo(() => {
        const parts = currentPath.split('/').filter(Boolean);
        const crumbs = [{ name: 'Thư mục gốc', path: '/' }];
        let path = '';
        for (const part of parts) {
            path += `/${part}`;
            crumbs.push({ name: part, path });
        }
        return crumbs;
    }, [currentPath]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onUploadFiles(Array.from(e.target.files), project.id, currentPath);
            e.target.value = ''; // Reset input to allow re-uploading the same file
        }
    };
    
    // --- Selection Logic ---
    const handleToggleItem = (id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedItems.size === (filteredItems.files.length + filteredItems.folders.length)) {
            setSelectedItems(new Set());
        } else {
            const allIds = [...filteredItems.folders.map(f => f.id), ...filteredItems.files.map(f => f.id)];
            setSelectedItems(new Set(allIds));
        }
    };
    
    const allVisibleItemsCount = filteredItems.files.length + filteredItems.folders.length;
    const isAllSelected = selectedItems.size === allVisibleItemsCount && allVisibleItemsCount > 0;
    const isIndeterminate = selectedItems.size > 0 && !isAllSelected;

    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);


    // --- Deletion Logic ---
    const confirmSingleDelete = () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'file') {
            onDeleteFile(itemToDelete.data as ProjectFile, project.id);
        } else {
            onDeleteFolder(itemToDelete.data as ProjectFolder, project.id);
        }
        setItemToDelete(null);
    };

    const handleConfirmBulkDelete = () => {
        const itemsToDelete = {
            files: files.filter(f => selectedItems.has(f.id)),
            folders: folders.filter(f => selectedItems.has(f.id)),
        };
        if (itemsToDelete.files.length > 0 || itemsToDelete.folders.length > 0) {
            onBulkDelete(itemsToDelete, project.id);
        }
        setBulkDeleteConfirmOpen(false);
        setSelectedItems(new Set());
    };


    return (
        <div className="bg-base-100 rounded-lg shadow-md border border-gray-200 animate-fade-in">
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
            <header className="p-4 border-b flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-primary">Quản lý Tài liệu</h3>
                    <nav className="text-sm text-gray-500">
                        {breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={crumb.path}>
                                <button
                                    onClick={() => setCurrentPath(crumb.path)}
                                    className={`hover:underline ${i === breadcrumbs.length - 1 ? 'font-semibold text-gray-700' : ''}`}
                                >
                                    {crumb.name}
                                </button>
                                {i < breadcrumbs.length - 1 && <span className="mx-1">/</span>}
                            </React.Fragment>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setCreateFolderModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-gray-700 font-bold py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canCreate}
                    >
                        <FolderIcon className="h-5 w-5" />
                        Tạo Thư mục
                    </button>
                    <button
                         onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canUpload}
                    >
                        <UploadIcon className="h-5 w-5" />
                        Tải lên Tệp
                    </button>
                </div>
            </header>

            <main className="p-1 min-h-[40vh]">
                {allVisibleItemsCount === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                        <FolderIcon className="h-12 w-12 mx-auto text-gray-300" />
                        <h4 className="mt-4 text-lg font-semibold">Thư mục này trống</h4>
                        <p className="mt-1 text-sm">Hãy bắt đầu bằng cách tải lên tệp hoặc tạo một thư mục con.</p>
                    </div>
                ) : (
                    <table className="min-w-full">
                        <thead className="border-b">
                            <tr>
                                {canDelete && (
                                <th className="p-3 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        ref={headerCheckboxRef}
                                        checked={isAllSelected}
                                        onChange={handleToggleAll}
                                        className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                                    />
                                </th>
                                )}
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-3/5">Tên</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Kích thước</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ngày tải lên</th>
                                <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredItems.folders.map(folder => (
                                <tr key={folder.id} className={`group transition-colors ${selectedItems.has(folder.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                    {canDelete && (
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(folder.id)}
                                                onChange={() => handleToggleItem(folder.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                                            />
                                        </td>
                                    )}
                                    <td className="p-3 whitespace-nowrap">
                                        <button onClick={() => setCurrentPath(`${folder.path}${folder.name}`)} className="flex items-center gap-3 text-sm font-medium text-gray-800 hover:text-secondary">
                                            <FolderIcon className="h-6 w-6 text-yellow-500 shrink-0" />
                                            <span className="truncate">{folder.name}</span>
                                        </button>
                                    </td>
                                    <td className="p-3 text-sm text-gray-500 hidden sm:table-cell">--</td>
                                    <td className="p-3 text-sm text-gray-500 hidden md:table-cell">{new Date(folder.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3 text-right">
                                        {canDelete && (
                                            <button onClick={() => setItemToDelete({ type: 'folder', data: folder })} className="text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 p-1 rounded-full" title="Xóa thư mục"><TrashIcon className="h-5 w-5"/></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.files.map(file => (
                                <tr key={file.id} className={`group transition-colors ${selectedItems.has(file.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                     {canDelete && (
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(file.id)}
                                                onChange={() => handleToggleItem(file.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                                            />
                                        </td>
                                     )}
                                    <td className="p-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3 text-sm font-medium text-gray-800">
                                            {getFileIcon(file.type)}
                                            <span className="truncate" title={file.name}>{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-500 hidden sm:table-cell">{formatBytes(file.size)}</td>
                                    <td className="p-3 text-sm text-gray-500 hidden md:table-cell">{new Date(file.uploadedAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setPreviewFile(file)} className="text-gray-400 hover:text-secondary p-1 rounded-full" title="Xem trước"><EyeIcon className="h-5 w-5"/></button>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name} className="text-gray-400 hover:text-secondary p-1 rounded-full" title="Tải về"><DownloadIcon className="h-5 w-5"/></a>
                                            {canDelete && (
                                                <button onClick={() => setItemToDelete({ type: 'file', data: file })} className="text-gray-400 hover:text-error p-1 rounded-full" title="Xóa tệp"><TrashIcon className="h-5 w-5"/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
            {isCreateFolderModalOpen && (
                <CreateFolderModal
                    onClose={() => setCreateFolderModalOpen(false)}
                    onCreate={(name) => {
                        onCreateFolder(name, project.id, currentPath);
                        setCreateFolderModalOpen(false);
                    }}
                />
            )}
            {itemToDelete && (
                <ConfirmationModal
                    message={`Bạn có chắc chắn muốn xóa "${itemToDelete.data.name}"? Hành động này không thể hoàn tác.`}
                    onConfirm={confirmSingleDelete}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
            {isBulkDeleteConfirmOpen && (
                 <ConfirmationModal
                    message={`Bạn có chắc chắn muốn xóa ${selectedItems.size} mục đã chọn? Các thư mục không rỗng sẽ được bỏ qua.`}
                    onConfirm={handleConfirmBulkDelete}
                    onCancel={() => setBulkDeleteConfirmOpen(false)}
                />
            )}
            {previewFile && (
                 <Suspense fallback={<LoadingSpinner />}>
                    <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
                </Suspense>
            )}
            {selectedItems.size > 0 && (
                <BulkActionBar 
                    selectedCount={selectedItems.size}
                    onClearSelection={() => setSelectedItems(new Set())}
                    onDelete={() => setBulkDeleteConfirmOpen(true)}
                />
            )}
            <UploadProgress uploads={uploadProgress} />
        </div>
    );
};

export default DocumentManager;
