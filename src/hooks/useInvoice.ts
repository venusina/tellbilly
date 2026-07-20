/**
 * useInvoice
 *
 * Invoice-scoped data operations backed by Supabase. Mirrors the shape of
 * `@/hooks/useJob` (local isLoading/error state, snake_case<->camelCase row
 * mapping) but scoped to a single job's invoices rather than the active job.
 */

import { useCallback, useState } from 'react';

import { supabase } from '@/services/supabase';
import type { Invoice, InvoiceInput, InvoiceStatus } from '@/types';
import { calculateInvoiceTotals, generateInvoiceNumber as nextInvoiceNumber } from '@/utils/invoiceUtils';

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

export function useInvoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Loads every invoice for a job, newest first. */
  const fetchInvoices = useCallback(async (jobId: string): Promise<Invoice[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('invoices')
        .select('*')
        .eq('job_id', jobId)
        .order('issue_date', { ascending: false });

      if (queryError) throw queryError;

      const mapped = (data as InvoiceRow[]).map(mapInvoiceRow);
      setInvoices(mapped);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generates the next sequential invoice number ("INV-2026-0007"). Numbers
   * are unique across the whole account (see the `invoices.invoice_number`
   * unique constraint in schema.sql), not just this job, so `jobId` isn't
   * used to filter the query — every invoice number the user has ever
   * issued has to be considered to avoid a collision.
   */
  const generateInvoiceNumber = useCallback(async (_jobId: string): Promise<string | null> => {
    setError(null);
    try {
      const { data, error: queryError } = await supabase.from('invoices').select('invoice_number');
      if (queryError) throw queryError;

      const existingNumbers = (data as Pick<InvoiceRow, 'invoice_number'>[]).map((row) => row.invoice_number);
      return nextInvoiceNumber(existingNumbers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice number.');
      return null;
    }
  }, []);

  /** Creates an invoice for a job, computing totals and the invoice number automatically. */
  const createInvoice = useCallback(
    async (jobId: string, data: Omit<InvoiceInput, 'jobId'>): Promise<Invoice | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const invoiceNumber = await generateInvoiceNumber(jobId);
        if (!invoiceNumber) throw new Error('Failed to generate invoice number.');

        const totals = calculateInvoiceTotals(data.lineItems, data.taxRate);

        const { data: row, error: insertError } = await supabase
          .from('invoices')
          .insert({
            job_id: jobId,
            invoice_number: invoiceNumber,
            status: data.status,
            line_items: data.lineItems,
            subtotal: totals.subtotal,
            tax_rate: data.taxRate,
            tax_amount: totals.taxAmount,
            total: totals.total,
            issue_date: data.issueDate,
            due_date: data.dueDate,
            paid_at: data.paidAt,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const invoice = mapInvoiceRow(row as InvoiceRow);
        setInvoices((prev) => [invoice, ...prev]);
        return invoice;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create invoice.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateInvoiceNumber]
  );

  /** Updates an invoice's status, stamping `paidAt` when it transitions to 'paid'. */
  const updateInvoiceStatus = useCallback(
    async (invoiceId: string, status: InvoiceStatus): Promise<Invoice | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: updateError } = await supabase
          .from('invoices')
          .update({
            status,
            paid_at: status === 'paid' ? new Date().toISOString() : null,
          })
          .eq('id', invoiceId)
          .select()
          .single();

        if (updateError) throw updateError;

        const invoice = mapInvoiceRow(data as InvoiceRow);
        setInvoices((prev) => prev.map((existing) => (existing.id === invoiceId ? invoice : existing)));
        return invoice;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update invoice status.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoiceStatus,
    generateInvoiceNumber,
  };
}
