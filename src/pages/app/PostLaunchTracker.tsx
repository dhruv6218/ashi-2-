import React from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link } from 'react-router-dom';
import { Rocket, Clock, Plus, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { useLaunches } from '../../lib/api';

export const PostLaunchTracker = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: launches, isLoading } = useLaunches(activeWorkspace?.id);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <AppLayout
      title="Post-Launch Tracker"
      subtitle="Close the loop between decision and outcome"
      actions={
        <Link to="/app/decisions" className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log New Launch
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
        </div>
      ) : launches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm text-center p-8">
          <Rocket className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">No launches here</h3>
          <p className="text-sm text-gray-500 font-medium max-w-sm">Log a launch from a committed decision to start tracking its impact.</p>
          <Link to="/app/decisions" className="mt-4 bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal transition-colors">View Decisions</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {launches.map(launch => (
            <div key={launch.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-heading text-xl font-bold text-gray-900">{launch.title}</h3>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-brand-blue border-blue-200">
                    Tracked
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Launched {formatDate(launch.launched_at)}</span>
                </div>
              </div>
              <Link to={`/app/launches/${launch.id}`} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 shrink-0">
                Record Verdict <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};
