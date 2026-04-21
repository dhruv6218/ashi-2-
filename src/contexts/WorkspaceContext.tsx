import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Workspace } from '../types';

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  isWorkspaceInitializing: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: null,
  workspaces: [],
  isWorkspaceInitializing: true,
  setActiveWorkspace: () => {},
  refreshWorkspaces: async () => {},
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setIsWorkspaceInitializing(false);
      return;
    }

    setIsWorkspaceInitializing(true);

    try {
      // Fetch workspaces where the user is a member, via workspace_members join
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspaces:workspace_id (
            id, name, slug, timezone, logo_url, owner_id, onboarding_done, created_at, updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('WorkspaceContext fetch error:', error);
        setWorkspaces([]);
        setActiveWorkspaceState(null);
        return;
      }

      // Flatten the join result
      const fetchedWorkspaces: Workspace[] = (data ?? [])
        .map((row: any) => row.workspaces)
        .filter(Boolean);

      // Fetch product_areas and segments for each workspace
      const enriched = await Promise.all(
        fetchedWorkspaces.map(async (ws) => {
          const [{ data: areas }, { data: segs }] = await Promise.all([
            supabase.from('product_areas').select('name').eq('workspace_id', ws.id),
            supabase.from('segments').select('name').eq('workspace_id', ws.id),
          ]);
          return {
            ...ws,
            product_areas: (areas ?? []).map((a: any) => a.name),
            segments: (segs ?? []).map((s: any) => s.name),
          };
        }),
      );

      setWorkspaces(enriched);

      // Keep current active workspace, or default to first
      setActiveWorkspaceState(prev => {
        if (prev) {
          const updated = enriched.find(w => w.id === prev.id);
          return updated ?? (enriched[0] ?? null);
        }
        return enriched[0] ?? null;
      });
    } finally {
      setIsWorkspaceInitializing(false);
    }
  }, [user]);

  const handleSetActiveWorkspace = (ws: Workspace) => {
    setActiveWorkspaceState(ws);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      workspaces,
      isWorkspaceInitializing,
      setActiveWorkspace: handleSetActiveWorkspace,
      refreshWorkspaces: fetchWorkspaces,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
