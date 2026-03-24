
export { Role, type User } from '../../shared/types/common.ts';

export interface Approval {
  decisionNumber: string;
  date: string; // Format: DD/MM/YYYY
}

export interface ContactUnit {
  companyName: string;
  personnelName: string;
  phone: string;
}

export interface ProjectManagementContact {
  departmentName: string;
  personnelName: string;
  phone: string;
}

export interface SupervisorAContact {
  enterpriseName: string;
  personnelName: string;
  phone: string;
}

export interface ProjectReview {
  comment: string;
  reviewedById: string; // User ID of the reviewer
  reviewedByName: string; // Denormalized user name to avoid permission issues
  reviewedAt: string; // ISO 8601 timestamp
}

export interface ApprovalStage {
  submissionDate: string; // Ngày nộp
  approvalDate: string;   // Ngày duyệt
}

export interface BiddingPackage {
  itbIssuanceDate: string;  // Ngày phát hành HSMT
  contractSignDate: string; // Ngày ký hợp đồng
}

export interface Project {
  id: string;
  name: string;
  financialYear: number; // NEW: Năm tài chính
  isLocked: boolean;     // NEW: Trạng thái khóa/quyết toán
  projectManagerIds: string[];
  leadSupervisorIds: string[];
  constructionStartDate: string; // Format: DD/MM/YYYY
  plannedAcceptanceDate: string; // Format: DD/MM/YYYY
  capitalPlanApproval: Approval;
  technicalPlanApproval: Approval;
  budgetApproval: Approval;
  designUnit: ContactUnit;
  constructionUnit: ContactUnit;
  supervisionUnit: ContactUnit;
  projectManagementUnits?: ProjectManagementContact[];
  supervisorA: SupervisorAContact;
  reviews?: Record<string, ProjectReview>; // Map of reportId to review data
  scheduleSheetUrl?: string; // URL for embedding Google Sheet schedule
  scheduleSheetEditUrl?: string; // URL for editing the Google Sheet

  // NEW DETAILED DATE FIELDS - All optional for backward compatibility
  portfolioAssignmentDate?: string;     // Giao danh mục
  technicalPlanStage?: ApprovalStage;   // Phê duyệt Phương án kỹ thuật
  budgetStage?: ApprovalStage;          // Phê duyệt Dự toán
  designBidding?: BiddingPackage;       // Gói thầu: Tư vấn thiết kế
  supervisionBidding?: BiddingPackage;  // Gói thầu: Giám sát thi công
  constructionBidding?: BiddingPackage; // Gói thầu: Thi công sửa chữa
  finalSettlementStage?: ApprovalStage; // Phê duyệt Quyết toán
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string; // Format: DD/MM/YYYY
  tasks: string;
  images: string[]; // Firebase Storage download URLs
  submittedBy: string;
  progressPercentage?: number; // Tiến độ hoàn thành (%)
  personnelCount?: number; // Số lượng nhân lực
  equipmentOnSite?: string; // Thiết bị máy móc tại hiện trường
}

// Data structures for the new Document Management feature
export interface ProjectFile {
  id: string;
  name: string;
  url: string; // Firebase Storage URL
  size: number; // in bytes
  type: string; // MIME type
  uploadedBy: string; // User ID
  uploadedAt: string; // ISO 8601 timestamp
  path: string; // path within the project's document structure
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdBy: string; // User ID
  createdAt: string; // ISO 8601 timestamp
  path: string; // path within the project's document structure
}

// New Interface for Shared Contractor Library
export interface Contractor {
  id: string;
  name: string;
  type: 'Design' | 'Construction' | 'Supervision';
  contactPerson?: string;
  phone?: string;
}
