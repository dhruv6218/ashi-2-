import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { MagneticButton } from '../ui/MagneticButton';
import { Link, useLocation } from 'react-router-dom';

export const EmpireSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      const id = path.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', path);
      }
    }
  };

  return (
    <footer className="relative bg-white text-gray-900 overflow-hidden pt-32 md:pt-40 pb-12 border-t border-gray-100" ref={ref}>
      {/* Massive Glowing Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-brand-blue/5 blur-[200px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center text-center">
        
        <div className="text-brand-blue font-mono text-xs tracking-widest uppercase mb-8 font-bold bg-brand-blue/5 px-4 py-2 rounded-full">
          Get Started Today
        </div>

        <h2 className={`font-heading text-fluid-2 leading-[0.9] tracking-tighter mb-8 md:mb-10 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          Your next decision <br/> <span className="text-gray-300 text-stroke">deserves proof.</span>
        </h2>
        
        <p className={`text-lg md:text-xl text-gray-500 font-medium max-w-2xl mb-12 md:mb-16 transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          The era of guessing is over. Join the product teams building with evidence. Setup takes under 10 minutes.
        </p>

        <div className={`flex flex-col sm:flex-row gap-4 md:gap-6 mb-24 md:mb-32 w-full sm:w-auto transition-all duration-700 delay-150 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <MagneticButton strength={0.2} className="w-full sm:w-auto">
            <Link to="/signup" className="w-full sm:w-auto inline-block bg-gray-900 border border-gray-900 text-white px-10 md:px-12 py-4 md:py-5 rounded-full font-bold text-base md:text-lg hover:bg-brand-blue hover:border-brand-blue transition-all duration-300 shadow-apple btn-shine focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
              Start Free
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.1} className="w-full sm:w-auto">
            <Link to="/#features" onClick={(e) => handleNavClick(e, '/#features')} className="relative w-full sm:w-auto inline-block bg-white text-gray-900 border border-gray-200 px-10 md:px-12 py-4 md:py-5 rounded-full font-bold text-base md:text-lg hover:bg-gray-50 transition-all duration-300 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300 focus-visible:ring-offset-2">
              See the loop
            </Link>
          </MagneticButton>
        </div>

        {/* Clean 4-Column Footer Grid */}
        <div className="w-full border-t border-gray-100 pt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
          
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-3 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg w-max">
              <img 
                src="https://images.dualite.app/102e86e1-720e-45cc-9e4e-55e865135e96/asset-b9a7a63e-c65a-4fa8-9433-c13564a7364e.webp" 
                alt="Astrix Logo" 
                className="h-10 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
              <div className="font-heading text-xl font-black tracking-tighter text-gray-900">ASTRIX</div>
            </Link>
            <p className="text-gray-500 text-sm font-medium max-w-xs mb-8 leading-relaxed">
              The Accountability Layer for Product Teams. Stop guessing, start proving.
            </p>
            <div className="font-sans text-xs text-gray-400 font-medium">
              © 2026 Astrix AI Inc. All rights reserved.
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 font-heading">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/#features" onClick={(e) => handleNavClick(e, '/#features')} className="hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 font-heading">Company & Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/privacy" className="hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue">Terms of Service</Link></li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
};
