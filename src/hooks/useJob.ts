/**
 * useJob
 *
 * Job-scoped data operations backed by Supabase, wired to `currentActiveJob`
 * in JobContext so any screen using this hook sees the same active job.
 *
 * TODO(claude-api): when a VoiceCommand comes back from
 * `processVoiceCommand` (see @/services/voiceProcessor) with intent
 * 'create_job' / 'add_expense' and status 'confirmed', route it here —
 * e.g. `addExpense(jobId, { description: entities.expenseDescription, ... })`
 * — this hook is the execution layer the voice pipeline drives.
 */

import { useCallback, useState } from 'react';

import { useJobContext } from '@/context/JobContext';
import { supabase } from '@/services/supabase';
import type { Expense, ExpenseInput, Job, JobInput } from '@/types';

// ---------------------------------------------------------------------------
// Row <-> domain type mapping
// ---------------------------------------------------------------------------
// Supabase/Postgres columns are snake_case; the app's domain types (see
// @/types) are camelCase. These mappers are the single seam between the two
// so the rest of the app never touches raw row shapes.

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

interface InvoiceRow {
  id: string;
  job_id: string;
  invoice_number: string;
  status: Job['invoices'][number]['status'];
  line_items: Job['invoices'][number]['lineItems'];
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

function mapInvoiceRow(row: InvoiceRow): Job['invoices'][number] {
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

const JOB_SELECT_WITH_RELATIONS = '*, expenses(*), invoices(*)';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useJob() {
  const { currentActiveJob, setCurrentActiveJob } = useJobContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Loads a job (with its expenses/invoices) and makes it the active job. */
  const fetchJob = useCallback(
    async (jobId: string): Promise<Job | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from('jobs')
          .select(JOB_SELECT_WITH_RELATIONS)
          .eq('id', jobId)
          .single();

        if (queryError) throw queryError;

        const job = mapJobRow(data as JobRow);
        setCurrentActiveJob(job);
        return job;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentActiveJob]
  );

  /** Creates a job and makes it the active job. */
  const createJob = useCallback(
    async (input: JobInput): Promise<Job | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: insertError } = await supabase
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

        if (insertError) throw insertError;

        const job = mapJobRow(data as JobRow);
        setCurrentActiveJob(job);
        return job;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create job.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentActiveJob]
  );

  /**
   * Adds an expense to a job and, if that job is currently active, merges
   * the new expense into `currentActiveJob` so the UI updates without a
   * refetch.
   */
  const addExpense = useCallback(
    async (jobId: string, input: Omit<ExpenseInput, 'jobId'>): Promise<Expense | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: insertError } = await supabase
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

        if (insertError) throw insertError;

        const expense = mapExpenseRow(data as ExpenseRow);

        setCurrentActiveJob((job) =>
          job && job.id === jobId ? { ...job, expenses: [...job.expenses, expense] } : job
        );

        return expense;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add expense.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentActiveJob]
  );

  return {
    currentActiveJob,
    isLoading,
    error,
    fetchJob,
    createJob,
    addExpense,
  };
}
