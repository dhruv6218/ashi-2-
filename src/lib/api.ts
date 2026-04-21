import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Signal, Account, Problem, Opportunity, Decision, Artifact, Launch, TeamMember, WorkspaceInvite } from '../types';

// ---------------------------------------------------------------------------
// Global event to trigger refetches across hooks (simulates React Query invalidateQueries)
// ---------------------------------------------------------------------------
export const triggerUpdate = () => window.dispatchEvent(new Event('data-updated'));

// ---------------------------------------------------------------------------
// Real Supabase API Layer
// ---------------------------------------------------------------------------
export const api = {
  signals: {
    list: async (wsId: string, opts?: any) => {
      let query = supabase
        .from('signals')
        .select('*, accounts:account_id(name, arr, plan)', { count: 'exact' })
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });

      if (opts?.globalFilter) {
        query = query.or(`raw_text.ilike.%${opts.globalFilter}%`);
      }

      if (opts?.limit && opts?.page) {
        const start = (opts.page - 1) * opts.limit;
        query = query.range(start, start + opts.limit - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },

    create: async (data: Partial<Signal>) => {
      const { data: created, error } = await supabase
        .from('signals')
        .insert(data)
        .select('*, accounts:account_id(name, arr, plan)')
        .single();
      if (error) throw error;
      triggerUpdate();
      return created;
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('signals')
        .select('*, accounts:account_id(name, arr, plan)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  },

  accounts: {
    list: async (wsId: string, opts?: any) => {
      let query = supabase
        .from('accounts')
        .select('*', { count: 'exact' })
        .eq('workspace_id', wsId)
        .order('arr', { ascending: false });

      if (opts?.globalFilter) {
        query = query.or(`name.ilike.%${opts.globalFilter}%,domain.ilike.%${opts.globalFilter}%`);
      }

      if (opts?.sorting?.length > 0) {
        const sort = opts.sorting[0];
        query = query.order(sort.id, { ascending: !sort.desc });
      }

      if (opts?.limit && opts?.page) {
        const start = (opts.page - 1) * opts.limit;
        query = query.range(start, start + opts.limit - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },

    create: async (data: Partial<Account>) => {
      const { data: created, error } = await supabase
        .from('accounts')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      triggerUpdate();
      return created;
    },

    get: async (id: string) => {
      const [{ data: account }, { data: signals }, { data: problems }] = await Promise.all([
        supabase.from('accounts').select('*').eq('id', id).single(),
        supabase.from('signals').select('*').eq('account_id', id).order('created_at', { ascending: false }),
        supabase
          .from('problems')
          .select('id, title, status, severity, evidence_count, affected_arr')
          .eq('workspace_id', (await supabase.from('accounts').select('workspace_id').eq('id', id).single()).data?.workspace_id)
          .order('evidence_count', { ascending: false })
          .limit(5),
      ]);
      return { account, signals: signals ?? [], problems: problems ?? [] };
    },
  },

  problems: {
    list: async (wsId: string) => {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('workspace_id', wsId)
        .order('evidence_count', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    get: async (id: string) => {
      const [{ data: problem }, { data: links }] = await Promise.all([
        supabase.from('problems').select('*').eq('id', id).single(),
        supabase
          .from('problem_signal_links')
          .select('signals:signal_id(*, accounts:account_id(name, arr, plan))')
          .eq('problem_id', id),
      ]);
      const signals = (links ?? []).map((l: any) => l.signals).filter(Boolean);
      const accountIds = [...new Set(signals.map((s: any) => s.account_id).filter(Boolean))];
      const { data: accounts } = accountIds.length > 0
        ? await supabase.from('accounts').select('*').in('id', accountIds)
        : { data: [] };
      return { problem, signals, accounts: accounts ?? [] };
    },

    create: async (data: Partial<Problem>) => {
      const { data: created, error } = await supabase
        .from('problems')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      triggerUpdate();
      return created;
    },

    linkSignal: async (problemId: string, signalId: string, workspaceId: string) => {
      const { error } = await supabase.from('problem_signal_links').insert({
        problem_id: problemId,
        signal_id: signalId,
        workspace_id: workspaceId,
      });
      if (error) throw error;
      triggerUpdate();
    },

    unlinkSignal: async (problemId: string, signalId: string) => {
      const { error } = await supabase
        .from('problem_signal_links')
        .delete()
        .eq('problem_id', problemId)
        .eq('signal_id', signalId);
      if (error) throw error;
      triggerUpdate();
    },
  },

  opportunities: {
    list: async (wsId: string) => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, problems:problem_id(id, title, evidence_count, affected_arr)')
        .eq('workspace_id', wsId)
        .order('opportunity_score', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, problems:problem_id(id, title, description, severity, evidence_count, affected_arr)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    recalculate: async (workspaceId: string, problemId: string) => {
      const { data, error } = await supabase.functions.invoke('score-opportunity', {
        body: { workspace_id: workspaceId, problem_id: problemId },
      });
      if (error) throw error;
      triggerUpdate();
      return data;
    },
  },

  decisions: {
    list: async (wsId: string) => {
      const { data, error } = await supabase
        .from('decisions')
        .select('*, users:author_id(full_name)')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('decisions')
        .select(`
          *,
          users:author_id(full_name),
          problems:problem_id(id, title, severity, evidence_count, affected_arr),
          opportunities:opportunity_id(id, opportunity_score, recommended_action, score_breakdown)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    create: async (data: Partial<Decision>) => {
      const { data: created, error } = await supabase
        .from('decisions')
        .insert(data)
        .select('*, users:author_id(full_name)')
        .single();
      if (error) throw error;
      triggerUpdate();
      return created;
    },
  },

  artifacts: {
    list: async (wsId: string) => {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*, users:author_id(full_name), decisions:decision_id(title)')
        .eq('workspace_id', wsId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    create: async (data: Partial<Artifact>) => {
      const { data: created, error } = await supabase
        .from('artifacts')
        .insert(data)
        .select('*, users:author_id(full_name), decisions:decision_id(title)')
        .single();
      if (error) throw error;
      triggerUpdate();
      return created;
    },

    update: async (id: string, data: Partial<Artifact>) => {
      const { error } = await supabase
        .from('artifacts')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      triggerUpdate();
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*, users:author_id(full_name), decisions:decision_id(title)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    generate: async (workspaceId: string, decisionId: string, artifactType: string) => {
      const { data, error } = await supabase.functions.invoke('generate-artifact', {
        body: { workspace_id: workspaceId, decision_id: decisionId, artifact_type: artifactType },
      });
      if (error) throw error;
      return data;
    },

    pushToJira: async (workspaceId: string, artifactId: string) => {
      const { data, error } = await supabase.functions.invoke('jira-push', {
        body: { workspace_id: workspaceId, artifact_id: artifactId },
      });
      if (error) throw error;
      triggerUpdate();
      return data;
    },
  },

  launches: {
    list: async (wsId: string) => {
      const { data, error } = await supabase
        .from('launches')
        .select(`
          *,
          decisions:decision_id(title, action),
          launch_reviews(*),
          launch_verdicts(verdict)
        `)
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    get: async (id: string) => {
      const { data, error } = await supabase
        .from('launches')
        .select(`
          *,
          decisions:decision_id(title, action, rationale),
          problems:problem_id(title, severity, affected_arr),
          launch_reviews(*),
          launch_verdicts(*),
          proof_summaries(summary)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    create: async (data: Partial<Launch>) => {
      const { data: created, error } = await supabase
        .from('launches')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      triggerUpdate();
      return created;
    },

    update: async (id: string, data: Partial<Launch>) => {
      const { error } = await supabase
        .from('launches')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      triggerUpdate();
    },

    submitReview: async (reviewData: {
      launch_id: string;
      workspace_id: string;
      checkpoint: string;
      baseline_signal_count: number;
      current_signal_count: number;
      affected_arr_before: number;
      affected_arr_after: number;
      affected_accounts_before: number;
      affected_accounts_after: number;
      pm_notes?: string;
      reviewed_by: string;
    }) => {
      const { data, error } = await supabase
        .from('launch_reviews')
        .insert(reviewData)
        .select()
        .single();
      if (error) throw error;
      triggerUpdate();
      return data;
    },

    submitVerdict: async (verdictData: {
      launch_id: string;
      workspace_id: string;
      verdict: string;
      notes?: string;
      submitted_by: string;
    }) => {
      const { data, error } = await supabase
        .from('launch_verdicts')
        .insert(verdictData)
        .select()
        .single();
      if (error) throw error;
      triggerUpdate();
      return data;
    },

    generateProofSummary: async (workspaceId: string, launchId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-proof-summary', {
        body: { workspace_id: workspaceId, launch_id: launchId },
      });
      if (error) throw error;
      triggerUpdate();
      return data;
    },
  },

  team: {
    list: async (wsId: string) => {
      const [{ data: membersData }, { data: invitesData }] = await Promise.all([
        supabase
          .from('workspace_members')
          .select('*, users:user_id(full_name, email, avatar_url)')
          .eq('workspace_id', wsId)
          .order('joined_at', { ascending: true }),
        supabase
          .from('invitations')
          .select('*')
          .eq('workspace_id', wsId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);
      return {
        members: (membersData ?? []) as TeamMember[],
        invites: (invitesData ?? []) as WorkspaceInvite[],
      };
    },

    invite: async (wsId: string, email: string, role: string) => {
      const { data, error } = await supabase.functions.invoke('invite-create', {
        body: { workspace_id: wsId, email, role },
      });
      if (error) throw error;
      triggerUpdate();
      return data;
    },

    cancelInvite: async (inviteId: string) => {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', inviteId);
      if (error) throw error;
      triggerUpdate();
    },

    removeMember: async (memberId: string) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      triggerUpdate();
    },
  },

  workspace: {
    create: async (data: { name: string; slug: string; timezone: string; owner_id: string }) => {
      const { data: created, error } = await supabase
        .from('workspaces')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return created;
    },

    update: async (id: string, data: Partial<{ name: string; timezone: string; logo_url: string; onboarding_done: boolean }>) => {
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },

    addProductArea: async (workspaceId: string, name: string) => {
      const { error } = await supabase
        .from('product_areas')
        .insert({ workspace_id: workspaceId, name });
      if (error) throw error;
      triggerUpdate();
    },

    removeProductArea: async (workspaceId: string, name: string) => {
      const { error } = await supabase
        .from('product_areas')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('name', name);
      if (error) throw error;
      triggerUpdate();
    },

    addSegment: async (workspaceId: string, name: string) => {
      const { error } = await supabase
        .from('segments')
        .insert({ workspace_id: workspaceId, name });
      if (error) throw error;
      triggerUpdate();
    },

    removeSegment: async (workspaceId: string, name: string) => {
      const { error } = await supabase
        .from('segments')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('name', name);
      if (error) throw error;
      triggerUpdate();
    },
  },

  uploads: {
    uploadCsv: async (
      workspaceId: string,
      userId: string,
      file: File,
      uploadType: 'signals_csv' | 'accounts_csv',
    ) => {
      const storagePath = `${workspaceId}/${uploadType}/${Date.now()}_${file.name}`;

      // 1. Upload file to private storage bucket
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file, { contentType: 'text/csv', upsert: false });
      if (uploadError) throw uploadError;

      // 2. Create a file_upload record to track ingestion status
      const { data: uploadRecord, error: recordError } = await supabase
        .from('file_uploads')
        .insert({
          workspace_id: workspaceId,
          uploaded_by: userId,
          upload_type: uploadType,
          storage_path: storagePath,
          original_name: file.name,
          file_size_bytes: file.size,
          status: 'pending',
        })
        .select()
        .single();
      if (recordError) throw recordError;

      // 3. Trigger the appropriate ingestion Edge Function
      const functionName = uploadType === 'signals_csv' ? 'ingest-signals-csv' : 'ingest-accounts-csv';
      const { data: result, error: fnError } = await supabase.functions.invoke(functionName, {
        body: { workspace_id: workspaceId, storage_path: storagePath, upload_id: uploadRecord.id },
      });
      if (fnError) throw fnError;

      triggerUpdate();
      return result;
    },
  },

  subscription: {
    get: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan_limits:plan_type(*)')
        .eq('workspace_id', workspaceId)
        .single();
      if (error) return null;
      return data;
    },
  },

  notifications: {
    list: async (userId: string, unreadOnly = false) => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (unreadOnly) query = query.eq('read', false);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    markRead: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },

    markAllRead: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
    },
  },

  activityLog: {
    list: async (workspaceId: string, limit = 50) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, actors:actor_id(full_name, email)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  },
};

// ---------------------------------------------------------------------------
// REACT SERVER-STATE HOOKS
// ---------------------------------------------------------------------------

export function useQuery<T>(fetcher: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('useQuery error:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    window.addEventListener('data-updated', execute);
    return () => window.removeEventListener('data-updated', execute);
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}

export const useSignals = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.signals.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useSignal = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.signals.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useAccounts = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.accounts.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useAccount = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.accounts.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useProblems = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.problems.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useProblem = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.problems.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useOpportunities = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.opportunities.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useOpportunity = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.opportunities.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useDecisions = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.decisions.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useDecision = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.decisions.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useArtifacts = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.artifacts.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useArtifact = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.artifacts.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useLaunches = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.launches.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useTeam = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { members: [], invites: [] };
    return api.team.list(wsId);
  }, [wsId]);
  return { data: data || { members: [], invites: [] }, isLoading, refetch };
};

export const useSubscription = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return null;
    return api.subscription.get(wsId);
  }, [wsId]);
  return { data, isLoading };
};

