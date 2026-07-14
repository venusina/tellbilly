/**
 * Invoice helpers: numbering, totals math, and status formatting.
 *
 * Kept framework-free (no Supabase/React imports) so it can be unit tested
 * in isolation and reused from both the client and any future server code.
 */

import { Colors } from '@/theme';
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@/types';

// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------

/**
 * Generates the next sequential invoice number for a given year, formatted
 * as `INV-<year>-<4-digit sequence>` (e.g. "INV-2026-0007").
 *
 * `existingInvoiceNumbers` should be every invoice number already issued
 * (any year) — pass `invoices.map(i => i.invoiceNumber)`. Only numbers
 * matching the target year are considered when computing the next sequence,
 * so numbering restarts at 0001 each year.
 */
export function generateInvoiceNumber(
  existingInvoiceNumbers: string[],
  date: Date = new Date()
): string {
  const year = date.getFullYear();
  const pattern = new RegExp(`^INV-${year}-(\\d+)$`);

  const highestSequence = existingInvoiceNumbers.reduce((highest, invoiceNumber) => {
    const match = invoiceNumber.match(pattern);
    if (!match) return highest;
    return Math.max(highest, Number.parseInt(match[1], 10));
  }, 0);

  const nextSequence = highestSequence + 1;
  return `INV-${year}-${String(nextSequence).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export function calculateLineItemTotal(lineItem: InvoiceLineItem): number {
  return roundCurrency(lineItem.quantity * lineItem.unitPrice);
}

export function calculateSubtotal(lineItems: InvoiceLineItem[]): number {
  return roundCurrency(lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item), 0));
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return roundCurrency(subtotal * taxRate);
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/** Derives subtotal/tax/total from line items + tax rate in one pass. */
export function calculateInvoiceTotals(lineItems: InvoiceLineItem[], taxRate: number): InvoiceTotals {
  const subtotal = calculateSubtotal(lineItems);
  const taxAmount = calculateTax(subtotal, taxRate);
  return { subtotal, taxAmount, total: roundCurrency(subtotal + taxAmount) };
}

/** Avoids floating-point drift (e.g. 19.999999999998) in money math. */
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

export function formatInvoiceStatus(status: InvoiceStatus): string {
  return STATUS_LABELS[status];
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: Colors.neutral[500],
  sent: Colors.primary,
  paid: Colors.success,
  overdue: Colors.error,
  void: Colors.neutral[300],
};

/** Maps an invoice status to its theme color, for badges/chips. */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  return STATUS_COLORS[status];
}

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------

/**
 * An invoice is overdue when it's still unpaid and past its due date. This
 * is a read-time derivation rather than a stored flag, so it's always
 * accurate without a background job to flip statuses.
 */
export function isInvoiceOverdue(invoice: Pick<Invoice, 'status' | 'dueDate'>, now: Date = new Date()): boolean {
  if (invoice.status === 'paid' || invoice.status === 'void') return false;
  return new Date(invoice.dueDate).getTime() < now.getTime();
}

/** Resolves the status to display, applying the overdue derivation on top of the stored status. */
export function resolveDisplayStatus(invoice: Pick<Invoice, 'status' | 'dueDate'>, now: Date = new Date()): InvoiceStatus {
  return isInvoiceOverdue(invoice, now) ? 'overdue' : invoice.status;
}
