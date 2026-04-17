import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitializing } = useAuth();
  const { workspaces, isWorkspaceInitializing } = useWorkspace();
  const location = useLocation();

  // Block rendering until both Auth and Workspace hydration complete
  if (isInitializing || (user && isWorkspaceInitializing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAppRoute = location.pathname.startsWith('/app');
  if (isAppRoute && workspaces.length === 0) {
    return <Navigate to="/onboarding/step-1" replace />;
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (isOnboardingRoute && workspaces.length > 0) {
     return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