export const useNotifications = (userId?: string, unreadOnly = false) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!userId) return [];
    return api.notifications.list(userId, unreadOnly);
  }, [userId, unreadOnly]);
  return { data: data || [], isLoading, refetch };
};

export const useActivityLog = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.activityLog.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

// Simulate network latency
const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

// Isolated Mock Database (Replaces global Zustand arrays)
export const mockDb = {
  signals: [...mocks.MOCK_SIGNALS] as Signal[],
  accounts: [...mocks.MOCK_ACCOUNTS] as Account[],
  problems: [...mocks.MOCK_PROBLEMS] as Problem[],
  opportunities: [...mocks.MOCK_OPPORTUNITIES] as Opportunity[],
  decisions: [...mocks.MOCK_DECISIONS] as Decision[],
  artifacts: [...mocks.MOCK_ARTIFACTS] as Artifact[],
  launches: [...mocks.MOCK_LAUNCHES] as Launch[],
  members: [...mocks.MOCK_MEMBERS] as TeamMember[],
  invites: [] as WorkspaceInvite[]
};

// Global event to trigger refetches across hooks (simulates React Query invalidateQueries)
export const triggerUpdate = () => window.dispatchEvent(new Event('data-updated'));

// Simulated Supabase API Layer
export const api = {
  signals: {
    list: async (wsId: string, opts?: any) => {
      await delay(300);
      let res = mockDb.signals.filter(s => s.workspace_id === wsId);
      if (opts?.globalFilter) {
        const q = opts.globalFilter.toLowerCase();
        res = res.filter(s => s.raw_text.toLowerCase().includes(q) || s.accounts?.name.toLowerCase().includes(q));
      }
      if (opts?.sorting?.length > 0) {
        const sort = opts.sorting[0];
        res.sort((a: any, b: any) => {
          if (a[sort.id] < b[sort.id]) return sort.desc ? 1 : -1;
          if (a[sort.id] > b[sort.id]) return sort.desc ? -1 : 1;
          return 0;
        });
      }
      const total = res.length;
      if (opts?.page && opts?.limit) {
        const start = (opts.page - 1) * opts.limit;
        res = res.slice(start, start + opts.limit);
      }
      return { rows: res, total };
    },
    create: async (data: Partial<Signal>) => {
      await delay();
      const newItem = { ...data, id: `sig-${Date.now()}`, created_at: new Date().toISOString() } as Signal;
      mockDb.signals = [newItem, ...mockDb.signals];
      triggerUpdate();
      return newItem;
    },
    get: async (id: string) => {
      await delay();
      const signal = mockDb.signals.find(s => s.id === id);
      const account = signal?.account_id ? mockDb.accounts.find(a => a.id === signal.account_id) : null;
      return { ...signal, accounts: account };
    }
  },
  accounts: {
    list: async (wsId: string, opts?: any) => {
      await delay(300);
      let res = mockDb.accounts.filter(a => a.workspace_id === wsId);
      if (opts?.globalFilter) {
        const q = opts.globalFilter.toLowerCase();
        res = res.filter(a => a.name.toLowerCase().includes(q) || (a.domain && a.domain.toLowerCase().includes(q)));
      }
      if (opts?.sorting?.length > 0) {
        const sort = opts.sorting[0];
        res.sort((a: any, b: any) => {
          if (a[sort.id] < b[sort.id]) return sort.desc ? 1 : -1;
          if (a[sort.id] > b[sort.id]) return sort.desc ? -1 : 1;
          return 0;
        });
      }
      const total = res.length;
      if (opts?.page && opts?.limit) {
        const start = (opts.page - 1) * opts.limit;
        res = res.slice(start, start + opts.limit);
      }
      return { rows: res, total };
    },
    create: async (data: Partial<Account>) => {
      await delay();
      const newItem = { ...data, id: `acc-${Date.now()}`, created_at: new Date().toISOString(), signal_count: 0 } as Account;
      mockDb.accounts = [newItem, ...mockDb.accounts];
      triggerUpdate();
      return newItem;
    },
    get: async (id: string) => {
      await delay();
      const account = mockDb.accounts.find(a => a.id === id);
      const signals = mockDb.signals.filter(s => s.account_id === id);
      const problems = mockDb.problems.filter(p => signals.some(s => s.normalized_text?.includes(p.title))); // Simple mock relation
      return { account, signals, problems };
    }
  },
  problems: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.problems.filter(p => p.workspace_id === wsId);
    },
    get: async (id: string) => {
      await delay();
      const problem = mockDb.problems.find(p => p.id === id);
      const signals = mockDb.signals.slice(0, 3); // Mock relation
      const accounts = mockDb.accounts.slice(0, 2); // Mock relation
      return { problem, signals, accounts };
    },
    create: async (data: Partial<Problem>) => {
      await delay();
      const newItem = { ...data, id: `prob-${Date.now()}`, created_at: new Date().toISOString(), evidence_count: 0, affected_arr: 0, status: 'Active', trend: 'Stable' } as Problem;
      mockDb.problems = [newItem, ...mockDb.problems];
      triggerUpdate();
      return newItem;
    }
  },
  opportunities: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.opportunities.filter(o => o.workspace_id === wsId);
    },
    get: async (id: string) => {
      await delay();
      return mockDb.opportunities.find(o => o.id === id);
    }
  },
  decisions: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.decisions.filter(d => d.workspace_id === wsId);
    },
    get: async (id: string) => {
      await delay();
      return mockDb.decisions.find(d => d.id === id);
    },
    create: async (data: Partial<Decision>) => {
      await delay();
      const newItem = { ...data, id: `dec-${Date.now()}`, created_at: new Date().toISOString(), users: { full_name: 'Demo User' } } as Decision;
      mockDb.decisions = [newItem, ...mockDb.decisions];
      triggerUpdate();
      return newItem;
    }
  },
  artifacts: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.artifacts.filter(a => a.workspace_id === wsId);
    },
    create: async (data: Partial<Artifact>) => {
      await delay();
      const newItem = { ...data, id: `art-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), users: { full_name: 'Demo User' } } as Artifact;
      mockDb.artifacts = [newItem, ...mockDb.artifacts];
      triggerUpdate();
      return newItem;
    },
    update: async (id: string, data: Partial<Artifact>) => {
      await delay();
      mockDb.artifacts = mockDb.artifacts.map(a => a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a);
      triggerUpdate();
    },
    get: async (id: string) => {
      await delay();
      return mockDb.artifacts.find(a => a.id === id);
    }
  },
  launches: {
    list: async (wsId: string) => {
      await delay();
      return mockDb.launches.filter(l => l.workspace_id === wsId);
    },
    create: async (data: Partial<Launch>) => {
      await delay();
      const newItem = { ...data, id: `launch-${Date.now()}`, created_at: new Date().toISOString(), status: 'active' } as Launch;
      mockDb.launches = [newItem, ...mockDb.launches];
      triggerUpdate();
      return newItem;
    },
    update: async (id: string, data: Partial<Launch>) => {
      await delay();
      mockDb.launches = mockDb.launches.map(l => l.id === id ? { ...l, ...data } : l);
      triggerUpdate();
    }
  },
  team: {
    list: async (wsId: string) => {
      await delay();
      return {
         members: mockDb.members.filter(m => m.workspace_id === wsId),
         invites: mockDb.invites.filter(i => i.workspace_id === wsId)
      };
    },
    invite: async (wsId: string, email: string, role: string) => {
      await delay();
      const newInv = { id: `inv-${Date.now()}`, workspace_id: wsId, email, role, token: `tok-${Date.now()}`, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() };
      mockDb.invites = [...mockDb.invites, newInv];
      triggerUpdate();
    },
    removeMember: async (id: string) => {
      await delay();
      mockDb.members = mockDb.members.filter(m => m.id !== id);
      triggerUpdate();
    }
  }
};

// --- REACT SERVER-STATE HOOKS ---

export function useQuery<T>(fetcher: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const execute = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetcher();
      setData(res);
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
    window.addEventListener('data-updated', execute);
    return () => window.removeEventListener('data-updated', execute);
  }, [execute]);

  return { data, isLoading, refetch: execute };
}

export const useSignals = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.signals.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useSignal = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.signals.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useAccounts = (wsId?: string, opts?: any) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return { rows: [], total: 0 };
    return api.accounts.list(wsId, opts);
  }, [wsId, JSON.stringify(opts)]);
  return { data: data || { rows: [], total: 0 }, isLoading, refetch };
};

export const useAccount = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.accounts.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useProblems = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.problems.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useProblem = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.problems.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useOpportunities = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.opportunities.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useOpportunity = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.opportunities.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useDecisions = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.decisions.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useDecision = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.decisions.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useArtifacts = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.artifacts.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useArtifact = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    return api.artifacts.get(id);
  }, [id]);
  return { data, isLoading };
};

export const useLaunches = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.launches.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useTeam = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return { members: [], invites: [] };
    return api.team.list(wsId);
  }, [wsId]);
  return { data: data || { members: [], invites: [] }, isLoading };
};
