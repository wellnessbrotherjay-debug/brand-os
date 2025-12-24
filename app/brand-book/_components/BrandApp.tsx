
import React, { useState, useEffect } from 'react';
import { StoreProvider, useAppStore } from './store';
import { checkUrlForToken } from './services/authService';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { BrandSetup } from './views/BrandSetup';
import { Strategy } from './views/Strategy';
import { Identity } from './views/Identity';
import { CustomerAvatar } from './views/CustomerAvatar';
import { ContentEngine } from './views/ContentEngine';
import { CalendarView } from './views/Calendar';
import { Assets } from './views/Assets';
import { BrandBook } from './views/BrandBook';
import { SocialKit } from './views/SocialKit';
import { HospitalityPMS } from './views/HospitalityPMS';
import { HospitalityMarketplace } from './views/HospitalityMarketplace';
import { HospitalityFinance } from './views/HospitalityFinance';
import { HospitalityGuest } from './views/HospitalityGuest';
import { ThemeSettings } from './views/ThemeSettings';
import { BrandMaster } from './views/BrandMaster';
import IntegrationsPage from './views/Integrations';
import ApprovalsPage from './views/Approvals';
import AnalyticsPage from './views/Analytics';
import { MarketingStrategy } from './views/MarketingStrategy';
import { LLMSettingsView } from './views/LLMSettings';
import { TemplateStudio } from './views/TemplateStudio';
import { MetaAds } from './views/MetaAds';
import { TeamManagement } from './views/TeamManagement';
import { ProjectView } from './views/ProjectView';
import { PodCenter } from './views/PodCenter';
import { CreativeStudio } from './views/CreativeStudio';
import { VideoStudio } from './views/VideoStudio';
import { ViewName } from './types';

const AppContent: React.FC = () => {
  const [currentView, setView] = useState<ViewName>('dashboard');
  const { activeBrandId } = useAppStore(); // Get active brand

  // OAUTH CALLBACK HANDLER
  // This captures the Facebook/Google redirect code and saves the token
  useEffect(() => {
    const handleAuthCallback = async () => {
      if (typeof window !== 'undefined' && activeBrandId) {
        await checkUrlForToken(activeBrandId);
        // Clean URL after handling
        if (window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };
    handleAuthCallback();
  }, [activeBrandId]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard setView={setView} />;
      case 'setup': return <BrandSetup setView={setView} />;
      case 'brand_master': return <BrandMaster setView={setView} />;
      case 'strategy': return <Strategy />;
      case 'identity': return <Identity />;
      case 'customer_avatar': return <CustomerAvatar />;
      case 'theme_settings': return <ThemeSettings />;

      // Asset & Project Management
      case 'projects': return <ProjectView />;
      case 'pods': return <PodCenter />;
      case 'creative_board': return <CreativeStudio />;
      case 'video_studio': return <VideoStudio />;
      case 'assets': return <Assets setView={setView} />; // Now passes setView
      case 'team': return <TeamManagement />;

      // Strategy & AI Settings
      case 'marketing_strategy': return <MarketingStrategy />;
      case 'llm_settings': return <LLMSettingsView />;

      // Content Engine
      case 'ideas': return <ContentEngine />;
      case 'template_studio': return <TemplateStudio />; // Replaced old templates view
      case 'calendar': return <CalendarView />;
      case 'approvals': return <ApprovalsPage />;
      case 'socialkit': return <SocialKit />;
      case 'meta_ads': return <MetaAds />;
      case 'analytics': return <AnalyticsPage />;
      case 'brandbook': return <BrandBook />;
      case 'integrations': return <IntegrationsPage />;

      // Hospitality Routes
      case 'hospitality_pms': return <HospitalityPMS />;
      case 'hospitality_marketplace': return <HospitalityMarketplace />;
      case 'hospitality_finance': return <HospitalityFinance />;
      case 'hospitality_guest': return <HospitalityGuest />;

      default: return <Dashboard setView={setView} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView}>
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
