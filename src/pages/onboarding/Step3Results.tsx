import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../layouts/OnboardingLayout';
import { Database, UploadCloud, Rocket, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export const Step3Results = () => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<'sample' | 'import' | null>(null);

  const handleFinish = async () => {
    setIsInitializing(true);
    // Simulate space initialization
    await new Promise(r => setTimeout(r, 2000));
    navigate('/app');
  };

  return (
    <OnboardingLayout step={3} totalSteps={3}>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Final Step: Data Strategy</h1>
        <p className="text-gray-500 text-base font-medium max-w-lg mx-auto">Choose how you want to start exploring ASTRIX. You can always change this later.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Sample Data Strategy */}
        <button 
          onClick={() => setActiveStrategy('sample')}
          className={`text-left p-6 rounded-3xl border transition-all duration-300 flex flex-col relative overflow-hidden group ${activeStrategy === 'sample' ? 'border-brand-blue bg-blue-50/30 ring-2 ring-brand-blue ring-offset-2' : 'border-gray-200 bg-white hover:border-gray-300 shadow-apple'}`}
        >
          {activeStrategy === 'sample' && <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-brand-blue animate-[scaleIn_0.2s_ease-out]" />}
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-brand-blue mb-4 group-hover:scale-110 transition-transform">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-2">Explore with Sample Data</h3>
          <p className="text-sm text-gray-500 font-medium flex-1">Start immediately with pre-loaded signals, problems, and decisions to see the full product loop in action.</p>
          <div className="mt-4 text-xs font-bold text-brand-blue uppercase tracking-widest">Recommended for testing</div>
        </button>

        {/* Real Data Strategy */}
        <button 
          onClick={() => setActiveStrategy('import')}
          className={`text-left p-6 rounded-3xl border transition-all duration-300 flex flex-col relative overflow-hidden group ${activeStrategy === 'import' ? 'border-brand-blue bg-blue-50/30 ring-2 ring-brand-blue ring-offset-2' : 'border-gray-200 bg-white hover:border-gray-300 shadow-apple'}`}
        >
          {activeStrategy === 'import' && <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-brand-blue animate-[scaleIn_0.2s_ease-out]" />}
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-700 mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-2">Import Your Own Data</h3>
          <p className="text-sm text-gray-500 font-medium flex-1">Upload your customer signals and account lists via CSV. We'll help you map the fields in the next step.</p>
          <div className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Self-serve import</div>
        </button>

      </div>

      <div className="space-y-4">
        <button 
          onClick={handleFinish}
          disabled={!activeStrategy || isInitializing}
          className="w-full flex items-center justify-center gap-3 text-white bg-gray-900 hover:bg-black disabled:bg-gray-400 font-bold rounded-xl text-lg px-5 py-4 transition-all duration-300 shadow-xl btn-shine outline-none h-[64px]"
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Preparing your workspace...
            </>
          ) : (
            <>
              <Rocket className="w-6 h-6" />
              Enter Your Workspace
            </>
          )}
        </button>
        
        <p className="text-center text-xs text-gray-400 font-medium">
          By entering, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>

    </OnboardingLayout>
  );
};
