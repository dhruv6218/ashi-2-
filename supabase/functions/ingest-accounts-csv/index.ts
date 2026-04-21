// Edge Function: ingest-accounts-csv
// Parses and imports an accounts CSV uploaded to Supabase Storage
// POST /functions/v1/ingest-accounts-csv
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

const REQUIRED_COLS = ['name'];
const OPTIONAL_COLS = ['domain', 'arr', 'plan', 'segment', 'health_score', 'churn_risk', 'renewal_date', 'notes'];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

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

  await supabase.from('file_uploads').update({ status: 'processing' }).eq('id', upload_id).eq('workspace_id', workspace_id);

  const { data: fileData, error: downloadErr } = await supabase.storage.from('uploads').download(storage_path);
  if (downloadErr || !fileData) {
    await supabase.from('file_uploads').update({ status: 'failed', error_details: { message: 'Could not download file' } }).eq('id', upload_id);
    return errorResponse('Could not retrieve uploaded file', 500);
  }

  const csvText = await fileData.text();
  const { headers, rows } = parseCsv(csvText);

  const missingCols = REQUIRED_COLS.filter(c => !headers.includes(c));
  if (missingCols.length > 0) {
    const detail = { message: `Missing required columns: ${missingCols.join(', ')}`, required: REQUIRED_COLS, optional: OPTIONAL_COLS };
    await supabase.from('file_uploads').update({ status: 'failed', total_rows: rows.length, success_rows: 0, failed_rows: rows.length, error_details: detail }).eq('id', upload_id);
    return errorResponse(`Missing required columns: ${missingCols.join(', ')}`);
  }

  const VALID_CHURN_RISKS = ['low', 'medium', 'high', 'critical'];

  let successRows = 0;
  let failedRows = 0;
  const rowErrors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.name) {
      rowErrors.push({ row: rowNum, error: 'name is required' });
      failedRows++;
      continue;
    }

    const arr = row.arr ? parseFloat(row.arr.replace(/[$,]/g, '')) : 0;
    const healthScore = row.health_score ? parseFloat(row.health_score) : null;
    const churnRisk = VALID_CHURN_RISKS.includes((row.churn_risk ?? '').toLowerCase())
      ? (row.churn_risk.toLowerCase() as string)
      : null;
    const renewalDate = row.renewal_date
      ? (isNaN(Date.parse(row.renewal_date)) ? null : row.renewal_date)
      : null;

    // Upsert by domain if domain exists, else insert
    const upsertData: Record<string, unknown> = {
      workspace_id,
      name: row.name,
      domain: row.domain || null,
      arr: isNaN(arr) ? 0 : arr,
      plan: row.plan || null,
      segment: row.segment || null,
      health_score: healthScore,
      churn_risk: churnRisk,
      renewal_date: renewalDate,
      notes: row.notes || null,
    };

    let insertError = null;
    if (row.domain) {
      const { error } = await supabase
        .from('accounts')
        .upsert({ ...upsertData }, { onConflict: 'workspace_id,domain' });
      insertError = error;
    } else {
      const { error } = await supabase.from('accounts').insert(upsertData);
      insertError = error;
    }

    if (insertError) {
      rowErrors.push({ row: rowNum, error: insertError.message });
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

  await trackUsage(supabase, { workspace_id, user_id: user.id, event_type: 'csv_upload', feature: 'accounts_csv' });
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
