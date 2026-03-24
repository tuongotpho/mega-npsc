import React from 'react';
import type { DailyReport, ProjectReview } from '../types.ts';
import { CheckCircleIcon } from '../../../shared/components/Icons.tsx';

interface ReportCardProps {
  report: DailyReport;
  onViewDetails: () => void;
  review?: ProjectReview;
  reviewerName?: string;
  previousProgressPercentage?: number;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onViewDetails,
  review,
  reviewerName,
  previousProgressPercentage,
}) => {
  const hasImages = report.images.length > 0;
  const firstImage = hasImages ? report.images[0] : null;
  const additionalImagesCount = report.images.length - 1;

  const currentProgress = report.progressPercentage || 0;
  const previousProgress = previousProgressPercentage || 0;
  const progressToday = Math.max(0, currentProgress - previousProgress);

  return (
    <div 
      className="bg-base-100 rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:ring-2 hover:ring-secondary cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Image Section */}
      <div 
        className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden"
      >
        {firstImage ? (
          <>
            <img
              src={firstImage}
              alt={`Báo cáo ngày ${report.date}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {additionalImagesCount > 0 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md">
                +{additionalImagesCount} ảnh
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">Không có hình ảnh</p>
        )}
      </div>

      {/* Content Section */}
      <div className="p-2 flex flex-col flex-grow">
        <div className="mb-1">
            <h4 className="text-sm font-bold text-primary">{report.date}</h4>
            <span className="text-xs text-gray-500">Bởi: {report.submittedBy}</span>
        </div>
        
        <div className="flex-grow mt-1">
          <p className="text-sm text-gray-800 line-clamp-2" title={report.tasks}>
            {report.tasks}
          </p>
        </div>
      </div>

      {/* Progress and Review Section */}
      <div className="px-2 pb-2 mt-auto space-y-2">
        {/* Progress Section */}
        {(report.progressPercentage !== undefined && report.progressPercentage !== null) && (
            <div>
                <div className="text-xs text-gray-600 mb-1 flex justify-between">
                    <span>Tiến độ:</span>
                    <span className="font-bold text-secondary">{currentProgress}%</span>
                </div>
                {/* FIX: Changed aria-valuemin and aria-valuemax from strings to numbers to match TypeScript definitions. */}
                <div className="w-full flex h-2 rounded-full overflow-hidden bg-gray-200" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100}>
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
            </div>
        )}

        {/* Review Section */}
        {review && (
            <div className="text-green-700 flex items-center text-xs pt-1">
                 <CheckCircleIcon className="h-4 w-4 mr-1.5 shrink-0" />
                 <p className="italic truncate"><span className="font-semibold">{reviewerName}:</span> "{review.comment}"</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;