import React, { useState, useEffect } from 'react';
import { getOverallPlayerRanking } from '../state';
import { Search } from 'lucide-react';

function secondsToTimeString(sec) {
  if (sec === null || sec === undefined || sec === '') return '';
  const s = Number(sec);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${mins}:${pad(secs)}`;
}

export default function PlayerRanking({ t, syncTick }) {
  const [rankings, setRankings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadRankings = () => {
      setRankings(getOverallPlayerRanking());
    };
    
    loadRankings();
    const interval = setInterval(loadRankings, 5000);
    return () => clearInterval(interval);
  }, [syncTick]);

  const filtered = rankings.filter(p => 
    p.player_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.player_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {t('player_rank_title')}
      </h1>

      {/* Search Header */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Search size={18} style={{ color: '#9ca3af' }} />
        <input 
          type="text" 
          className="form-input" 
          style={{ width: '100%' }}
          placeholder={t('search').replace('فريق', 'لاعب')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Rankings Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('rank')}</th>
              <th>{t('player_key')}</th>
              <th>{t('full_name')}</th>
              <th>{t('team_name')}</th>
              <th>{t('individual_time')}</th>
              <th>{t('individual_pen')}</th>
              <th>{t('total_time')}</th>
              <th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('yes') === 'نعم' ? 'لا توجد نتائج مطابقة لمنافسين.' : 'No competitor rankings recorded yet.'}
                </td>
              </tr>
            ) : (
              filtered.map(row => {
                let rankClass = '';
                if (row.rank === 1) rankClass = 'rank-1';
                else if (row.rank === 2) rankClass = 'rank-2';
                else if (row.rank === 3) rankClass = 'rank-3';

                return (
                  <tr key={row.player_id} className={rankClass}>
                    <td>
                      <div className={`rank-badge ${row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : row.rank === 3 ? 'bronze' : 'other'}`}>
                        {row.rank}
                      </div>
                    </td>
                    <td className="number-text" style={{ fontWeight: 'bold' }}>{row.player_key}</td>
                    <td style={{ fontWeight: 700 }}>{row.player_name}</td>
                    <td>
                      <span className="number-text" style={{ color: 'var(--color-primary-hover)', fontWeight: 'bold', marginInlineEnd: '0.5rem' }}>
                        [{row.team_number}]
                      </span>
                      {row.team_name}
                    </td>
                    <td className="timer-text">{secondsToTimeString(row.raw_time_seconds)}</td>
                    <td className="timer-text text-danger">
                      {row.penalty_seconds > 0 ? `+${row.penalty_seconds}s` : '0s'}
                    </td>
                    <td>
                      <span className="timer-text" style={{ fontWeight: 800, color: 'var(--color-gold)', fontSize: '1rem' }}>
                        {secondsToTimeString(row.final_time_seconds)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.status.toLowerCase()}`}>
                        {t(row.status) || row.status}
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
