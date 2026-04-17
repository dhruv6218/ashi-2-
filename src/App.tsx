import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useMousePosition } from './hooks/useMousePosition';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { KeyboardShortcuts } from './components/ui/KeyboardShortcuts';

// Public Pages
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { NotFound } from './pages/NotFound';

// Marketing & Legal Pages
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';

// Onboarding Pages
import { Step1Workspace } from './pages/onboarding/Step1Workspace';
import { Step2Data } from './pages/onboarding/Step2Data';
import { Step3Results } from './pages/onboarding/Step3Results';

// App Pages
import { Dashboard } from './pages/app/Dashboard';
import { SignalExplorer } from './pages/app/SignalExplorer';
import { AccountsList } from './pages/app/AccountsList';
import { ProblemsList } from './pages/app/ProblemsList';
import { ProblemDetail } from './pages/app/ProblemDetail';
import { OpportunitiesList } from './pages/app/OpportunitiesList';
import { OpportunityDetail } from './pages/app/OpportunityDetail';
import { EvidenceView } from './pages/app/EvidenceView';
import { DecisionsHistory } from './pages/app/DecisionsHistory';
import { DecisionDetail } from './pages/app/DecisionDetail';
import { ArtifactStudio } from './pages/app/ArtifactStudio';
import { PostLaunchTracker } from './pages/app/PostLaunchTracker';
import { LaunchDetail } from './pages/app/LaunchDetail';
import { Settings } from './pages/app/Settings';
import { AccountDetail } from './pages/app/AccountDetail';
import { ArtifactDetail } from './pages/app/ArtifactDetail';
import { Navigate } from 'react-router-dom';

function App() {
  useMousePosition();

  return (
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <Router>
            <KeyboardShortcuts />
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Marketing & Legal */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              {/* Protected Onboarding Flow */}
              <Route path="/onboarding" element={<Navigate to="/onboarding/step-1" replace />} />
              <Route path="/onboarding/workspace" element={<Navigate to="/onboarding/step-1" replace />} />
              <Route path="/onboarding/step-1" element={<ProtectedRoute><Step1Workspace /></ProtectedRoute>} />
              <Route path="/onboarding/step-2" element={<ProtectedRoute><Step2Data /></ProtectedRoute>} />
              <Route path="/onboarding/step-3" element={<ProtectedRoute><Step3Results /></ProtectedRoute>} />

              {/* Protected Main App Routes */}
              <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/app/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="/app/signals" element={<ProtectedRoute><SignalExplorer /></ProtectedRoute>} />
              <Route path="/app/signals/new" element={<ProtectedRoute><SignalExplorer defaultOpenAdd /></ProtectedRoute>} />
              <Route path="/app/accounts" element={<ProtectedRoute><AccountsList /></ProtectedRoute>} />
              <Route path="/app/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
              
              <Route path="/app/problems" element={<ProtectedRoute><ProblemsList /></ProtectedRoute>} />
              <Route path="/app/problems/:id" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
              
              <Route path="/app/opportunities" element={<ProtectedRoute><OpportunitiesList /></ProtectedRoute>} />
              <Route path="/app/opportunities/:id" element={<ProtectedRoute><OpportunityDetail /></ProtectedRoute>} />
              <Route path="/app/evidence/:problemId" element={<ProtectedRoute><EvidenceView /></ProtectedRoute>} />
              
              <Route path="/app/decisions" element={<ProtectedRoute><DecisionsHistory /></ProtectedRoute>} />
              <Route path="/app/decisions/:id" element={<ProtectedRoute><DecisionDetail /></ProtectedRoute>} />

              <Route path="/app/artifacts" element={<ProtectedRoute><ArtifactStudio /></ProtectedRoute>} />
              <Route path="/app/artifacts/:id" element={<ProtectedRoute><ArtifactDetail /></ProtectedRoute>} />
              
              <Route path="/app/launches" element={<ProtectedRoute><PostLaunchTracker /></ProtectedRoute>} />
              <Route path="/app/launches/:id" element={<ProtectedRoute><LaunchDetail /></ProtectedRoute>} />
              
              <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              {/* Catch all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
