import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HeroSection } from '../components/sections/HeroSection';
import { SignalExplorerSection } from '../components/sections/SignalExplorerSection';
import { EvidenceViewSection } from '../components/sections/EvidenceViewSection';
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
      <HeroSection />
      <SignalExplorerSection />
      <EvidenceViewSection />
      <ArtifactSection />
      <PostLaunchSection />
    </MainLayout>
  );
};
