import React, { useState, useEffect } from 'react';
import { getLiveLeaderboard } from '../state';
import { formatDurationLabel, formatGapLabel } from '../utils/timeHelpers';
import { Monitor, X, Clock, Award } from 'lucide-react';

export default function Leaderboard({ t, syncTick }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [projectorMode, setProjectorMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isArabic = t('yes') === 'نعم';

  const loadLeaderboard = () => {
    setLeaderboard(getLiveLeaderboard());
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 4000); // refresh every 4s
    return () => clearInterval(interval);
  }, [syncTick]);

  // Update clock for projector mode
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const top3 = leaderboard.filter(team => !team.is_incomplete && team.has_times).slice(0, 3);
  
  // Format local clock
  const formattedClock = currentTime.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Handle exiting projector mode with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProjectorMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (projectorMode) {
    return (
      <div className="projector-container">
        {/* Projector Header */}
        <div className="projector-header">
          <div className="projector-title">
            🏆 {t('yes') === 'نعم' ? 'لوحة الترتيب المباشرة - البطل الحديدي 2026' : 'Live Standings - Iron Champion 2026'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div className="projector-time timer-text" style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={24} /> {formattedClock}
            </div>
            <button className="btn btn-secondary" onClick={() => setProjectorMode(false)} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              <X size={18} /> {t('exit_projector')}
            </button>
          </div>
        </div>

        {/* Projector Podium Visuals (Top 3) */}
        {top3.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2rem', margin: '1rem 0 3rem 0', height: '180px' }}>
            {/* 2nd place */}
            {top3[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                <span className="badge silver" style={{ padding: '0.4rem 0.8rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  {t('silver')}
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#fff', textAlign: 'center', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {top3[1].team_name}
                </strong>
                <span className="timer-text" style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
                  {formatDurationLabel(top3[1].total_result_seconds, { locale: isArabic ? 'ar' : 'en' })}
                </span>
                <div style={{ height: '70px', width: '100%', background: 'linear-gradient(to top, #1e293b, #475569)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '1px solid #64748b', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: '#94a3b8' }}>2</div>
              </div>
            )}

            {/* 1st place */}
            {top3[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
                <Award size={32} style={{ color: 'var(--color-gold)', marginBottom: '0.25rem', filter: 'drop-shadow(0 0 8px var(--color-gold-glow))' }} />
                <span className="badge approved" style={{ background: 'var(--color-gold)', color: '#000', border: 'none', padding: '0.4rem 0.8rem', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                  {t('gold')}
                </span>
                <strong style={{ fontSize: '1.8rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)', textAlign: 'center', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {top3[0].team_name}
                </strong>
                <span className="timer-text" style={{ fontSize: '1.5rem', color: 'var(--color-gold)', fontWeight: 800 }}>
                  {formatDurationLabel(top3[0].total_result_seconds, { locale: isArabic ? 'ar' : 'en' })}
                </span>
                <div style={{ height: '100px', width: '100%', background: 'linear-gradient(to top, #78350f, #d97706)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '1px solid var(--color-gold)', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 900, color: '#fbbf24' }}>1</div>
              </div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                <span className="badge bronze" style={{ padding: '0.4rem 0.8rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  {t('bronze')}
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#fff', textAlign: 'center', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {top3[2].team_name}
                </strong>
                <span className="timer-text" style={{ fontSize: '1.2rem', color: '#b45309' }}>
                  {formatDurationLabel(top3[2].total_result_seconds, { locale: isArabic ? 'ar' : 'en' })}
                </span>
                <div style={{ height: '50px', width: '100%', background: 'linear-gradient(to top, #451a03, #78350f)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '1px solid #b45309', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#b45309' }}>3</div>
              </div>
            )}
          </div>
        )}

        {/* Projector Table */}
        <div style={{ flex: '1', overflowY: 'auto' }}>
          <table className="projector-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>{t('rank')}</th>
                <th>{t('team_name')}</th>
                <th style={{ width: '220px' }}>{t('gap')}</th>
                <th style={{ width: '250px' }}>{t('total_time')}</th>
                <th style={{ width: '200px' }}>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', fontSize: '2rem', color: '#9ca3af' }}>
                    {t('no_results')}
                  </td>
                </tr>
              ) : (
                leaderboard.map((team, index) => {
                  let rowClass = '';
                  if (!team.is_incomplete && team.has_times) {
                    if (team.rank === 1) rowClass = 'rank-row-1';
                    else if (team.rank === 2) rowClass = 'rank-row-2';
                    else if (team.rank === 3) rowClass = 'rank-row-3';
                  }

                  return (
                    <tr key={team.team_number} className={rowClass}>
                      <td>
                        <div className={`projector-rank-badge ${team.rank === 1 ? 'gold' : team.rank === 2 ? 'silver' : team.rank === 3 ? 'bronze' : 'other'}`} style={{ color: team.rank <= 3 ? '#000' : '#fff' }}>
                          {team.rank}
                        </div>
                      </td>
                      <td style={{ fontWeight: 800 }}>
                        <span className="timer-text" style={{ color: 'var(--color-primary-hover)', marginInlineEnd: '1rem', opacity: 0.8 }}>[{team.team_number}]</span>
                        {team.team_name}
                      </td>
                      <td className="timer-text" style={{ color: '#f87171' }}>
                        {team.gap_to_first > 0 ? formatGapLabel(team.gap_to_first, { locale: isArabic ? 'ar' : 'en' }) : team.gap_to_first === 0 ? '—' : ''}
                      </td>
                      <td>
                        {team.is_incomplete ? (
                          <span style={{ color: '#f87171' }}>{team.result_status}</span>
                        ) : (
                          <span className="timer-text projector-timer" style={{ color: team.rank === 1 ? 'var(--color-gold)' : '#fff' }}>
                            {formatDurationLabel(team.total_result_seconds, { locale: isArabic ? 'ar' : 'en' })}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${team.result_status.toLowerCase()}`} style={{ fontSize: '1.2rem', padding: '0.35rem 0.75rem' }}>
                          {t(team.result_status) || team.result_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          {t('leaderboard')}
        </h1>
        <button className="btn btn-primary" onClick={() => setProjectorMode(true)}>
          <Monitor size={18} /> {t('projector_mode')}
        </button>
      </div>

      {/* Podium Display standard */}
      {top3.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {top3.map((team, idx) => (
            <div 
              key={team.team_number} 
              className={`card rank-${idx + 1}`} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem', 
                margin: 0,
                border: '1px solid var(--border-color)'
              }}
            >
              <div 
                className={`rank-badge ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze'}`} 
                style={{ width: '48px', height: '48px', fontSize: '1.5rem', color: idx <= 1 ? '#000' : '#fff' }}
              >
                {idx + 1}
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.25rem' }}>{team.team_name}</h3>
                <span className="number-text" style={{ fontSize: '0.9rem', color: '#9ca3af' }}>{t('team_num')}: {team.team_number}</span>
              </div>
              <div className="timer-text" style={{ fontSize: '1.8rem', fontWeight: 800, color: idx === 0 ? 'var(--color-gold)' : '#fff' }}>
                {formatDurationLabel(team.total_result_seconds, { locale: isArabic ? 'ar' : 'en' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Table Grid */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('rank')}</th>
              <th>{t('team_num')}</th>
              <th>{t('team_name')}</th>
              <th>{t('gap')}</th>
              <th>{t('total_time')}</th>
              <th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('no_results')}
                </td>
              </tr>
            ) : (
              leaderboard.map(team => (
                <tr key={team.team_number} className={!team.is_incomplete && team.has_times ? `rank-${team.rank}` : ''}>
                  <td>
                    <div className={`rank-badge ${!team.is_incomplete && team.has_times ? (team.rank === 1 ? 'gold' : team.rank === 2 ? 'silver' : team.rank === 3 ? 'bronze' : 'other') : 'other'}`}>
                      {team.rank}
                    </div>
                  </td>
                  <td className="number-text" style={{ fontWeight: 800 }}>{team.team_number}</td>
                  <td style={{ fontWeight: 700 }}>{team.team_name}</td>
                  <td className="timer-text" style={{ color: '#f87171' }}>
                    {team.gap_to_first > 0 ? formatGapLabel(team.gap_to_first, { locale: isArabic ? 'ar' : 'en' }) : team.gap_to_first === 0 ? '—' : ''}
                  </td>
                  <td>
                    {team.is_incomplete ? (
                      <span className="badge refunded">{team.result_status}</span>
                    ) : (
                      <span className="timer-text" style={{ fontWeight: 800, color: 'var(--color-primary-hover)' }}>
                        {formatDurationLabel(team.total_result_seconds, { locale: isArabic ? 'ar' : 'en' })}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${team.result_status.toLowerCase()}`}>
                      {t(team.result_status) || team.result_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
