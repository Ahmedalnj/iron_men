import React, { useState, useEffect } from 'react';
import { initDatabase, getUncheckedPlayers, getNotificationLog } from './state';
import { translations } from './translations';

// Lucide Icons
import { 
  LayoutDashboard, 
  Trophy, 
  Monitor, 
  Users, 
  CheckSquare, 
  Timer, 
  FileSpreadsheet, 
  UserPlus, 
  Activity, 
  RefreshCw, 
  Bell, 
  Settings as SettingsIcon,
  Globe
} from 'lucide-react';

// Sub Pages
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Teams from './pages/Teams';
import Players from './pages/Players';
import CheckIn from './pages/CheckIn';
import Timing from './pages/Timing';
import Results from './pages/Results';
import Leaderboard from './pages/Leaderboard';
import PlayerRanking from './pages/PlayerRanking';
import Incidents from './pages/Incidents';
import Substitutions from './pages/Substitutions';
import Notifications from './pages/Notifications';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [language, setLanguage] = useState('ar');
  const [role, setRole] = useState('admin');
  
  // Alert counters
  const [uncheckedCount, setUncheckedCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  
  // Database synchronization tick
  const [syncTick, setSyncTick] = useState(0);

  // Initialize DB on mount
  useEffect(() => {
    initDatabase();
    
    // Set default direction & language attributes
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    // Set interval to poll alerts counts
    const updateBadges = () => {
      setUncheckedCount(getUncheckedPlayers().length);
      setNotifCount(getNotificationLog().length);
    };

    updateBadges();
    const interval = setInterval(updateBadges, 4000);

    const handleStateUpdate = () => {
      setSyncTick(tick => tick + 1);
      updateBadges();
    };
    window.addEventListener('state-updated', handleStateUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('state-updated', handleStateUpdate);
    };
  }, []);

  // Language toggle handler
  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  // Translation helper
  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || translations['en'][key] || key;
  };

  // Switch tabs & scroll to top
  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    const content = document.querySelector('.page-content');
    if (content) {
      content.scrollTop = 0;
    }
  };

  // Sidebar Menu Items Definition
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
    { id: 'results', label: t('results'), icon: <Trophy size={18} /> },
    { id: 'leaderboard', label: t('leaderboard'), icon: <Monitor size={18} /> },
    { id: 'player_ranking', label: t('player_ranking'), icon: <Users size={18} /> },
    { id: 'checkin', label: t('checkin'), icon: <CheckSquare size={18} />, badge: uncheckedCount },
    { id: 'timing', label: t('timing'), icon: <Timer size={18} /> },
    { id: 'teams', label: t('teams'), icon: <FileSpreadsheet size={18} /> },
    { id: 'players', label: t('players'), icon: <UserPlus size={18} /> },
    { id: 'incidents', label: t('incidents'), icon: <Activity size={18} /> },
    { id: 'substitutions', label: t('substitutions'), icon: <RefreshCw size={18} /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell size={18} />, badge: notifCount },
    { id: 'settings', label: t('settings'), icon: <SettingsIcon size={18} /> }
  ];

  // Render Sub-Page Router
  const renderPage = () => {
    switch (tab) {
      case 'dashboard':
        return <Dashboard t={t} setTab={handleTabChange} syncTick={syncTick} />;
      case 'settings':
        return <Settings t={t} role={role} syncTick={syncTick} />;
      case 'teams':
        return <Teams t={t} role={role} syncTick={syncTick} />;
      case 'players':
        return <Players t={t} role={role} syncTick={syncTick} />;
      case 'checkin':
        return <CheckIn t={t} role={role} syncTick={syncTick} />;
      case 'timing':
        return <Timing t={t} role={role} syncTick={syncTick} />;
      case 'results':
        return <Results t={t} syncTick={syncTick} />;
      case 'leaderboard':
        return <Leaderboard t={t} syncTick={syncTick} />;
      case 'player_ranking':
        return <PlayerRanking t={t} syncTick={syncTick} />;
      case 'incidents':
        return <Incidents t={t} role={role} syncTick={syncTick} />;
      case 'substitutions':
        return <Substitutions t={t} role={role} syncTick={syncTick} />;
      case 'notifications':
        return <Notifications t={t} syncTick={syncTick} />;
      default:
        return <Dashboard t={t} setTab={handleTabChange} syncTick={syncTick} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <a href="#/" className="navbar-brand" onClick={() => handleTabChange('dashboard')}>
          <div className="navbar-logo">🏋️‍♂️</div>
          <div className="navbar-title-container">
            <h1 className="navbar-title">{t('yes') === 'نعم' ? 'بطولة البطل الحديدي 2026' : 'Iron Champion 2026'}</h1>
            <span className="navbar-subtitle">بطولة التتابع للموانع / Obstacle Relay Championship</span>
          </div>
        </a>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Simulated Role Selection for Testing */}
          <div className="selector-group">
            <button 
              className={`selector-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
              title={t('admin')}
            >
              {language === 'ar' ? 'مشرف' : 'Admin'}
            </button>
            <button 
              className={`selector-btn ${role === 'timekeeper' ? 'active' : ''}`}
              onClick={() => setRole('timekeeper')}
              title={t('timekeeper')}
            >
              {language === 'ar' ? 'حكم' : 'Judge'}
            </button>
            <button 
              className={`selector-btn ${role === 'viewer' ? 'active' : ''}`}
              onClick={() => setRole('viewer')}
              title={t('viewer')}
            >
              {language === 'ar' ? 'مشاهد' : 'Spectator'}
            </button>
          </div>

          {/* Current Role badge */}
          <span className={`role-badge ${role}`}>
            🛡️ {t(role)}
          </span>

          {/* Language Switcher */}
          <button className="btn btn-secondary" onClick={toggleLanguage} style={{ padding: '0.4rem 0.8rem' }}>
            <Globe size={16} style={{ marginInlineEnd: '0.25rem' }} />
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="main-wrapper">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          {menuItems.map(item => (
            <div 
              key={item.id} 
              className={`sidebar-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="badge refunded number-text" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </aside>

        {/* Dynamic Page Screen */}
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
