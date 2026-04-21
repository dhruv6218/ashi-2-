import React from 'react';
import { Link } from 'react-router-dom';
import { EmpireSection } from '../components/sections/EmpireSection';
import { ScrollProgress } from '../components/ui/ScrollProgress';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative bg-white text-gray-900 min-h-screen font-sans selection:bg-brand-blue selection:text-white">
      <ScrollProgress />
      <div className="bg-noise"></div>
      
      {/* Lean Minimal Header */}
      <header className="fixed top-0 left-0 w-full z-[100] px-6 md:px-12 py-6 flex justify-between items-center transition-all duration-300">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-heading text-2xl font-black tracking-tighter text-gray-900">ASTRIX AI</span>
        </Link>
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/pricing" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Pricing</Link>
          <Link to="/login" className="text-sm font-bold text-gray-900 hover:text-brand-blue transition-colors">Sign In</Link>
          <Link to="/signup" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-blue transition-all shadow-sm">
            Start Free
          </Link>
        </div>
      </header>

      <main className="pt-24">
        {children}
      </main>

      <EmpireSection />
    </div>
  );
};
