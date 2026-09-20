export interface AuthSessionUser {
  id: string;
  username?: string | null;
  email: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  roleName: string | null;
  permissions: string[];
}

export interface UserProfileUpdateRequest {
  username: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  avatarUrl?: string | null;
}

export interface UserPasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: AuthSessionUser;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  tier?: "executive" | "committee" | "apprentice";
  committee?: string | null;
  permissions: string[];
}

export interface AppNotification {
  id: string;
  userId: string | null;
  targetRoleId?: string | null;
  targetPermission?: string | null;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  notificationType: string;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface User {
  id: string;
  username?: string | null;
  email: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  role: Role | null;
  activationOtp?: string | null;
  version?: number;
}

export interface DashboardStats {
  gpoaEventsCount: number;
  activeTasksCount: number;
  netTreasuryBalance: number;
  registeredOfficersCount: number;
  definedRolesCount: number;
  inventoryItemsCount: number;
  materialsCount: number;
  resolutionsCount: number;
}

export type GPOAEventStatus =
  | "proposal"
  | "in_review"
  | "approved"
  | "completed"
  | "cancelled";

export interface GPOAEvent {
  id: string;
  title: string;
  description: string;
  status: GPOAEventStatus;
  startTime: string;
  endTime: string;
  location: string;
  targetAudience: string;
  googleEventId: string | null;
  driveFolderUrl?: string | null;
  driveFolderId?: string | null;
  proposalDocUrl?: string | null;
  materialsUrl?: string | null;
  documentationUrl?: string | null;
  evaluationsUrl?: string | null;
  terminalReportUrl?: string | null;
  createdAt: string;
}

export type TransactionType = "income" | "expense";

export interface FinanceTransaction {
  id: string;
  title: string;
  amount: number;
  transactionType: TransactionType;
  category: string;
  referenceNo: string | null;
  receiptUrl: string | null;
  proofFileId?: string | null;
  notes: string;
  recordedById: string | null;
  createdAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}

export type ReimbursementStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "disbursed";

export interface ReimbursementRequest {
  id: string;
  title: string;
  amount: number;
  category: string;
  status: ReimbursementStatus;
  receiptUrl?: string | null;
  proofFileId?: string | null;
  notes: string;
  rejectionReason?: string | null;
  claimantId: string;
  claimantName?: string | null;
  reviewedById?: string | null;
  reviewerName?: string | null;
  financeTxId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  condition: string;
  location: string;
  remarks: string;
  proofUrl?: string | null;
  proofFileId?: string | null;
  updatedById: string | null;
  updatedAt: string;
}

export type MaterialCategory = "academic" | "creative" | "sports";

export interface Material {
  id: string;
  title: string;
  description: string;
  category: MaterialCategory;
  driveUrl: string;
  fileId?: string | null;
  fileType: string;
  uploadedById: string | null;
  createdAt: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  wingNumber: string;
  wingName: string;
  folderName: string;
  category: string;
  responsibleRoles: string;
  namingConvention: string;
  acceptedFormats: string;
  instructions?: string | null;
  templateUrl: string;
  fileType: string;
  fileId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AnnouncementScope =
  | "general"
  | "communications"
  | "external_partnership";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  scope: AnnouncementScope;
  sentViaEmail: boolean;
  authorId: string | null;
  createdAt: string;
}

export type InternalDocumentType =
  | "resolution"
  | "memorandum"
  | "meeting_minutes"
  | "policy"
  | "constitution";

export interface Resolution {
  id: string;
  resolutionNo: string;
  title: string;
  body: string;
  status: string;
  documentType: InternalDocumentType;
  driveDocUrl: string | null;
  fileId?: string | null;
  passedDate: string;
  authoredById: string | null;
  createdAt: string;
}

export type TaskStatus = "todo" | "in_progress" | "under_review" | "done";

export interface TaskSubtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  assignedToId: string | null;
  assignedToName?: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  startTime?: string | null;
  endTime?: string | null;
  department?: string | null;
  assignedToId: string | null;
  gpoaEventId?: string | null;
  gpoaEventTitle?: string | null;
  createdById: string | null;
  createdAt: string;
  completedAt?: string | null;
  subtasks?: TaskSubtask[];
  completedSubtasksCount?: number;
  totalSubtasksCount?: number;
  version?: number;
}

export type LogCategory = "audit" | "security" | "system";
export type LogSeverity = "info" | "warning" | "error" | "critical";

export interface AuditLogEntry {
  id: string;
  category: LogCategory;
  severity: LogSeverity;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  statusCode: number;
  createdAt: string;
}

export interface AuditLogsSummary {
  total: number;
  audit: number;
  security: number;
  system: number;
  errors: number;
}

export interface AuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: AuditLogsSummary;
}
