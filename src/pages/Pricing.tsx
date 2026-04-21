import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Check, HelpCircle, Loader2, Sparkles } from 'lucide-react';
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
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Free",
      monthlyPrice: "₹0",
      annualPrice: "₹0",
      period: "/month",
      annualBilled: "Free forever",
      desc: "For solo founders and PMs validating the evidence-based product loop.",
      features: [
        "1 Member, 2 Viewers",
        "1 Workspace",
        "200 signals / month",
        "100 AI Classifications / month",
        "5 AI Memos / month",
        "Standard Launch Reviews",
        "AI Model: Gemini",
      ],
      comingSoon: [
        "Advanced Analytics"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Starter",
      monthlyPrice: "₹59",
      annualPrice: "₹49", 
      period: "/month",
      annualBilled: "Billed ₹588 yearly",
      desc: "For early-stage startups establishing their first evidence-based product loop.",
      features: [
        "3 Members, Unlimited Viewers",
        "1 Workspace",
        "2,000 signals / month",
        "500 AI Classifications / month",
        "20 AI Memos / month",
        "Standard Launch Reviews",
        "AI Model: Gemini",
      ],
      comingSoon: [
        "Advanced Analytics"
      ],
      cta: "Start with Starter",
      popular: false
    },
    {
      name: "Growth",
      monthlyPrice: "₹179",
      annualPrice: "₹149", 
      period: "/month",
      annualBilled: "Billed ₹1,788 yearly",
      desc: "For scaling product teams that need deeper signal volume and team collaboration.",
      features: [
        "8 Members, Unlimited Viewers",
        "1 Workspace",
        "10,000 signals / month",
        "2,500 AI Classifications / month",
        "100 AI Memos / month",
        "Ask Assistant",
        "Advanced Launch Reviews",
        "AI Model: Gemini + OpenRouter",
      ],
      comingSoon: [
        "Advanced Analytics"
      ],
      cta: "Start with Growth",
      popular: true
    },
    {
      name: "Scale",
      monthlyPrice: "₹449",
      annualPrice: "₹369", 
      period: "/month",
      annualBilled: "Billed ₹4,428 yearly",
      desc: "For large organizations requiring maximum volume, security, and premium AI models.",
      features: [
        "20 Members, Unlimited Viewers",
        "10 Workspaces",
        "50,000 signals / month",
        "10,000 AI Classifications / month",
        "500 AI Memos / month",
        "Ask Assistant",
        "Audit Log & Priority Support",
        "Advanced Launch Reviews",
        "AI Model: Grok",
      ],
      comingSoon: [
        "Advanced Analytics",
        "Jira Two-Way Sync"
      ],
      cta: "Start with Scale",
      popular: false
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
          <p className={`text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-10 transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            The accountability loop for every stage of growth.
          </p>

          {/* Billing Toggle */}
          <div className={`flex items-center justify-center gap-4 transition-all duration-700 delay-200 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className={`text-sm font-bold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 bg-brand-blue rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30"
              aria-label="Toggle annual billing"
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annually <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Save ~17%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-12 relative z-10 mb-32" ref={cardsRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`relative rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${tier.popular ? 'bg-brand-blue text-white shadow-glow-blue xl:scale-105 z-20 border-none' : 'bg-white text-gray-900 shadow-apple border border-gray-200'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-yellow-300/50 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <h3 className={`text-xl font-heading font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`text-sm mb-6 h-16 font-medium ${tier.popular ? 'text-blue-100' : 'text-gray-500'}`}>{tier.desc}</p>
              
              <div className="mb-2">
                <span className="text-4xl lg:text-5xl font-heading font-black tracking-tighter">
                  {isAnnual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                {tier.period && <span className={`text-sm font-bold ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>{tier.period}</span>}
              </div>
              <div className={`text-xs font-medium mb-8 h-4 ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>
                {isAnnual && tier.annualPrice !== "₹0" ? tier.annualBilled : (tier.annualPrice === "₹0" ? "Free forever" : "Billed monthly")}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm font-medium">
                    <Check className={`w-5 h-5 shrink-0 ${tier.popular ? 'text-brand-yellow' : 'text-brand-blue'}`} />
                    <span className={tier.popular ? 'text-blue-50' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
                
                {/* Coming Soon Features */}
                {tier.comingSoon.map((feat, j) => (
                  <li key={`cs-${j}`} className="flex items-start gap-3 text-sm font-medium opacity-70">
                    <Sparkles className={`w-5 h-5 shrink-0 ${tier.popular ? 'text-blue-300' : 'text-gray-400'}`} />
                    <span className={tier.popular ? 'text-blue-100' : 'text-gray-500'}>
                      {feat} <span className="text-[10px] uppercase tracking-wider font-bold ml-1 opacity-80">(Coming Soon)</span>
                    </span>
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
