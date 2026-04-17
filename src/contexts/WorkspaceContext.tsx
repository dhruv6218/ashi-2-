import { useAuth } from './AuthContext';
import { MOCK_WORKSPACE } from '../lib/mockData';
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
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsWorkspaceInitializing(false);
      return;
    }

    setIsWorkspaceInitializing(true);
    
    // Simulate Supabase async fetch
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const fetchedWorkspaces = [{
      ...MOCK_WORKSPACE,
      product_areas: ['Authentication', 'Core UI', 'API', 'Billing'],
      segments: ['Enterprise', 'SMB', 'Growth']
    }];
    setWorkspaces(fetchedWorkspaces);
    setActiveWorkspace(fetchedWorkspaces[0]);

    setIsWorkspaceInitializing(false);
  };

  const handleSetActiveWorkspace = (ws: Workspace) => {
    setActiveWorkspace(ws);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      workspaces,
      isWorkspaceInitializing,
      setActiveWorkspace: handleSetActiveWorkspace,
      refreshWorkspaces: fetchWorkspaces
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
