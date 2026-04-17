import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Layers, TrendingUp, CheckCircle, 
  Settings, LogOut, Bell, Menu, X, ChevronDown, Check, Plus,
  FileText, Rocket, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { CsvUploadModal } from '../components/modals/CsvUploadModal';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title, subtitle, actions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { workspaces, activeWorkspace, isLoadingWorkspace, setActiveWorkspace } = useWorkspace();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsWorkspaceDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Strictly MVP Core Loop Navigation
  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'Signals', path: '/app/signals', icon: Search },
    { name: 'Accounts', path: '/app/accounts', icon: Building2 },
    { name: 'Problems', path: '/app/problems', icon: Layers },
    { name: 'Opportunities', path: '/app/opportunities', icon: TrendingUp },
    { name: 'Decisions', path: '/app/decisions', icon: CheckCircle },
    { name: 'Artifacts', path: '/app/artifacts', icon: FileText },
    { name: 'Launches', path: '/app/launches', icon: Rocket },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const fullName = user?.user_metadata?.full_name || 'User';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const wsName = activeWorkspace?.name || 'Workspace';
  const wsInitials = wsName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-astrix-teal selection:text-white overflow-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Dark Sidebar */}
      <aside className={`w-64 bg-sidebar-dark border-r border-slate-800 fixed h-full flex flex-col z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <Link to="/app" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-md">
            <span className="font-heading text-lg font-black tracking-tighter text-white">ASTRIX AI</span>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 shrink-0 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sidebar-hover transition-colors border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {isLoadingWorkspace ? '...' : wsInitials}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white leading-tight truncate w-full text-left">
                  {isLoadingWorkspace ? 'Loading...' : wsName}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Workspace</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isWorkspaceDropdownOpen && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="max-h-64 overflow-y-auto py-2 hide-scrollbar">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setIsWorkspaceDropdownOpen(false);
                      navigate('/app');
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`text-sm font-medium truncate ${activeWorkspace?.id === ws.id ? 'text-astrix-teal font-bold' : 'text-slate-300'}`}>
                        {ws.name}
                      </span>
                    </div>
                    {activeWorkspace?.id === ws.id && <Check className="w-4 h-4 text-astrix-teal shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal ${
                  isActive 
                    ? 'bg-sidebar-active text-white shadow-md' 
                    : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sidebar-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white leading-tight truncate w-full text-left">{fullName}</span>
                <span className="text-xs text-slate-400 truncate w-full text-left">{user?.email}</span>
              </div>
            </div>
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-brand-red transition-colors shrink-0 ml-2" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen w-full md:ml-64 transition-all duration-300">
        
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="font-heading text-xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500 font-medium truncate">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {actions && <div className="hidden sm:block">{actions}</div>}
            <div className="h-6 w-[1px] bg-gray-200 mx-1 md:mx-2 hidden sm:block"></div>
            <button className="text-gray-400 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-full p-1.5 md:p-1 relative">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="sm:hidden px-4 pt-4 pb-2 bg-white border-b border-gray-100">
          <h1 className="font-heading text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>}
          {actions && <div className="mt-3">{actions}</div>}
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto animate-[fadeIn_0.4s_ease-out]">
            {children}
          </div>
        </div>

      </main>
      
      {/* Global Modals */}
      <CsvUploadModal />
    </div>
  );
};
