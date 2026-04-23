import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';

export const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, signOut, signUp } = useAuth();
  const { refreshWorkspaces } = useWorkspace();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setIsLoading(false);
      return;
    }

    // Look up the invitation by token via public policy
    supabase
      .from('invitations')
      .select(`
        invited_email, invited_role, status, expires_at,
        workspaces:workspace_id(name),
        inviters:invited_by(full_name)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr || !data) {
          setError('This invitation is invalid, has already been used, or has expired.');
        } else if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired. Please ask the workspace owner to send a new one.');
        } else {
          setInviteDetails({
            workspace_name: (data.workspaces as any)?.name ?? 'Unknown Workspace',
            inviter_name: (data.inviters as any)?.full_name ?? 'A team member',
            email: data.invited_email,
            role: data.invited_role,
          });
        }
        setIsLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setError(null);

    const { data, error: fnErr } = await supabase.functions.invoke('invite-accept', {
      body: { token },
    });

    if (fnErr) {
      setError(fnErr.message ?? 'Failed to accept invitation. Please try again.');
      setIsAccepting(false);
      return;
    }

    await refreshWorkspaces();
    navigate('/app');
  };

  const handleSignupAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteDetails?.email || !password || !name) return;
    
    setIsAccepting(true);
    setError(null);

    const { error: signUpError, needsConfirmation } = await signUp(inviteDetails.email, password, name);
    
    if (signUpError) {
      setError(signUpError);
      setIsAccepting(false);
      return;
    }

    if (needsConfirmation) {
      setSuccessMsg("Account created! Please check your email to verify your account. Once verified, log in and visit this invitation link again.");
      setIsAccepting(false);
      return;
    }

    // User is now signed in — accept the invitation
    await handleAccept();
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <p className="mt-4 text-sm font-bold text-gray-500">Verifying invitation...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error && !inviteDetails) {
    return (
      <AuthLayout>
        <div className="bg-white p-8 rounded-3xl shadow-apple border border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-brand-red mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/" className="text-brand-blue font-bold hover:underline">Go to Homepage</Link>
        </div>
      </AuthLayout>
    );
  }

  const isExistingUser = !!user;
  const isEmailMatch = user?.email?.toLowerCase() === inviteDetails?.email?.toLowerCase();

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        
        <div className="flex flex-col items-center text-center mb-8 border-b border-gray-100 pb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-400 flex items-center justify-center font-heading font-black text-white text-2xl shadow-lg shadow-brand-blue/30 mb-4">
            {inviteDetails?.workspace_name?.charAt(0).toUpperCase() || 'W'}
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            {inviteDetails?.inviter_name || 'Someone'} invited you to <span className="text-brand-blue">{inviteDetails?.workspace_name}</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Join the team on Astrix as a <span className="font-bold text-gray-700 capitalize">{inviteDetails?.role}</span>.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-bold text-green-700 mb-6">{successMsg}</p>
            <Link to="/login" className="w-full inline-block text-white bg-gray-900 hover:bg-brand-blue focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 text-center transition-all shadow-apple outline-none">
              Go to Login
            </Link>
          </div>
        ) : isExistingUser ? (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-6">
              You are currently signed in as <span className="font-bold text-gray-900">{user.email}</span>.
            </p>
            
            {isEmailMatch ? (
              <button 
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[52px]"
              >
                {isAccepting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accept & Join Workspace'}
              </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm font-medium mb-4">
                This invitation was sent to <strong>{inviteDetails?.email}</strong>. Please sign out and sign in with the correct account to accept it.
              </div>
            )}
            
            <button 
              onClick={() => signOut()}
              className="mt-4 text-sm text-gray-500 font-bold hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSignupAndAccept}>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Invited Email</span>
              <span className="text-sm font-bold text-gray-900">{inviteDetails?.email}</span>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all duration-300 outline-none placeholder-gray-400" 
                placeholder="Jane Doe" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="password">Create Password</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all duration-300 outline-none placeholder-gray-400" 
                placeholder="••••••••" 
                required 
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              disabled={isAccepting || !name || !password}
              className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none mt-4 h-[52px]"
            >
              {isAccepting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Join'}
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-4">
              Already have an account? <Link to="/login" className="text-brand-blue font-bold hover:underline">Log in first</Link>
            </p>
          </form>
        )}

      </div>
    </AuthLayout>
  );
};
