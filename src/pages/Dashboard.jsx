import React, { useEffect, useState } from 'react';
import { 
  getTeams, 
  getPlayers, 
  getCheckIns, 
  getIncidents, 
  getUncheckedPlayers 
} from '../state';
import { Shield, AlertTriangle, Play, Award, CheckSquare, Clipboard } from 'lucide-react';

export default function Dashboard({ t, setTab, syncTick }) {
  const [stats, setStats] = useState({
    teamsCount: 0,
    playersCount: 0,
    checkInsCount: 0,
    incidentsCount: 0
  });
  const [unchecked, setUnchecked] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const loadStats = () => {
      const teams = getTeams();
      const players = getPlayers();
      const checkins = getCheckIns();
      const incs = getIncidents();
      const unchk = getUncheckedPlayers();

      setStats({
        teamsCount: teams.length,
        playersCount: players.filter(p => p.status === 'Ready').length,
        checkInsCount: checkins.filter(c => c.present === 'Present' && c.cleared_to_compete).length,
        incidentsCount: incs.length
      });
      setUnchecked(unchk);
      setIncidents(incs.slice(-5).reverse()); // Show last 5 incidents
    };

    loadStats();
    // Refresh stats every 5s in case of updates
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [syncTick]);

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {t('dashboard')}
      </h1>

      {/* Warning Box for Unchecked Players */}
      {unchecked.length > 0 ? (
        <div className="alert-banner critical">
          <AlertTriangle size={24} />
          <div>
            <div className="alert-banner-title">{t('unchecked_warn')}</div>
            <div className="alert-banner-desc">
              <strong>{unchecked.length}</strong> {t('unchecked_count')}.{' '}
              <button 
                onClick={() => setTab('checkin')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'inherit', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                {t('checkin')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
          <CheckSquare size={24} />
          <div>
            <div className="alert-banner-title">{t('no_unchecked')}</div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setTab('teams')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-value timer-text">{stats.teamsCount}</span>
            <span className="stat-label">{t('stats_teams')}</span>
          </div>
          <div className="stat-icon">
            <Clipboard size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => setTab('players')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-value timer-text">{stats.playersCount}</span>
            <span className="stat-label">{t('stats_players')}</span>
          </div>
          <div className="stat-icon">
            <Award size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => setTab('checkin')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-value timer-text">{stats.checkInsCount}</span>
            <span className="stat-label">{t('stats_checkins')}</span>
          </div>
          <div className="stat-icon">
            <CheckSquare size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => setTab('incidents')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-value timer-text">{stats.incidentsCount}</span>
            <span className="stat-label">{t('stats_incidents')}</span>
          </div>
          <div className="stat-icon" style={{ color: '#fbbf24' }}>
            <Shield size={24} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Quick Links Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🚀 إجراءات سريعة / Quick Actions</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setTab('timing')}>
              ⏱️ {t('timing')}
            </button>
            <button className="btn btn-secondary" onClick={() => setTab('leaderboard')}>
              🥇 {t('leaderboard')}
            </button>
            <button className="btn btn-secondary" onClick={() => setTab('substitutions')}>
              🔄 {t('substitutions')}
            </button>
            <button className="btn btn-danger" onClick={() => setTab('incidents')}>
              🚨 {t('incidents')}
            </button>
          </div>
        </div>

        {/* Safety log card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🚨 {t('recent_incidents')}</h2>
          </div>
          {incidents.length === 0 ? (
            <div style={{ padding: '1rem 0', color: '#9ca3af', textAlign: 'center' }}>
              {t('no_incidents_logged')}
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', marginBottom: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('player_key')}</th>
                    <th>{t('incident_type')}</th>
                    <th>{t('severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc.id}>
                      <td className="number-text">{inc.player_key}</td>
                      <td>{t(inc.incident_type) || inc.incident_type}</td>
                      <td>
                        <span className={`badge ${inc.severity.toLowerCase()}`}>
                          {t(inc.severity) || inc.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
