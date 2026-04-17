import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps?: number;
  showSkip?: boolean;
  onSkip?: () => void;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  step, 
  totalSteps = 3,
  showSkip = false,
  onSkip
}) => {
  const navigate = useNavigate();
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden selection:bg-brand-blue selection:text-white">
      <div className="bg-noise"></div>
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-200 z-50">
        <div 
          className="h-full bg-brand-blue transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 flex justify-between items-center relative z-40">
        <div className="flex items-center gap-6">
          {step > 1 && (
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg p-1">
            <img 
              src="https://images.dualite.app/102e86e1-720e-45cc-9e4e-55e865135e96/asset-b9a7a63e-c65a-4fa8-9433-c13564a7364e.webp" 
              alt="Astrix Logo" 
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-heading text-xl font-black tracking-tighter text-gray-900 hidden sm:block">ASTRIX</span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
            Step {step} of {totalSteps}
          </span>
          {showSkip && (
            <button 
              onClick={onSkip}
              className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 w-full max-w-3xl mx-auto">
        <div className="w-full animate-[fadeIn_0.5s_ease-out]">
          {children}
        </div>
      </main>
    </div>
  );
};
