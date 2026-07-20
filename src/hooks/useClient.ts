/**
 * useClient
 *
 * Client-scoped data operations backed by Supabase. Mirrors the shape of
 * `@/hooks/useJob` (local isLoading/error state, snake_case<->camelCase row
 * mapping).
 */

import { useCallback, useState } from 'react';

import { supabase } from '@/services/supabase';
import type { Client } from '@/types';

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Loads every client for the signed-in user, alphabetically. */
  const fetchClients = useCallback(async (): Promise<Client[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase.from('clients').select('*').order('name');
      if (queryError) throw queryError;

      const mapped = (data as ClientRow[]).map(mapClientRow);
      setClients(mapped);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Creates a client and merges it into local state. */
  const createClient = useCallback(
    async (name: string, phone: string | null, email: string | null): Promise<Client | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: insertError } = await supabase
          .from('clients')
          .insert({ name, phone, email, address: null, notes: null })
          .select()
          .single();

        if (insertError) throw insertError;

        const created = mapClientRow(data as ClientRow);
        setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create client.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /** Searches clients by name, email, or phone (case-insensitive, partial match). */
  const searchClient = useCallback(async (query: string): Promise<Client[]> => {
    const trimmed = query.trim();
    if (!trimmed) return fetchClients();

    setIsLoading(true);
    setError(null);
    try {
      // Commas are the `.or()` filter's condition separator — strip them so
      // user input can't inject extra filter conditions.
      const term = `%${trimmed.replace(/,/g, '')}%`;
      const { data, error: queryError } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
        .order('name');

      if (queryError) throw queryError;
      return (data as ClientRow[]).map(mapClientRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search clients.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fetchClients]);

  return {
    clients,
    isLoading,
    error,
    fetchClients,
    createClient,
    searchClient,
  };
}
