/**
 * Voice command processing.
 *
 * Turns a raw speech-to-text transcript into a structured VoiceCommand:
 * intent, extracted entities, a confidence score, and — when the command is
 * ambiguous or destructive — a human-readable confirmation prompt.
 *
 * TODO(claude-api): the keyword/regex matching below is a placeholder.
 * Replace `extractIntent` and `extractEntities` with a single call to the
 * Claude API (Messages API, tool use) that returns a structured
 * { intent, entities, confidence } payload in one pass. Keep this module's
 * public signature (`processVoiceCommand`) stable so callers don't change.
 * See https://docs.claude.com/en/docs/build-with-claude/tool-use for the
 * tool-use pattern to use for structured extraction.
 */

import type { ExpenseCategory, VoiceCommand, VoiceEntities, VoiceIntent } from '@/types';

/** Below this confidence, a command is routed to the user for confirmation. */
export const CONFIDENCE_THRESHOLD = 0.75;

/** Intents that mutate money or job state always require confirmation, regardless of confidence. */
const ALWAYS_CONFIRM_INTENTS: ReadonlySet<VoiceIntent> = new Set([
  'mark_job_paid',
  'mark_job_done',
  'create_invoice',
]);

function createId(): string {
  return `vc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Intent extraction (placeholder — see TODO above)
// ---------------------------------------------------------------------------

interface IntentMatch {
  intent: VoiceIntent;
  confidence: number;
}

const INTENT_KEYWORDS: Array<{ intent: VoiceIntent; patterns: RegExp[] }> = [
  { intent: 'create_job', patterns: [/\bnew job\b/i, /\bstart(ed|ing)? a job\b/i, /\bcreate a job\b/i] },
  { intent: 'add_expense', patterns: [/\bspent\b/i, /\bbought\b/i, /\badd (an? )?expense\b/i, /\bpaid for\b/i] },
  { intent: 'mark_job_done', patterns: [/\bmark(ed)? (it |this )?done\b/i, /\bjob(?:'s| is) (finished|complete)\b/i, /\bfinished the job\b/i] },
  { intent: 'mark_job_paid', patterns: [/\bmark(ed)? (it |this )?paid\b/i, /\bclient paid\b/i, /\bpayment received\b/i] },
  { intent: 'create_invoice', patterns: [/\bsend (an? )?invoice\b/i, /\bcreate (an? )?invoice\b/i, /\binvoice (the|for)\b/i] },
  { intent: 'update_quote', patterns: [/\bquote(d)?\b/i, /\bupdate the (price|quote|estimate)\b/i, /\bestimate\b/i] },
  { intent: 'add_job_note', patterns: [/\bnote\b/i, /\bremind me\b/i, /\bremember that\b/i] },
];

function extractIntent(transcript: string): IntentMatch {
  for (const { intent, patterns } of INTENT_KEYWORDS) {
    const hit = patterns.some((pattern) => pattern.test(transcript));
    if (hit) {
      // Placeholder confidence: single keyword match is treated as "fairly
      // confident but not certain" until Claude API extraction lands.
      return { intent, confidence: 0.8 };
    }
  }
  return { intent: 'unknown', confidence: 0 };
}

const EXPENSE_CATEGORY_KEYWORDS: Array<{ category: ExpenseCategory; patterns: RegExp[] }> = [
  { category: 'materials', patterns: [/\b(lumber|paint|materials|supplies|parts)\b/i] },
  { category: 'labor', patterns: [/\b(labor|labour|crew|helper)\b/i] },
  { category: 'equipment', patterns: [/\b(rental|equipment|tool)\b/i] },
  { category: 'permits', patterns: [/\bpermit\b/i] },
  { category: 'travel', patterns: [/\b(gas|mileage|travel|fuel)\b/i] },
];

function extractDollarAmount(transcript: string): number | undefined {
  const match = transcript.match(/\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:dollars)?/i);
  return match ? Number.parseFloat(match[1]) : undefined;
}

function extractExpenseCategory(transcript: string): ExpenseCategory | undefined {
  for (const { category, patterns } of EXPENSE_CATEGORY_KEYWORDS) {
    if (patterns.some((pattern) => pattern.test(transcript))) return category;
  }
  return undefined;
}

/**
 * Naive "everything after a trigger phrase up to the next clause" extractor
 * for free-text fields (client/job names, notes). Good enough for a
 * placeholder; the Claude API pass should replace this with real slot
 * filling.
 */
function extractFreeText(transcript: string, triggers: RegExp[]): string | undefined {
  for (const trigger of triggers) {
    const match = transcript.match(trigger);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractEntities(transcript: string, intent: VoiceIntent): VoiceEntities {
  switch (intent) {
    case 'create_job':
      return {
        clientName: extractFreeText(transcript, [/for ([a-z0-9 .'-]+?)(?:,| at| quoted|$)/i]),
        jobTitle: extractFreeText(transcript, [/new job[,:]?\s*(.+?)(?:\.|$)/i]),
        amount: extractDollarAmount(transcript),
      };
    case 'add_expense':
      return {
        expenseDescription: extractFreeText(transcript, [/(?:spent|bought|paid for)\s+\$?\d*\.?\d*\s*(?:dollars)?\s*(?:on|for)?\s*(.+?)(?:\.|$)/i]),
        expenseCategory: extractExpenseCategory(transcript),
        amount: extractDollarAmount(transcript),
      };
    case 'mark_job_done':
    case 'mark_job_paid':
      return {
        jobTitle: extractFreeText(transcript, [/(?:job for|the) ([a-z0-9 .'-]+?)(?:\s+(?:job|is|as)|$)/i]),
      };
    case 'create_invoice':
      return {
        clientName: extractFreeText(transcript, [/invoice (?:the |for )?([a-z0-9 .'-]+?)(?:\.|$)/i]),
        amount: extractDollarAmount(transcript),
      };
    case 'update_quote':
      return {
        amount: extractDollarAmount(transcript),
        jobTitle: extractFreeText(transcript, [/for (?:the )?([a-z0-9 .'-]+?)(?:\s+job|\s+to|$)/i]),
      };
    case 'add_job_note':
      return {
        note: extractFreeText(transcript, [/(?:note|remind me|remember that)[,:]?\s*(.+)/i]),
      };
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Confirmation prompts
// ---------------------------------------------------------------------------

function formatAmount(amount: number | undefined): string {
  if (amount === undefined) return 'an unspecified amount';
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * Builds a plain-language confirmation prompt for a parsed command, e.g.
 * "Add a $42.50 materials expense to this job?" — read aloud or shown as a
 * yes/no prompt before the action is applied.
 */
export function buildConfirmationPrompt(intent: VoiceIntent, entities: VoiceEntities): string | null {
  switch (intent) {
    case 'create_job':
      return `Create a new job "${entities.jobTitle ?? 'Untitled job'}"${
        entities.clientName ? ` for ${entities.clientName}` : ''
      }${entities.amount ? ` quoted at ${formatAmount(entities.amount)}` : ''}?`;
    case 'add_expense':
      return `Add ${formatAmount(entities.amount)} expense${
        entities.expenseDescription ? ` for "${entities.expenseDescription}"` : ''
      }${entities.expenseCategory ? ` (${entities.expenseCategory})` : ''} to this job?`;
    case 'mark_job_done':
      return `Mark ${entities.jobTitle ?? 'this job'} as done?`;
    case 'mark_job_paid':
      return `Mark ${entities.jobTitle ?? 'this job'} as paid?`;
    case 'create_invoice':
      return `Create an invoice${entities.clientName ? ` for ${entities.clientName}` : ''}${
        entities.amount ? ` totaling ${formatAmount(entities.amount)}` : ''
      }?`;
    case 'update_quote':
      return `Update the quote${entities.jobTitle ? ` for ${entities.jobTitle}` : ''} to ${formatAmount(
        entities.amount
      )}?`;
    case 'add_job_note':
      return `Add note: "${entities.note ?? ''}"?`;
    case 'unknown':
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Processes a raw transcript into a structured VoiceCommand. Does not
 * execute any side effects — callers (see useJob.ts / JobContext) decide
 * how to act on the result, typically by routing through confirmation
 * state when `requiresConfirmation` is true.
 */
export function processVoiceCommand(transcript: string, jobId: string | null = null): VoiceCommand {
  const trimmed = transcript.trim();
  const { intent, confidence } = extractIntent(trimmed);
  const entities = extractEntities(trimmed, intent);

  const requiresConfirmation =
    intent === 'unknown' || confidence < CONFIDENCE_THRESHOLD || ALWAYS_CONFIRM_INTENTS.has(intent);

  return {
    id: createId(),
    transcript: trimmed,
    intent,
    entities,
    confidence,
    requiresConfirmation,
    confirmationPrompt: requiresConfirmation ? buildConfirmationPrompt(intent, entities) : null,
    status: requiresConfirmation ? 'needs_confirmation' : 'pending',
    jobId,
    createdAt: new Date().toISOString(),
  };
}
