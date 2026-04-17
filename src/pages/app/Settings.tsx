import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Building2, Users, CreditCard, Loader2, Trash2, Plus, X, Copy, Box, Target } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Link } from 'react-router-dom';
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

  // Modals/Forms State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const tabs = [
    { id: 'workspace', name: 'Workspace', icon: Building2 },
    { id: 'areas', name: 'Product Areas', icon: Box },
    { id: 'segments', name: 'Segments', icon: Target },
    { id: 'team', name: 'Team Members', icon: Users },
    { id: 'billing', name: 'Billing & Quotas', icon: CreditCard },
  ];

  const fetchSubscription = async () => {
    if (!activeWorkspace) return;
    // Ready for real Supabase/backend call
    setSubscription(null);
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
    addToast('Workspace updated successfully', 'success');
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

              {activeTab === 'areas' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Product Areas</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-2xl">
                    <p className="text-sm text-gray-500 mb-6">Categorize signals and problems by product component. This allows for area-specific impact calculation.</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(activeWorkspace?.product_areas || []).map(area => (
                        <span key={area} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold border border-gray-100">
                          {area}
                          <button className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input type="text" placeholder="Add new area..." className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-astrix-teal shadow-inner" />
                      <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors">Add Area</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'segments' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Customer Segments</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-2xl">
                    <p className="text-sm text-gray-500 mb-6">Group your accounts by business value or type (e.g., Enterprise, SMB, Beta). This powers the ARR-at-risk scoring.</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(activeWorkspace?.segments || []).map(segment => (
                        <span key={segment} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold border border-gray-100">
                          {segment}
                          <button className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input type="text" placeholder="Add new segment..." className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-astrix-teal shadow-inner" />
                      <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors">Add Segment</button>
                    </div>
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
