import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MagneticButton } from '../ui/MagneticButton';
import { InstallPrompt } from '../InstallPrompt';

export const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  let lastScrollY = 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      
      if (currentScrollY > lastScrollY && currentScrollY > 100 && !mobileMenuOpen) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      const id = path.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', path);
        setMobileMenuOpen(false);
      }
    }
  };

  const navLinks = [
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'} ${scrolled || mobileMenuOpen ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'py-8 bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-3 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg p-1 relative z-[70]">
            <div className="relative flex items-center justify-center">
              <img 
                src="https://images.dualite.app/102e86e1-720e-45cc-9e4e-55e865135e96/asset-b9a7a63e-c65a-4fa8-9433-c13564a7364e.webp" 
                alt="Astrix Logo" 
                className="h-10 w-auto relative z-10 object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="font-heading text-2xl font-black tracking-tighter text-gray-900 hidden sm:block">ASTRIX</span>
          </Link>
          
          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium text-gray-500">
            {navLinks.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={(e) => handleNavClick(e, item.path)}
                className="hover:text-gray-900 transition-colors relative group py-2 px-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:text-gray-900"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            ))}
          </div>

          {/* Desktop CTA & Mobile Toggle */}
          <div className="flex items-center gap-4 relative z-[70]">
            <div className="hidden md:flex items-center gap-4">
              <InstallPrompt />
              <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-md px-2 py-1">
                Log in
              </Link>
              <MagneticButton strength={0.15}>
                <Link to="/signup" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-blue transition-colors duration-300 shadow-apple btn-shine focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 inline-block">
                  Start Free
                </Link>
              </MagneticButton>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-[55] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden flex flex-col justify-center px-8 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col gap-6">
          {navLinks.map((item, i) => (
            <div key={item.name} className="overflow-hidden">
              <Link 
                to={item.path} 
                onClick={(e) => handleNavClick(e, item.path)}
                className={`block font-heading text-4xl font-black tracking-tighter text-gray-900 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {item.name}
              </Link>
            </div>
          ))}
          
          <div className={`mt-8 transition-all duration-500 delay-300 flex flex-col gap-4 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <InstallPrompt />
            <Link to="/signup" className="w-full bg-brand-blue text-white px-6 py-4 rounded-full text-lg font-bold shadow-glow-blue text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
              Start Free
            </Link>
            <Link to="/login" className="w-full bg-gray-50 text-gray-900 border border-gray-200 px-6 py-4 rounded-full text-lg font-bold text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300 focus-visible:ring-offset-2">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
