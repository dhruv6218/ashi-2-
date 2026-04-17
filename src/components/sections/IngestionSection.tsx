import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Database, Hash, CheckSquare, FileSpreadsheet } from 'lucide-react';

export const IngestionSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section className="py-24 md:py-40 bg-gray-50 relative overflow-hidden border-t border-gray-200" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center">
        
        <div className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-6 flex items-center justify-center gap-4 font-bold">
          <span className="w-8 h-[2px] bg-brand-blue"></span> The Pipeline <span className="w-8 h-[2px] bg-brand-blue"></span>
        </div>
        
        <h2 className={`font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-16 md:mb-20 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          Connect Everything. <br/>
          <span className="text-gray-300 text-stroke">Lose Nothing.</span>
        </h2>

        {/* 3D Pipeline Visual */}
        <div className="relative max-w-5xl mx-auto h-[500px] md:h-[400px] flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0">
          
          {/* Left Sources */}
          <div className="flex flex-row md:flex-col gap-4 md:gap-6 w-full md:w-1/4 relative z-10 justify-center">
            {[
              { icon: Hash, name: "Slack", color: "text-pink-600" },
              { icon: CheckSquare, name: "Jira", color: "text-blue-600" },
              { icon: FileSpreadsheet, name: "CSV", color: "text-gray-700" }
            ].map((source, i) => (
              <div key={i} className={`bg-white border border-gray-100 shadow-lg shadow-gray-200/50 p-3 md:p-4 rounded-xl flex items-center gap-2 md:gap-4 transform transition-all duration-700 delay-${i * 200} ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
                <source.icon className={`w-5 h-5 md:w-6 md:h-6 ${source.color}`} />
                <span className="font-mono text-xs md:text-sm text-gray-700 font-semibold">{source.name}</span>
              </div>
            ))}
          </div>

          {/* Center Processing Node */}
          <div className={`relative z-20 transition-all duration-1000 delay-500 ${isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-2 border-brand-blue flex items-center justify-center relative shadow-[0_10px_40px_rgba(26,86,255,0.2)]">
              <Database className="w-8 h-8 md:w-10 md:h-10 text-brand-blue" />
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-2 border-brand-blue/30 animate-[spin_4s_linear_infinite] border-t-transparent"></div>
              <div className="absolute -inset-4 rounded-full border-2 border-brand-blue/10 animate-[spin_6s_linear_infinite_reverse] border-b-transparent"></div>
            </div>
            <div className="absolute top-full mt-4 md:mt-6 left-1/2 -translate-x-1/2 text-center w-max bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg shadow-md border border-gray-100">
              <div className="font-heading font-bold text-gray-900 text-sm md:text-base">Astrix Core</div>
              <div className="font-mono text-[10px] md:text-xs text-brand-blue uppercase font-bold">Normalization</div>
            </div>
          </div>

          {/* Right CRM Layer */}
          <div className="flex flex-col gap-6 w-full md:w-1/4 relative z-10 items-center md:items-stretch mt-10 md:mt-0">
            <div className={`bg-white shadow-xl shadow-brand-yellow/10 p-5 md:p-6 rounded-xl border-2 border-brand-yellow/30 transform transition-all duration-700 delay-700 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'} text-center md:text-left`}>
              <div className="text-brand-yellow font-mono text-[10px] md:text-xs mb-2 uppercase font-bold">CRM Layer</div>
              <div className="font-heading font-bold text-gray-900 text-base md:text-lg">Account CSV Sync</div>
              <div className="text-gray-500 text-xs md:text-sm mt-2 font-medium">Map your CRM data to inject ARR context into every signal.</div>
            </div>
          </div>

          {/* Connecting Lines (SVG) - Hidden on mobile for cleaner layout */}
          <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0">
            <path d="M 25% 20% C 40% 20%, 40% 50%, 50% 50%" fill="none" stroke="rgba(26,86,255,0.2)" strokeWidth="3" className="animate-[dash_3s_linear_infinite]" strokeDasharray="10 10" />
            <path d="M 25% 50% L 50% 50%" fill="none" stroke="rgba(26,86,255,0.2)" strokeWidth="3" className="animate-[dash_3s_linear_infinite]" strokeDasharray="10 10" />
            <path d="M 25% 80% C 40% 80%, 40% 50%, 50% 50%" fill="none" stroke="rgba(26,86,255,0.2)" strokeWidth="3" className="animate-[dash_3s_linear_infinite]" strokeDasharray="10 10" />
            <path d="M 50% 50% L 75% 50%" fill="none" stroke="rgba(245,200,66,0.5)" strokeWidth="3" className="animate-[dash_3s_linear_infinite_reverse]" strokeDasharray="10 10" />
          </svg>

        </div>
      </div>
    </section>
  );
};
