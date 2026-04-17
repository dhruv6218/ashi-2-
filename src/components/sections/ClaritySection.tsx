import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const ClaritySection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section id="how-it-works" className="py-24 md:py-40 bg-gray-50 text-gray-900 relative overflow-hidden border-t border-gray-200" ref={ref}>
      {/* Massive Background Typography */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-[0.02]">
        <h2 className="font-heading text-[20vw] font-black leading-none tracking-tighter whitespace-nowrap text-gray-900">
          THE ENGINE
        </h2>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6 md:gap-10">
          <h2 className="font-heading text-fluid-2 leading-[0.9] tracking-tighter uppercase max-w-3xl">
            From Signal <br/>
            <span className="text-brand-blue">To Shipped.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-md font-medium">
            The complete accountability loop. Astrix reads the noise, scores the impact, and tracks whether your decisions actually worked.
          </p>
        </div>

        {/* Abstract Process Flow - 6 Steps matching MVP Core Loop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {/* Connecting Line (Desktop only) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -translate-y-1/2 z-0"></div>
          
          {[
            { step: "01", title: "Signals", desc: "Ingest feedback & CSVs" },
            { step: "02", title: "Problems", desc: "AI clusters the noise" },
            { step: "03", title: "Opportunities", desc: "Score by ARR & pain" },
            { step: "04", title: "Decisions", desc: "Compare and commit" },
            { step: "05", title: "Launches", desc: "Ship & track metrics" },
            { step: "06", title: "Verdicts", desc: "Prove it worked" }
          ].map((item, i) => (
            <div key={i} className={`relative z-10 bg-white p-5 md:p-6 border border-gray-200 shadow-lg shadow-gray-200/50 rounded-2xl hover:border-brand-blue transition-colors duration-500 group flex flex-col justify-between h-40 md:h-56 transform transition-transform duration-700 delay-${i * 100} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <div className="text-xs md:text-sm font-mono text-gray-400 font-bold">{item.step}</div>
              <div>
                <h3 className="text-lg md:text-xl font-heading font-bold mb-1 md:mb-2 group-hover:text-brand-blue transition-colors">{item.title}</h3>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium leading-snug">{item.desc}</p>
              </div>
              {/* Hover Fill Effect */}
              <div className="absolute bottom-0 left-0 w-full h-0 bg-brand-blue/5 group-hover:h-full transition-all duration-500 -z-10 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
