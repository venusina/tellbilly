/**
 * ConversationContext
 *
 * Holds in-progress multi-turn AI conversation state — e.g. the user says
 * "create an invoice for John Black", the AI needs to ask "is this for an
 * existing job, or a new one?" before it can act, and this is where that
 * pending question/answer state lives between the two turns.
 *
 * This is deliberately separate from `@/context/JobContext`: that holds
 * persisted job data: this holds ephemeral, in-memory conversation state
 * that's meaningless once the action completes or the user wanders off.
 * Don't merge them.
 *
 * Step 1 of the voice-driven creation feature — this file is only the state
 * container. No AI calls, no Supabase writes happen here; those land in a
 * later step, driven by whatever hook ends up owning that business logic
 * (mirroring how `@/hooks/useJob` owns the logic on top of JobContext).
 *
 * Sessions expire 5 minutes after they're started. That expiry is enforced
 * here, not by callers — every read of `session`, and every write via
 * `addTurn`/`updateSession`, treats a stale session as already cleared, so
 * a screen can't accidentally act on a conversation the user abandoned
 * minutes ago just because nobody remembered to check first.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PendingAction = 'CREATE_JOB' | 'CREATE_INVOICE' | 'ADD_EXPENSE' | null;

export interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ConversationSession {
  pendingAction: PendingAction;
  potentialClientId: string | null;
  potentialClientName: string | null;
  extractedEntities: {
    amount?: number;
    description?: string;
    [key: string]: unknown;
  };
  waitingForUserResponse: boolean;
  turns: ConversationTurn[];
  createdAt: number;
}

export interface ConversationContextValue {
  session: ConversationSession | null;
  /** Begins a new session, replacing any prior one (expired or not). */
  startSession: (pendingAction: PendingAction) => void;
  /** Appends a turn to the active session. No-op if there isn't one (never started, or expired). */
  addTurn: (role: ConversationTurn['role'], text: string) => void;
  /** Shallow-merges `partial` onto the active session. No-op if there isn't one. */
  updateSession: (partial: Partial<ConversationSession>) => void;
  /** Resets to no active session. */
  clearSession: () => void;
  /** True if a session exists and is older than 5 minutes. */
  isExpired: () => boolean;
}

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

function isSessionExpired(session: ConversationSession): boolean {
  return Date.now() - session.createdAt > SESSION_TIMEOUT_MS;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [rawSession, setRawSession] = useState<ConversationSession | null>(null);

  // The auto-expiry itself: derived on every render rather than requiring
  // callers to check `isExpired()` first. Once a session is older than
  // SESSION_TIMEOUT_MS, every reader sees `null` immediately — there's no
  // separate "clear" step to remember, and no effect-timing race to worry
  // about (see addTurn/updateSession, which apply the same check against
  // the latest state inside their own setState updater, not this derived
  // value, so a write right after expiry can't act on stale state either).
  const session = rawSession && !isSessionExpired(rawSession) ? rawSession : null;

  const startSession = useCallback((pendingAction: PendingAction) => {
    setRawSession({
      pendingAction,
      potentialClientId: null,
      potentialClientName: null,
      extractedEntities: {},
      waitingForUserResponse: false,
      turns: [],
      createdAt: Date.now(),
    });
  }, []);

  const addTurn = useCallback((role: ConversationTurn['role'], text: string) => {
    setRawSession((current) => {
      if (!current || isSessionExpired(current)) return null;
      return {
        ...current,
        turns: [...current.turns, { role, text, timestamp: Date.now() }],
      };
    });
  }, []);

  const updateSession = useCallback((partial: Partial<ConversationSession>) => {
    setRawSession((current) => {
      if (!current || isSessionExpired(current)) return null;
      return { ...current, ...partial };
    });
  }, []);

  const clearSession = useCallback(() => {
    setRawSession(null);
  }, []);

  const isExpired = useCallback((): boolean => {
    return rawSession !== null && isSessionExpired(rawSession);
  }, [rawSession]);

  const value = useMemo<ConversationContextValue>(
    () => ({
      session,
      startSession,
      addTurn,
      updateSession,
      clearSession,
      isExpired,
    }),
    [session, startSession, addTurn, updateSession, clearSession, isExpired]
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversation(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
