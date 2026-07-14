/**
 * Core domain types for TellBilly.
 *
 * TellBilly lets a tradesperson run their whole job pipeline — clients,
 * jobs, expenses, invoices — by talking to the app. These types are shared
 * across services, hooks, context, and UI.
 */

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export type ExpenseCategory =
  | 'materials'
  | 'labor'
  | 'equipment'
  | 'permits'
  | 'travel'
  | 'other';

export interface Expense {
  id: string;
  jobId: string;
  description: string;
  amount: number; // stored in dollars, e.g. 42.50
  category: ExpenseCategory;
  incurredAt: string; // ISO 8601 — when the expense happened
  receiptUrl: string | null;
  createdAt: string; // ISO 8601
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>;

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  jobId: string;
  invoiceNumber: string; // e.g. "INV-2026-0007"
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number; // e.g. 0.0825 for 8.25%
  taxAmount: number;
  total: number;
  issueDate: string; // ISO 8601
  dueDate: string; // ISO 8601
  paidAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type InvoiceInput = Omit<
  Invoice,
  'id' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'total' | 'createdAt' | 'updatedAt'
>;

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

export type JobWorkStatus = 'in-progress' | 'done';
export type JobPaymentStatus = 'awaiting-payment' | 'paid';

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  workStatus: JobWorkStatus;
  paymentStatus: JobPaymentStatus;
  quotedAmount: number;
  jobNotes: string | null;
  expenses: Expense[];
  invoices: Invoice[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  completedAt: string | null; // ISO 8601 — set when workStatus becomes 'done'
}

export type JobInput = Omit<
  Job,
  'id' | 'expenses' | 'invoices' | 'createdAt' | 'updatedAt' | 'completedAt'
>;

// ---------------------------------------------------------------------------
// Voice command
// ---------------------------------------------------------------------------

/**
 * Intents the voice pipeline can recognize. Extend this union as new
 * capabilities are added — the reducer in voiceProcessor.ts is exhaustively
 * checked against it.
 */
export type VoiceIntent =
  | 'create_job'
  | 'add_expense'
  | 'mark_job_done'
  | 'mark_job_paid'
  | 'create_invoice'
  | 'update_quote'
  | 'add_job_note'
  | 'unknown';

/**
 * Loosely-typed slots extracted from a transcript for a given intent.
 * TODO(claude-api): once intent extraction moves to the Claude API, replace
 * this with a discriminated union keyed by `intent` (one interface per
 * intent) so downstream consumers get exhaustive type-narrowing instead of
 * optional-everything.
 */
export interface VoiceEntities {
  clientName?: string;
  jobId?: string;
  jobTitle?: string;
  amount?: number;
  expenseDescription?: string;
  expenseCategory?: ExpenseCategory;
  note?: string;
}

export type VoiceCommandStatus =
  | 'pending' // transcribed, not yet processed
  | 'needs_confirmation' // low confidence or destructive — waiting on user
  | 'confirmed' // user approved the parsed intent
  | 'rejected' // user declined the parsed intent
  | 'executed' // action was applied
  | 'failed'; // execution errored

export interface VoiceCommand {
  id: string;
  transcript: string;
  intent: VoiceIntent;
  entities: VoiceEntities;
  confidence: number; // 0..1
  requiresConfirmation: boolean;
  confirmationPrompt: string | null;
  status: VoiceCommandStatus;
  jobId: string | null; // job this command targets/creates, once known
  createdAt: string; // ISO 8601
}
