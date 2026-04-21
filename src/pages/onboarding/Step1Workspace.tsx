import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../layouts/OnboardingLayout';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../lib/api';

export const Step1Workspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshWorkspaces } = useWorkspace();
  
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Generate a URL-safe slug from the workspace name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50);

      await api.workspace.create({
        name: name.trim(),
        slug: `${slug}-${Date.now().toString(36)}`,
        timezone,
        owner_id: user.id,
      });

      await refreshWorkspaces();
      navigate('/onboarding/step-2');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create workspace. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout step={1} totalSteps={3}>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Create Your Workspace</h1>
        <p className="text-gray-500 text-base font-medium">This is where your team will collaborate on product decisions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium animate-[fadeIn_0.3s_ease-out]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-apple border border-gray-200 transition-all duration-300 hover:shadow-apple-hover">
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="workspaceName">Workspace Name</label>
            <input 
              type="text" 
              id="workspaceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-lg font-medium rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none placeholder-gray-400" 
              placeholder="e.g. TechFlow Inc" 
              required 
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="timezone">Timezone</label>
            <select 
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none appearance-none cursor-pointer"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
            </select>
          </div>

        </div>

        <button 
          type="submit" 
          disabled={!name || isLoading}
          className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/50 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-base px-5 py-4 transition-all duration-300 shadow-glow-blue btn-shine outline-none h-[56px]"
        >
          {isLoading ? <Skeleton className="w-20 h-5 bg-white/30" /> : 'Continue'}
        </button>
      </form>
    </OnboardingLayout>
  );
};

  return (
    <OnboardingLayout step={1} totalSteps={3}>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Create Your Workspace</h1>
        <p className="text-gray-500 text-base font-medium">This is where your team will collaborate on product decisions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium animate-[fadeIn_0.3s_ease-out]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-apple border border-gray-200 transition-all duration-300 hover:shadow-apple-hover">
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="workspaceName">Workspace Name</label>
            <input 
              type="text" 
              id="workspaceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-lg font-medium rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none placeholder-gray-400" 
              placeholder="e.g. TechFlow Inc" 
              required 
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="timezone">Timezone</label>
            <select 
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none appearance-none cursor-pointer"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
            </select>
          </div>

        </div>

        <button 
          type="submit" 
          disabled={!name || isLoading}
          className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/50 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-base px-5 py-4 transition-all duration-300 shadow-glow-blue btn-shine outline-none h-[56px]"
        >
          {isLoading ? <Skeleton className="w-20 h-5 bg-white/30" /> : 'Continue'}
        </button>
      </form>
    </OnboardingLayout>
  );
};
