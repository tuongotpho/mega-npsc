import React from 'react';
import type { DailyReport, Project, ProjectReview, User } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { XIcon } from '../../../shared/components/Icons.tsx';

interface ReportDetailsModalProps {
  report: DailyReport;
  project: Project;
  currentUser: User | null;
  review?: ProjectReview;
  reviewerName?: string;
  onClose: () => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (reportId: string, reportDate: string) => void;
  onReview: (report: DailyReport) => void;
  onImageClick: (images: string[], startIndex: number) => void;
  previousProgressPercentage?: number;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  project,
  currentUser,
  review,
  reviewerName,
  onClose,
  onEdit,
  onDelete,
  onReview,
  onImageClick,
  previousProgressPercentage,
}) => {
  const canEdit = permissions.canEditReport(currentUser, project);
  const canDelete = permissions.canDeleteReport(currentUser, project);
  const canReview = permissions.canReviewReport(currentUser, project);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
          <div>
            <h3 className="text-xl font-bold text-primary">Chi tiết Báo cáo</h3>
            <p className="text-sm text-gray-500">Ngày {report.date} - Bởi: {report.submittedBy}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-grow space-y-6">
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Tiến độ hoàn thành</h4>
            { (report.progressPercentage !== undefined && report.progressPercentage !== null) ? (() => {
                const currentProgress = report.progressPercentage || 0;
                const previousProgress = previousProgressPercentage || 0;
                const progressToday = Math.max(0, currentProgress - previousProgress);
                return (
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <div className="flex justify-between items-baseline text-sm mb-1">
                            <span className="font-medium text-gray-700">Tổng tiến độ</span>
                            <span className="font-bold text-2xl text-secondary">{currentProgress}%</span>
                        </div>
                        {/* FIX: Changed aria-valuemin and aria-valuemax from strings to numbers to match TypeScript definitions. */}
                        <div className="w-full flex h-3 rounded-full overflow-hidden bg-gray-200 my-2" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100}>
                            <div
                                className="bg-red-500 transition-all duration-300"
                                style={{ width: `${previousProgress}%` }}
                                title={`Hoàn thành đến hôm qua: ${previousProgress}%`}
                            ></div>
                            <div
                                className="bg-green-500 transition-all duration-300"
                                style={{ width: `${progressToday}%` }}
                                title={`Hoàn thành hôm nay: +${progressToday.toFixed(1)}%`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Hôm qua: {previousProgress}%</span>
                            <span className="font-semibold text-green-600">Hôm nay: +{progressToday.toFixed(1)}%</span>
                        </div>
                    </div>
                );
            })() : (
                <p className="text-sm text-gray-500 italic">Không có dữ liệu tiến độ cho báo cáo này.</p>
            )}
        </section>

          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Nhân lực & Thiết bị</h4>
            {(report.personnelCount !== undefined && report.personnelCount !== null) || report.equipmentOnSite ? (
                <div className="bg-gray-50 p-4 rounded-md border space-y-3 text-sm">
                    {(report.personnelCount !== undefined && report.personnelCount !== null) && (
                        <div>
                            <span className="font-semibold text-gray-600">Số lượng nhân lực:</span>
                            <span className="text-gray-800 ml-2">{report.personnelCount} người</span>
                        </div>
                    )}
                    {report.equipmentOnSite && (
                        <div>
                            <p className="font-semibold text-gray-600 mb-1">Thiết bị máy móc:</p>
                            <p className="text-gray-800 whitespace-pre-wrap pl-2 border-l-2 border-gray-200">{report.equipmentOnSite}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Không có thông tin về nhân lực và thiết bị.</p>
            )}
        </section>

          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Nội dung công việc</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{report.tasks}</p>
          </section>

          {report.images.length > 0 && (
            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Hình ảnh đính kèm</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {report.images.map((image, index) => (
                  <div key={index} className="relative group cursor-pointer" onClick={() => onImageClick(report.images, index)}>
                    <img
                      src={image}
                      alt={`Hình ảnh báo cáo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md shadow-sm transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
             <h4 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận & Nhận xét</h4>
             {review ? (
                 <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg">
                    <p className="font-bold text-sm">✔️ {reviewerName}:</p>
                    <p className="text-sm italic mt-1 whitespace-pre-wrap">"{review.comment}"</p>
                </div>
             ) : (
                <p className="text-sm text-gray-500 italic">Chưa có nhận xét nào.</p>
             )}
          </section>
        </main>

        {(canEdit || canDelete || (canReview && !review)) && (
            <footer className="p-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg border-t sticky bottom-0">
              {canReview && !review && (
                 <button 
                    onClick={() => onReview(report)}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Xác nhận & Nhận xét
                </button>
              )}
              {canEdit && (
                <button onClick={() => onEdit(report)} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
                    Chỉnh sửa
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(report.id, report.date)} className="bg-error text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
                    Xóa
                </button>
              )}
            </footer>
        )}
      </div>
    </div>
  );
};

export default ReportDetailsModal;