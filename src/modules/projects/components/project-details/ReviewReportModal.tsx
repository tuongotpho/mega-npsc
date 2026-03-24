
import React, { useState } from 'react';
import type { DailyReport, User } from '../../types.ts';

interface ReviewReportModalProps {
    report: DailyReport;
    currentUser: User;
    onClose: () => void;
    onAddReview: (projectId: string, reportId: string, comment: string, user: User) => Promise<void>;
}

const ReviewReportModal: React.FC<ReviewReportModalProps> = ({ report, currentUser, onClose, onAddReview }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        await onAddReview(report.projectId, report.id, comment, currentUser);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b">
                    <h3 className="text-xl font-bold text-primary">Xác nhận & Nhận xét Báo cáo</h3>
                    <p className="text-sm text-gray-500">Ngày {report.date}</p>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6">
                        <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung nhận xét
                        </label>
                        <textarea
                            id="reviewComment"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={4}
                            placeholder="Nhập nhận xét hoặc chỉ đạo của bạn..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                            required
                        />
                    </main>
                    <footer className="p-4 border-t flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ReviewReportModal;
