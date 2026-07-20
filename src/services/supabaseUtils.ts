/**
 * Framework-free Supabase CRUD helpers for jobs, expenses, and invoices.
 *
 * Unlike the `use*` hooks (@/hooks/useJob, useInvoice, useExpense), these
 * functions carry no React state (no loading/error state, no context
 * wiring) — just a Supabase call, row<->domain mapping, and a normalized
 * thrown Error on failure. Safe to call from hooks, the voice pipeline, or
 * tests without a component tree.
 */

import { supabase } from './supabase';

import type { Expense, ExpenseInput, Invoice, InvoiceInput, Job, JobInput } from '@/types';

// ---------------------------------------------------------------------------
// Row <-> domain type mapping (snake_case columns -> camelCase domain types)
// ---------------------------------------------------------------------------

interface JobRow {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  work_status: Job['workStatus'];
  payment_status: Job['paymentStatus'];
  quoted_amount: number;
  job_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expenses?: ExpenseRow[];
  invoices?: InvoiceRow[];
}

interface ExpenseRow {
  id: string;
  job_id: string;
  description: string;
  amount: number;
  category: Expense['category'];
  incurred_at: string;
  receipt_url: string | null;
  created_at: string;
}

interface InvoiceRow {
  id: string;
  job_id: string;
  invoice_number: string;
  status: Invoice['status'];
  line_items: Invoice['lineItems'];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapJobRow(row: JobRow): Job {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    workStatus: row.work_status,
    paymentStatus: row.payment_status,
    quotedAmount: row.quoted_amount,
    jobNotes: row.job_notes,
    expenses: (row.expenses ?? []).map(mapExpenseRow),
    invoices: (row.invoices ?? []).map(mapInvoiceRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    jobId: row.job_id,
    description: row.description,
    amount: row.amount,
    category: row.category,
    incurredAt: row.incurred_at,
    receiptUrl: row.receipt_url,
    createdAt: row.created_at,
  };
}

function mapInvoiceRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    jobId: row.job_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    lineItems: row.line_items,
    subtotal: row.subtotal,
    taxRate: row.tax_rate,
    taxAmount: row.tax_amount,
    total: row.total,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const JOB_SELECT_WITH_RELATIONS = '*, expenses(*), invoices(*)';

/** Normalizes any thrown value (PostgrestError, Error, etc.) into a plain Error with a stable message. */
function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return new Error(err.message);
  }
  return new Error(fallback);
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function createJob(input: JobInput): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      client_id: input.clientId,
      title: input.title,
      description: input.description,
      work_status: input.workStatus,
      payment_status: input.paymentStatus,
      quoted_amount: input.quotedAmount,
      job_notes: input.jobNotes,
    })
    .select(JOB_SELECT_WITH_RELATIONS)
    .single();

  if (error) throw toError(error, 'Failed to create job.');
  return mapJobRow(data as JobRow);
}

export async function readJob(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_SELECT_WITH_RELATIONS)
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw toError(error, 'Failed to read job.');
  return data ? mapJobRow(data as JobRow) : null;
}

export async function updateJob(jobId: string, patch: Partial<JobInput>): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...(patch.clientId !== undefined && { client_id: patch.clientId }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.workStatus !== undefined && { work_status: patch.workStatus }),
      ...(patch.paymentStatus !== undefined && { payment_status: patch.paymentStatus }),
      ...(patch.quotedAmount !== undefined && { quoted_amount: patch.quotedAmount }),
      ...(patch.jobNotes !== undefined && { job_notes: patch.jobNotes }),
    })
    .eq('id', jobId)
    .select(JOB_SELECT_WITH_RELATIONS)
    .single();

  if (error) throw toError(error, 'Failed to update job.');
  return mapJobRow(data as JobRow);
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function createExpense(jobId: string, input: Omit<ExpenseInput, 'jobId'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      job_id: jobId,
      description: input.description,
      amount: input.amount,
      category: input.category,
      incurred_at: input.incurredAt,
      receipt_url: input.receiptUrl,
    })
    .select()
    .single();

  if (error) throw toError(error, 'Failed to create expense.');
  return mapExpenseRow(data as ExpenseRow);
}

export async function readExpenses(jobId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('job_id', jobId)
    .order('incurred_at', { ascending: false });

  if (error) throw toError(error, 'Failed to read expenses.');
  return (data as ExpenseRow[]).map(mapExpenseRow);
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export async function createInvoice(
  jobId: string,
  input: Omit<InvoiceInput, 'jobId'> & { invoiceNumber: string; subtotal: number; taxAmount: number; total: number }
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      job_id: jobId,
      invoice_number: input.invoiceNumber,
      status: input.status,
      line_items: input.lineItems,
      subtotal: input.subtotal,
      tax_rate: input.taxRate,
      tax_amount: input.taxAmount,
      total: input.total,
      issue_date: input.issueDate,
      due_date: input.dueDate,
      paid_at: input.paidAt,
    })
    .select()
    .single();

  if (error) throw toError(error, 'Failed to create invoice.');
  return mapInvoiceRow(data as InvoiceRow);
}

export async function readInvoice(invoiceId: string): Promise<Invoice | null> {
  const { data, error } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();

  if (error) throw toError(error, 'Failed to read invoice.');
  return data ? mapInvoiceRow(data as InvoiceRow) : null;
}

export async function updateInvoice(invoiceId: string, patch: Partial<Omit<Invoice, 'id' | 'jobId'>>): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...(patch.invoiceNumber !== undefined && { invoice_number: patch.invoiceNumber }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.lineItems !== undefined && { line_items: patch.lineItems }),
      ...(patch.subtotal !== undefined && { subtotal: patch.subtotal }),
      ...(patch.taxRate !== undefined && { tax_rate: patch.taxRate }),
      ...(patch.taxAmount !== undefined && { tax_amount: patch.taxAmount }),
      ...(patch.total !== undefined && { total: patch.total }),
      ...(patch.issueDate !== undefined && { issue_date: patch.issueDate }),
      ...(patch.dueDate !== undefined && { due_date: patch.dueDate }),
      ...(patch.paidAt !== undefined && { paid_at: patch.paidAt }),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw toError(error, 'Failed to update invoice.');
  return mapInvoiceRow(data as InvoiceRow);
}
