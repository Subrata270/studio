

export type Role = 'employee' | 'hod' | 'finance' | 'admin';
export type SubRole = 'apa' | 'am' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Should be hashed in a real app
  role: Role;
  isHOD?: boolean;
  subrole: SubRole;
  department: string;
  googleUid?: string;
  microsoftUid?: string;
}

export type SubscriptionStatus = 'Pending' | 'Approved' | 'Declined' | 'Active' | 'Expired' | 'ForwardedToAM' | 'VerifiedByAM' | 'PaymentCompleted';

export interface Subscription {
  id: string;
  toolName: string;
  vendorName?: string;
  duration: number; // in months
  cost: number;
  department: string;
  purpose: string;
  status: SubscriptionStatus;
  requestedBy: string; // userId
  requestDate: string; // ISO date string
  hodId?: string; // HOD's userId for approval routing
  alertDays?: number; // Days before expiry to show alert
  expiryDate?: string; // ISO date string
  invoiceUrl?: string;
  remarks?: string;
  approvedBy?: string; // HOD's userId
  approvalDate?: string;
  apaApproverId?: string; // APA's userId who approved for payment
  paidBy?: string; // Finance AM user's userId who executed payment
  paymentDate?: string;
  lastAlertTriggered?: string;
  renewedOn?: string;
  baseMonthlyUSD?: number;
  frequency?: 'Monthly' | 'Quarterly' | 'Yearly' | 'One-time';
  poc?: string;
  attachments?: File[];
  paymentMode?: string;
  transactionId?: string;
  invoiceNumber?: string;
  
  finance?: {
    apaQueueAddedAt?: string;
    amLog?: {
      by: string; // amUserId
      at: string; // ISO date string
      verificationNote: string;
      recommendedPaymentType: string;
      suggestedPaymentAccount?: string;
      plannedAmount: number;
      plannedCurrency: 'USD' | 'INR';
      plannedDate: string; // ISO date string
      attachments?: string[]; // URLs
    };
    apaExecution?: {
      by: string; // apaUserId
      at: string; // ISO date string
      paymentType: string;
      transactionId: string;
      amountPaid: number;
      currency: 'USD' | 'INR';
      exchangeRate?: number;
      receiptUrl: string;
      notes?: string;
      invoiceNumber: string;
    };
  };
  monthlyContinuation?: {
    [yearMonth: string]: 'pending' | 'continued' | 'declined'; // e.g., { "2024-11": "continued" }
  };
}

export const toolOptions = ['ChatGPT', 'Canva', 'Figma', 'Notion', 'Zoom', 'Adobe Creative Cloud', 'Slack', 'Microsoft 365'];

export const departmentOptions = ['Marketing', 'Engineering', 'Finance', 'IT', 'HR', 'Sales', 'Operations'];

export const categoryOptions = ['Software', 'Hardware', 'Services', 'Consulting', 'Training', 'Others'];

export interface AppNotification {
    id: string;
    userId: string;
    message: string;
    isRead: boolean;
    createdAt: string; // ISO date string
}

    