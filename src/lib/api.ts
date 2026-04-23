import { useState, useEffect, useCallback } from 'react';
import * as mocks from './mockData';
import { Signal, Account, Problem, Opportunity, Decision, Artifact, Launch, TeamMember, WorkspaceInvite } from '../types';

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
    },
    update: async (id: string, data: Partial<Signal>) => {
      await delay();
      const idx = mockDb.signals.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Signal not found');
      mockDb.signals[idx] = { ...mockDb.signals[idx], ...data };
      triggerUpdate();
      return mockDb.signals[idx];
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
