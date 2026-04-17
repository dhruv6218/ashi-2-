import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Building2, Users, CreditCard, Loader2, Trash2, Plus, X, Copy, Mail, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTeam, api } from '../../lib/api';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('workspace');
  const { addToast } = useToast();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [searchParams] = useSearchParams();

  // Data States
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useTeam(activeWorkspace?.id);
  const members = teamData?.members || [];
  const invites = teamData?.invites || [];

  const [wsName, setWsName] = useState('');
  const [wsTimezone, setWsTimezone] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  // Jira State
  const [isJiraConnected, setIsJiraConnected] = useState(false);

  // Modals/Forms State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const tabs = [
    { id: 'workspace', name: 'Workspace', icon: Building2 },
    { id: 'team', name: 'Team Members', icon: Users },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'billing', name: 'Billing & Quotas', icon: CreditCard },
  ];

  const fetchSubscription = async () => {
    if (!activeWorkspace) return;
    const { data } = await supabase.from('workspace_subscriptions').select('*').eq('workspace_id', activeWorkspace.id).single();
    if (data) setSubscription(data);
  };

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setWsTimezone(activeWorkspace.timezone);
      fetchSubscription();
    }
  }, [activeWorkspace]);

  const handleUpdateWorkspace = async () => {
    if (!activeWorkspace) return;
    const { error } = await supabase.from('workspaces').update({ name: wsName, timezone: wsTimezone }).eq('id', activeWorkspace.id);
    if (error) addToast(error.message, "error");
    else { addToast("Workspace updated", "success"); refreshWorkspaces(); }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail) return;
    setIsSendingInvite(true);
    try {
      await api.team.invite(activeWorkspace.id, inviteEmail, inviteRole);
      addToast("Invitation sent successfully", "success");
      setIsInviteModalOpen(false);
      setInviteEmail('');
      refetchTeam();
    } catch (error: any) {
      addToast(error.message || "Failed to send invitation", "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    addToast("Invite link copied to clipboard", "success");
  };

  const handleJiraToggle = () => {
    setIsJiraConnected(!isJiraConnected);
    addToast(isJiraConnected ? "Jira disconnected" : "Jira connected successfully", "success");
  };

  const removeMember = async (id: string) => {
    await api.team.removeMember(id);
    addToast("Member removed", "success");
    refetchTeam();
  };

  return (
    <AppLayout title="Settings">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1 flex md:flex-col overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal ${
                  activeTab === tab.id ? 'bg-white text-astrix-teal shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 min-h-[600px]">
          {teamLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div>
          ) : (
            <>
              {activeTab === 'workspace' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Workspace Details</h3>
                  <div className="space-y-6 max-w-md mb-12">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Workspace Name</label>
                      <input type="text" value={wsName} onChange={e => setWsName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Timezone</label>
                      <select value={wsTimezone} onChange={e => setWsTimezone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>
                    <button onClick={handleUpdateWorkspace} className="bg-astrix-teal text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700 transition-colors">Save Changes</button>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-heading text-xl font-bold text-gray-900">Team Members</h3>
                    <button onClick={() => setIsInviteModalOpen(true)} className="text-sm font-bold text-white bg-astrix-teal px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2"><Plus className="w-4 h-4"/> Invite Member</button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Active Members ({members.length})</h4>
                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {members.map(member => (
                          <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                {member.users?.full_name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{member.users?.full_name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{member.users?.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-mono font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">{member.role}</span>
                              <button onClick={() => removeMember(member.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Integrations</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between max-w-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#0052CC]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.53 23.36l-1.39-1.39c-2.48-2.48-4.96-4.96-7.44-7.44-.83-.83-.83-2.17 0-3 .83-.83 2.17-.83 3 0 2.48 2.48 4.96 4.96 7.44 7.44.83.83.83 2.17 0 3-.83.83-2.17.83-3 0zm10.15-10.15l-1.39-1.39c-2.48-2.48-4.96-4.96-7.44-7.44-.83-.83-.83-2.17 0-3 .83-.83 2.17-.83 3 0 2.48 2.48 4.96 4.96 7.44 7.44.83.83.83 2.17 0 3-.83.83-2.17.83-3 0zM11.53 11.53l-1.39-1.39c-2.48-2.48-4.96-4.96-7.44-7.44-.83-.83-.83-2.17 0-3 .83-.83 2.17-.83 3 0 2.48 2.48 4.96 4.96 7.44 7.44.83.83.83 2.17 0 3-.83.83-2.17.83-3 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Jira Cloud</h4>
                        <p className="text-sm text-gray-500">Push generated PRDs directly to your engineering backlog.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleJiraToggle}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isJiraConnected ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-astrix-teal text-white hover:bg-teal-700'}`}
                    >
                      {isJiraConnected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Billing</h3>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-mono text-gray-500 uppercase font-bold mb-1">Current Plan</div>
                      <div className="text-2xl font-heading font-black text-gray-900 flex items-center gap-2 capitalize">
                        {subscription?.plan_type || 'Free'} <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full uppercase tracking-widest font-bold">Active</span>
                      </div>
                    </div>
                    <Link to="/pricing" className="bg-astrix-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700">Upgrade Plan</Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSendingInvite && setIsInviteModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => !isSendingInvite && setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email Address *</label>
                <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="member">Member (Can view and edit)</option>
                  <option value="admin">Admin (Can manage settings and billing)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isSendingInvite || !inviteEmail} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isSendingInvite && <Loader2 className="w-4 h-4 animate-spin"/>} Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
