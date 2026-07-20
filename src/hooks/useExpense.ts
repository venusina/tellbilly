/**
 * useExpense
 *
 * Expense-scoped data operations backed by Supabase. Mirrors the shape of
 * `@/hooks/useJob` (local isLoading/error state, snake_case<->camelCase row
 * mapping) but scoped to a single job's expenses.
 */

import { useCallback, useState } from 'react';

import { supabase } from '@/services/supabase';
import type { Expense, ExpenseInput } from '@/types';

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

export function useExpense() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Loads every expense for a job, most recently incurred first. */
  const fetchExpenses = useCallback(async (jobId: string): Promise<Expense[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('expenses')
        .select('*')
        .eq('job_id', jobId)
        .order('incurred_at', { ascending: false });

      if (queryError) throw queryError;

      const mapped = (data as ExpenseRow[]).map(mapExpenseRow);
      setExpenses(mapped);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Adds an expense to a job and merges it into local state. */
  const addExpense = useCallback(
    async (jobId: string, expense: Omit<ExpenseInput, 'jobId'>): Promise<Expense | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: insertError } = await supabase
          .from('expenses')
          .insert({
            job_id: jobId,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            incurred_at: expense.incurredAt,
            receipt_url: expense.receiptUrl,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const created = mapExpenseRow(data as ExpenseRow);
        setExpenses((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add expense.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /** Deletes an expense and removes it from local state. */
  const deleteExpense = useCallback(async (expenseId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (deleteError) throw deleteError;

      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Sums a job's expenses, fetching fresh from Supabase rather than trusting local state. */
  const calculateTotalExpenses = useCallback(async (jobId: string): Promise<number> => {
    setError(null);
    try {
      const { data, error: queryError } = await supabase.from('expenses').select('amount').eq('job_id', jobId);
      if (queryError) throw queryError;

      return (data as Pick<ExpenseRow, 'amount'>[]).reduce((sum, row) => sum + row.amount, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate total expenses.');
      return 0;
    }
  }, []);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    addExpense,
    deleteExpense,
    calculateTotalExpenses,
  };
}
