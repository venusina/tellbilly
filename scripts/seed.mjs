#!/usr/bin/env node
/**
 * Seeds a test account with sample clients, jobs, expenses, and invoices —
 * for trying out the app or writing tests without hand-entering data.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (see .env.example): the service role
 * key bypasses row-level security, which is what lets this script assign
 * every row to the seed user explicitly instead of relying on an
 * authenticated session. Run with `npm run seed`.
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnvLocal();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedEmail = process.env.SEED_USER_EMAIL ?? 'seed@tellbilly.test';
const seedPassword = process.env.SEED_USER_PASSWORD ?? 'tellbilly-seed-password';

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Copy .env.example to .env.local and fill in your Supabase project values first.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getOrCreateSeedUser() {
  // The admin API lists users a page at a time; a handful of seed runs won't
  // exceed the default page size, so one page is enough to find a match.
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const found = existing.users.find((user) => user.email === seedEmail);
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedEmail,
    password: seedPassword,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

/** Clears this seed user's previous rows so re-running produces a consistent dataset. */
async function clearExistingData(userId) {
  await supabase.from('invoices').delete().eq('user_id', userId);
  await supabase.from('expenses').delete().eq('user_id', userId);
  await supabase.from('jobs').delete().eq('user_id', userId);
  await supabase.from('clients').delete().eq('user_id', userId);
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function seedClients(userId) {
  const { data, error } = await supabase
    .from('clients')
    .insert([
      { user_id: userId, name: 'Maria Alvarez', email: 'maria@example.com', phone: '555-0101', address: '12 Birchwood Ave' },
      { user_id: userId, name: 'Dan Whitfield', email: 'dan@example.com', phone: '555-0142', address: '88 Larch St' },
      { user_id: userId, name: 'Priya Natarajan', email: null, phone: '555-0110', address: '4 Cedar Ct' },
    ])
    .select();

  if (error) throw error;
  return data;
}

async function seedJobs(userId, clients) {
  const [maria, dan, priya] = clients;

  const { data, error } = await supabase
    .from('jobs')
    .insert([
      {
        user_id: userId,
        client_id: maria.id,
        title: 'Kitchen faucet replacement',
        work_status: 'done',
        payment_status: 'paid',
        quoted_amount: 320,
        completed_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        client_id: dan.id,
        title: 'Deck rebuild',
        work_status: 'in-progress',
        payment_status: 'awaiting-payment',
        quoted_amount: 4200,
      },
      {
        user_id: userId,
        client_id: priya.id,
        title: 'Water heater install',
        work_status: 'done',
        payment_status: 'awaiting-payment',
        quoted_amount: 1150,
        completed_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

async function seedExpenses(userId, jobs) {
  const [faucetJob, deckJob, heaterJob] = jobs;

  const { error } = await supabase.from('expenses').insert([
    { user_id: userId, job_id: faucetJob.id, description: 'Faucet + fittings', amount: 64.5, category: 'materials' },
    { user_id: userId, job_id: deckJob.id, description: 'Pressure-treated lumber', amount: 890, category: 'materials' },
    { user_id: userId, job_id: deckJob.id, description: 'Dump run', amount: 45, category: 'travel' },
    { user_id: userId, job_id: heaterJob.id, description: '50-gal water heater unit', amount: 610, category: 'materials' },
  ]);

  if (error) throw error;
}

async function seedInvoices(userId, jobs) {
  const [faucetJob, , heaterJob] = jobs;

  const { error } = await supabase.from('invoices').insert([
    {
      user_id: userId,
      job_id: faucetJob.id,
      invoice_number: 'INV-2026-0001',
      status: 'paid',
      line_items: [{ id: '1', description: 'Kitchen faucet replacement', quantity: 1, unitPrice: 320 }],
      subtotal: 320,
      tax_rate: 0,
      tax_amount: 0,
      total: 320,
      due_date: daysFromNow(-7),
      paid_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      job_id: heaterJob.id,
      invoice_number: 'INV-2026-0002',
      status: 'sent',
      line_items: [{ id: '1', description: 'Water heater install', quantity: 1, unitPrice: 1150 }],
      subtotal: 1150,
      tax_rate: 0.0825,
      tax_amount: 94.88,
      total: 1244.88,
      due_date: daysFromNow(14),
    },
  ]);

  if (error) throw error;
}

async function seed() {
  const userId = await getOrCreateSeedUser();
  console.log(`Seeding data for ${seedEmail} (${userId})...`);

  await clearExistingData(userId);

  const clients = await seedClients(userId);
  const jobs = await seedJobs(userId, clients);
  await seedExpenses(userId, jobs);
  await seedInvoices(userId, jobs);

  console.log(`Seeded ${clients.length} clients, ${jobs.length} jobs, 4 expenses, 2 invoices.`);
  console.log(`Sign in with: ${seedEmail} / ${seedPassword}`);
}

/** Populates process.env from .env.local, without overriding vars already set (e.g. by a shell/CI). */
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
