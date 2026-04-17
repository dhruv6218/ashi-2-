import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../layouts/OnboardingLayout';
import { Plus, X, Box, Users, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const Step2Data = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  
  const [productAreas, setProductAreas] = useState<string[]>(['Authentication', 'Dashboard', 'API']);
  const [newArea, setNewArea] = useState('');
  
  const [segments, setSegments] = useState<string[]>(['Enterprise', 'SMB', 'Self-Serve']);
  const [newSegment, setNewSegment] = useState('');

  const addArea = () => {
    if (newArea && !productAreas.includes(newArea)) {
      setProductAreas([...productAreas, newArea]);
      setNewArea('');
    }
  };

  const removeArea = (area: string) => {
    setProductAreas(productAreas.filter(a => a !== area));
  };

  const addSegment = () => {
    if (newSegment && !segments.includes(newSegment)) {
      setSegments([...segments, newSegment]);
      setNewSegment('');
    }
  };

  const removeSegment = (segment: string) => {
    setSegments(segments.filter(s => s !== segment));
  };

  const handleContinue = () => {
    // In a real app, we would save these to the database here
    navigate('/onboarding/step-3');
  };

  return (
    <OnboardingLayout step={2} totalSteps={3}>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Setup Your Product Context</h1>
        <p className="text-gray-500 text-base font-medium max-w-lg mx-auto">ASTRIX uses these to categorize signals and calculate ARR impact across your business.</p>
      </div>

      <div className="space-y-8 mb-10">
        
        {/* Product Areas */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-apple">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-brand-blue">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Product Areas</h3>
              <p className="text-xs text-gray-500 font-medium">Define high-level components of your product.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {productAreas.map(area => (
              <span key={area} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold animate-[fadeIn_0.2s_ease-out]">
                {area}
                <button onClick={() => removeArea(area)} className="text-gray-400 hover:text-gray-900"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addArea()}
              placeholder="e.g. Mobile App, Analytics..." 
              className="flex-1 bg-gray-50 border border-gray-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-blue transition-all"
            />
            <button onClick={addArea} className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-black transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer Segments */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-apple">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Customer Segments</h3>
              <p className="text-xs text-gray-500 font-medium">How do you group your customers?</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {segments.map(segment => (
              <span key={segment} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold animate-[fadeIn_0.2s_ease-out]">
                {segment}
                <button onClick={() => removeSegment(segment)} className="text-gray-400 hover:text-gray-900"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newSegment}
              onChange={e => setNewSegment(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addSegment()}
              placeholder="e.g. Growth, Free Tier..." 
              className="flex-1 bg-gray-50 border border-gray-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-blue transition-all"
            />
            <button onClick={addSegment} className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-black transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      <button 
        onClick={handleContinue}
        disabled={productAreas.length === 0 || segments.length === 0}
        className="w-full flex items-center justify-center gap-2 text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/50 focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-base px-5 py-4 transition-all duration-300 shadow-glow-blue btn-shine outline-none h-[56px]"
      >
        Continue to Data Strategy <ArrowRight className="w-5 h-5" />
      </button>
    </OnboardingLayout>
  );
};
