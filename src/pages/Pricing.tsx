import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Check, HelpCircle, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

export const Pricing = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal(0.1);

  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const tiers = [
    {
      name: "Free",
      displayPrice: "$0",
      period: "forever",
      desc: "For solo founders and PMs validating the evidence-based product loop.",
      features: [
        "1 Member + 2 Viewers",
        "1 Workspace",
        "200 signals (Lifetime total)",
        "CSV upload & manual entry",
        "Sample workspace included",
        "Standard launch reviews & verdicts"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Starter",
      displayPrice: "$59",
      period: "/month",
      desc: "For early-stage startups establishing their first evidence-based product loop.",
      features: [
        "Up to 3 Members + Unlimited Viewers",
        "1 Workspace",
        "2,000 signals/month",
        "CSV upload & manual entry",
        "Sample workspace included",
        "500 AI classifications & 20 memos",
        "Launch reviews & verdicts",
        "Email support"
      ],
      cta: "Start with Starter",
      popular: false
    },
    {
      name: "Growth",
      displayPrice: "$179",
      period: "/month",
      desc: "For scaling product teams that need deeper signal volume and team collaboration.",
      features: [
        "Up to 8 Members + Unlimited Viewers",
        "1 Workspace",
        "10,000 signals/month",
        "CSV upload & manual entry",
        "2,500 AI classifications & 100 memos",
        "Launch reviews & verdicts",
        "Priority support"
      ],
      cta: "Talk to Founder",
      popular: true
    }
  ];

  const faqs = [
    { q: "What counts as a 'signal'?", a: "A signal is any individual piece of feedback ingested into Astrix — a support ticket, app store review, interview note, or a row in a CSV upload." },
    { q: "What are the user roles?", a: "We keep it simple: Owners (billing & settings), Members (editors who can create decisions and artifacts), and Viewers (free, unlimited users who can read memos and track launch progress)." },
    { q: "How do I import data?", a: "Astrix supports CSV upload and manual signal entry on all plans. You can also start with a sample workspace to explore the full product loop before importing real data." },
    { q: "Does Astrix include a sample workspace?", a: "Yes. Every plan includes a sample workspace with pre-loaded signals, problems, opportunities, a decision memo, and an active launch so you can experience the full product loop immediately." },
    { q: "Is my data used to train your AI models?", a: "Absolutely not. We use enterprise APIs with strict zero-retention policies. Your workspace data is isolated and never used for training." },
    { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from the billing settings. You will retain access until the end of your current billing period." }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCheckout = async (tier: any) => {
    if (!activeWorkspace) {
      addToast("Please log in or create an account to upgrade.", "warning");
      navigate('/signup');
      return;
    }

    setLoadingTier(tier.name);
    
    // Simulate checkout redirect for frontend prototype
    setTimeout(() => {
      setLoadingTier(null);
      addToast(`Redirecting to checkout for ${tier.name} plan...`, "success");
      navigate('/app/settings?tab=billing');
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 pt-20 md:pt-32 pb-24 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center" ref={headerRef}>
          <h1 className={`font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-6 transition-all duration-700 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Simple pricing. <br/>
            <span className="text-brand-blue">Serious value.</span>
          </h1>
          <p className={`text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-12 transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            The accountability loop for every stage of growth.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 -mt-12 relative z-10 mb-32" ref={cardsRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`relative rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${tier.popular ? 'bg-brand-blue text-white shadow-glow-blue lg:scale-105 z-20 border-none' : 'bg-white text-gray-900 shadow-apple border border-gray-200'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-yellow-300/50">
                  Most Popular
                </div>
              )}
              <h3 className={`text-xl font-heading font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`text-sm mb-6 h-12 font-medium ${tier.popular ? 'text-blue-100' : 'text-gray-500'}`}>{tier.desc}</p>
              <div className="mb-8">
                <span className="text-4xl lg:text-5xl font-heading font-black tracking-tighter">{tier.displayPrice}</span>
                {tier.period && <span className={`text-sm font-bold ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>{tier.period}</span>}
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm font-medium">
                    <Check className={`w-5 h-5 shrink-0 ${tier.popular ? 'text-brand-yellow' : 'text-brand-blue'}`} />
                    <span className={tier.popular ? 'text-blue-50' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleCheckout(tier)}
                disabled={loadingTier === tier.name}
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${tier.popular ? 'bg-white text-brand-blue hover:bg-gray-50 focus-visible:ring-white shadow-sm' : 'bg-gray-900 text-white hover:bg-brand-blue focus-visible:ring-brand-blue shadow-sm'} disabled:opacity-70`}
              >
                {loadingTier === tier.name ? <Loader2 className="w-5 h-5 animate-spin" /> : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[800px] mx-auto px-6 md:px-12 mb-32">
        <div className="flex items-center justify-center gap-3 mb-12">
          <HelpCircle className="w-6 h-6 text-brand-blue" />
          <h3 className="text-3xl font-heading font-bold text-center tracking-tight">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-brand-blue/30 transition-colors">
              <button 
                className="w-full p-6 text-left flex justify-between items-center focus-visible:outline-none focus-visible:bg-gray-50 group"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{faq.q}</span>
                <span className={`transform transition-transform duration-300 text-gray-400 group-hover:text-brand-blue ${openFaq === i ? 'rotate-180' : ''}`}>↓</span>
              </button>
              <div 
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="text-gray-600 text-sm font-medium leading-relaxed px-6 pb-6 pt-2">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </MainLayout>
  );
};
