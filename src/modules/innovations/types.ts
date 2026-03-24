
export { Role, type User } from '../../shared/types/common.ts';

export type InitiativeLevel = 'HLH' | 'NPSC' | 'NPC' | 'EVN';
export type InitiativeScope = 'Company' | 'NPC';

export interface PointConfig {
  HLH: number;
  NPSC: number;
  NPC: number;
  EVN: number;
}

export interface Initiative {
  id: string;
  scope?: InitiativeScope;
  phase: string;
  year: number;
  type: string;
  title: string;
  content: string;
  authors: string[];
  unit: string[];
  result: string;
  field: string[];
  reward: string;
  level: InitiativeLevel[];
  isScalable?: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentUrls?: string[];
  driveLink?: string;
  imageUrl?: string;
  imageUrls?: string[];
  approvalDocUrls?: string[];
  monthsApplied?: number;
  embedding_field?: number[]; // Vector data for RAG
}

export interface ComplianceCheck {
  overallStatus: 'pass' | 'fail' | 'warning';
  score: number;
  items: {
    criteria: string;
    isMet: boolean;
    comment: string;
  }[];
  missingSections: string[];
  suggestion: string;
}

export interface PublicCheckResult {
  score: number;
  verdict: string;
  advice: string;
  similarTitle?: string;
  similarId?: string;
  similarScope?: InitiativeScope;
}

export interface PendingInitiative {
  id: string;
  title: string;
  authors: string[];
  unit: string[];
  year: number;
  content: string;
  field: string[];
  status: 'pending';
  submittedAt: number;
  driveLink?: string;
  attachmentUrls?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  registrationFormUrl?: string;
  contactZalo?: string;
  monthsApplied?: number;

  // Trường mới: Lưu kết quả check của user để admin xem
  publicAnalysis?: PublicCheckResult;

  complianceCheck?: ComplianceCheck;
}

export type SettlementStatus = 'chua_thanh_toan' | 'dang_thanh_toan' | 'da_quyet_toan';
export type ProjectStatus = 'dang_thuc_hien' | 'da_nghiem_thu' | 'da_huy';

export interface ResearchProject {
  id: string;
  title: string;
  authors: string[];
  mainMembers: string[];
  experts: string[];
  budget: number;
  progress: number;
  settlementStatus: SettlementStatus;
  content: string;
  level: 'NPSC' | 'NPC' | 'EVN';
  year: number;
  status: ProjectStatus;
  attachmentUrl?: string;
}

export interface SimilarityInfo {
  score: number;
  status: 'new' | 'similar' | 'duplicate';
  reason: string;
  referenceTitle?: string;
}

export interface BatchItem {
  tempId: string;
  selected: boolean;
  title: string;
  authors: string[];
  unit: string[];
  year: number;
  content: string;
  field: string[];
  level: InitiativeLevel[];
  similarity?: SimilarityInfo;
  scope?: InitiativeScope;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  thinking?: string;
  isRag?: boolean; // RAG message flag
}

export interface AnalysisResult {
  evaluation: string;
  similarity: {
    isDuplicate: boolean;
    score: number;
    reason: string;
    similarToId?: string;
  };
}

export interface ReferenceDocument {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  size: number;
  uploadDate: number;
  uploadedBy: string;
}
