import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HeroSection } from '../components/sections/HeroSection';
import { ChaosSection } from '../components/sections/ChaosSection';
import { ClaritySection } from '../components/sections/ClaritySection';
import { VolumeValueSection } from '../components/sections/VolumeValueSection';
import { IngestionSection } from '../components/sections/IngestionSection';
import { SignalExplorerSection } from '../components/sections/SignalExplorerSection';
import { EvidenceViewSection } from '../components/sections/EvidenceViewSection';
import { EngineSection } from '../components/sections/EngineSection';
import { DecisionLabSection } from '../components/sections/DecisionLabSection';
import { ArtifactSection } from '../components/sections/ArtifactSection';
import { PostLaunchSection } from '../components/sections/PostLaunchSection';
import { MainLayout } from '../layouts/MainLayout';

export const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <MainLayout>
      {/* 1. Hero */}
      <HeroSection />
      
      {/* 2. Problem Section: Scattered signals, weak prioritization */}
      <ChaosSection />
      
      {/* 3. How it works: 6-step core loop */}
      <ClaritySection />
      
      {/* 4. Why different: Account impact & Evidence */}
      <VolumeValueSection />
      
      {/* 5. Product Preview: The Core Loop in Action */}
      <IngestionSection />
      <SignalExplorerSection />
      <EvidenceViewSection />
      <EngineSection />
      <DecisionLabSection />
      <ArtifactSection />
      <PostLaunchSection />
      
      {/* Final CTA is handled by EmpireSection inside MainLayout */}
    </MainLayout>
  );
};
