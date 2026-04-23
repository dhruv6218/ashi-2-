// Edge Function: ingest-signals-csv
// Parses and imports a signals CSV that was uploaded to Supabase Storage
// POST /functions/v1/ingest-signals-csv
// Body: { workspace_id, storage_path, upload_id }
// Auth: Bearer token required; caller must be workspace member

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  getAuthUser,
  getWorkspaceMembership,
  logActivity,
  trackUsage,
} from '../_shared/utils.ts';

// Expected CSV columns (case-insensitive)
const REQUIRED_COLS = ['raw_text', 'source_type'];
const OPTIONAL_COLS = [
  'account_domain', 'account_name',
  'sentiment_label', 'severity_label',
  'category', 'product_area',
  'source_metadata',
];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Simple CSV parse (handles quoted fields)
  function parseRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseRow(lines[0]).map(normalizeHeader);
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });
    return row;
  });
  return { headers, rows };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const user = await getAuthUser(req, supabase);
  if (!user) return errorResponse('Unauthorized', 401);

  let body: { workspace_id: string; storage_path: string; upload_id: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, storage_path, upload_id } = body;
  if (!workspace_id || !storage_path || !upload_id) {
    return errorResponse('workspace_id, storage_path, and upload_id are required');
  }

  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership) return errorResponse('Not a workspace member', 403);

  // Mark upload as processing
  await supabase
    .from('file_uploads')
    .update({ status: 'processing' })
    .eq('id', upload_id)
    .eq('workspace_id', workspace_id);

  // Download CSV from storage
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from('uploads')
    .download(storage_path);

  if (downloadErr || !fileData) {
    await supabase.from('file_uploads').update({ status: 'failed', error_details: { message: 'Could not download file' } }).eq('id', upload_id);
    return errorResponse('Could not retrieve uploaded file', 500);
  }

  const csvText = await fileData.text();
  const { headers, rows } = parseCsv(csvText);

  // Validate required columns
  const missingCols = REQUIRED_COLS.filter(c => !headers.includes(c));
  if (missingCols.length > 0) {
    const detail = { message: `Missing required columns: ${missingCols.join(', ')}`, required: REQUIRED_COLS, optional: OPTIONAL_COLS };
    await supabase.from('file_uploads').update({ status: 'failed', total_rows: rows.length, success_rows: 0, failed_rows: rows.length, error_details: detail }).eq('id', upload_id);
    return errorResponse(`Missing required columns: ${missingCols.join(', ')}`);
  }

  // Look up accounts by domain for linking
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('id, domain, name')
    .eq('workspace_id', workspace_id);
  const accountsByDomain: Record<string, string> = {};
  const accountsByName: Record<string, string> = {};
  for (const a of (accountsData ?? [])) {
    if (a.domain) accountsByDomain[a.domain.toLowerCase()] = a.id;
    if (a.name) accountsByName[a.name.toLowerCase()] = a.id;
  }

  const VALID_SENTIMENTS = ['Positive', 'Neutral', 'Negative', 'Mixed'];
  const VALID_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'];

  let successRows = 0;
  let failedRows = 0;
  const rowErrors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed, +1 for header

    if (!row.raw_text || !row.source_type) {
      rowErrors.push({ row: rowNum, error: 'raw_text and source_type are required' });
      failedRows++;
      continue;
    }

    // Resolve account
    let accountId: string | null = null;
    const domain = (row.account_domain ?? '').trim().toLowerCase();
    const name = (row.account_name ?? '').trim().toLowerCase();
    if (domain && accountsByDomain[domain]) {
      accountId = accountsByDomain[domain];
    } else if (name && accountsByName[name]) {
      accountId = accountsByName[name];
    }

    const sentiment = VALID_SENTIMENTS.includes(row.sentiment_label) ? row.sentiment_label : null;
    const severity = VALID_SEVERITIES.includes(row.severity_label) ? row.severity_label : null;

    const { error: insertErr } = await supabase.from('signals').insert({
      workspace_id,
      account_id: accountId,
      source_type: row.source_type,
      raw_text: row.raw_text,
      sentiment_label: sentiment,
      severity_label: severity,
      category: row.category || null,
      product_area: row.product_area || null,
      created_by: user.id,
    });

    if (insertErr) {
      rowErrors.push({ row: rowNum, error: insertErr.message });
      failedRows++;
    } else {
      successRows++;
    }
  }

  const finalStatus = failedRows === rows.length ? 'failed' : 'complete';
  await supabase.from('file_uploads').update({
    status: finalStatus,
    total_rows: rows.length,
    success_rows: successRows,
    failed_rows: failedRows,
    error_details: rowErrors.length > 0 ? { row_errors: rowErrors.slice(0, 100) } : null,
    completed_at: new Date().toISOString(),
  }).eq('id', upload_id);

  await trackUsage(supabase, { workspace_id, user_id: user.id, event_type: 'csv_upload', feature: 'signals_csv' });

  await logActivity(supabase, {
    workspace_id,
    actor_id: user.id,
    event_type: finalStatus === 'complete' ? 'csv_import_complete' : 'csv_import_failed',
    entity_type: 'file_upload',
    entity_id: upload_id,
    metadata: { total: rows.length, success: successRows, failed: failedRows },
  });

  return jsonResponse({ total_rows: rows.length, success_rows: successRows, failed_rows: failedRows, errors: rowErrors.slice(0, 20) });
});
