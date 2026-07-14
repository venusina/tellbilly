/**
 * JobContext
 *
 * Two pieces of cross-cutting state that many screens need at once:
 *  - `currentActiveJob`: the job the user is currently voice-commanding
 *    against (set when they open a job, or when a voice command like
 *    "new job for..." creates one).
 *  - `confirmationState`: the VoiceCommand currently waiting on a yes/no
 *    from the user, if any. Only one command is ever pending confirmation
 *    at a time — a new command replaces the old one rather than queuing.
 *
 * Business logic (talking to Supabase, executing a confirmed command) lives
 * in `@/hooks/useJob`, which reads/writes this context. Keeping this file to
 * state + plumbing makes it easy to test the reducer-ish logic in useJob
 * without a component tree.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import type { Job, VoiceCommand } from '@/types';

export interface JobContextValue {
  currentActiveJob: Job | null;
  setCurrentActiveJob: Dispatch<SetStateAction<Job | null>>;

  confirmationState: VoiceCommand | null;
  /** Sets the command awaiting user confirmation, replacing any prior one. */
  requestConfirmation: (command: VoiceCommand) => void;
  /**
   * Resolves the pending confirmation and clears it. Returns the resolved
   * command (with `status` updated to 'confirmed' | 'rejected') so the
   * caller can act on it, or `null` if nothing was pending.
   */
  resolveConfirmation: (approved: boolean) => VoiceCommand | null;
}

const JobContext = createContext<JobContextValue | null>(null);

export function JobProvider({ children }: { children: ReactNode }) {
  const [currentActiveJob, setCurrentActiveJob] = useState<Job | null>(null);
  const [confirmationState, setConfirmationState] = useState<VoiceCommand | null>(null);

  const requestConfirmation = useCallback((command: VoiceCommand) => {
    setConfirmationState({ ...command, status: 'needs_confirmation' });
  }, []);

  const resolveConfirmation = useCallback(
    (approved: boolean): VoiceCommand | null => {
      if (!confirmationState) return null;
      const resolved: VoiceCommand = {
        ...confirmationState,
        status: approved ? 'confirmed' : 'rejected',
      };
      setConfirmationState(null);
      return resolved;
    },
    [confirmationState]
  );

  const value = useMemo<JobContextValue>(
    () => ({
      currentActiveJob,
      setCurrentActiveJob,
      confirmationState,
      requestConfirmation,
      resolveConfirmation,
    }),
    [currentActiveJob, confirmationState, requestConfirmation, resolveConfirmation]
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJobContext(): JobContextValue {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
}
