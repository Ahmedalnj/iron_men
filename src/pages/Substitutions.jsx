import React, { useState, useEffect } from 'react';
import { 
  getTeams, 
  getPlayersByTeam, 
  executeSubstitution, 
  getSubstitutions,
  revertSubstitution
} from '../state';
import { RefreshCw, Clipboard, Check, AlertCircle, Trash2 } from 'lucide-react';

export default function Substitutions({ t, role, syncTick }) {
  const canEdit = role === 'admin' || role === 'timekeeper';

  const [teams, setTeams] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(''); // e.g. "A-1"
  const [selectedReserveId, setSelectedReserveId] = useState('');
  
  const [teamStarters, setTeamStarters] = useState([]);
  const [teamReserves, setTeamReserves] = useState([]);

  const [reason, setReason] = useState('Injury');
  const [approvingJudge, setApprovingJudge] = useState('رئيس الحكام');
  const [subTime, setSubTime] = useState('');

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    setSubstitutions(getSubstitutions().reverse());

    if (loadedTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(loadedTeams[0].team_number);
    }
  };

  useEffect(() => {
    loadData();
    // Default time to current
    const now = new Date();
    setSubTime(now.toTimeString().slice(0, 5));
  }, [syncTick]);

  // Fetch players when selected team changes
  useEffect(() => {
    if (selectedTeam) {
      const allTeamPlayers = getPlayersByTeam(selectedTeam);
      
      // Starters currently active in legs 1-3
      const starters = allTeamPlayers.filter(p => p.player_type === 'Starter' && p.status !== 'Substituted');
      // Reserves currently active
      const reserves = allTeamPlayers.filter(p => p.player_type === 'Reserve' && p.status !== 'Substituted');
      
      setTeamStarters(starters);
      setTeamReserves(reserves);
      
      if (starters.length > 0) {
        setSelectedSlot(starters[0].player_key);
      } else {
        setSelectedSlot('');
      }

      if (reserves.length > 0) {
        setSelectedReserveId(reserves[0].id);
      } else {
        setSelectedReserveId('');
      }
    }
  }, [selectedTeam, substitutions]); // refresh when selectedTeam or history changes

  const handleSave = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!selectedSlot) {
      setError(t('yes') === 'نعم' ? 'لا يوجد لاعب أساسي نشط للاستبدال!' : 'No active starting slot available!');
      return;
    }
    if (!selectedReserveId) {
      setError(t('yes') === 'نعم' ? 'لا يوجد لاعب احتياطي متاح لهذا الفريق!' : 'No reserve player available for this team!');
      return;
    }

    try {
      executeSubstitution(
        selectedTeam,
        selectedSlot,
        selectedReserveId,
        reason,
        approvingJudge,
        subTime
      );

      setMsg(t('yes') === 'نعم' ? 'تمت عملية التبديل وتعديل رمز الخانات بنجاح!' : 'Substitution executed successfully!');
      setError('');
      loadData();
      
      const now = new Date();
      setSubTime(now.toTimeString().slice(0, 5));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevert = (id) => {
    if (!canEdit) return;
    if (window.confirm(t('delete_confirm'))) {
      try {
        revertSubstitution(id);
        setMsg(t('yes') === 'نعم' ? 'تم التراجع عن التبديل واستعادة اللاعب بنجاح!' : 'Substitution reverted and player restored successfully!');
        setError('');
        loadData();
        setTimeout(() => setMsg(''), 3000);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getReplacedPlayerName = () => {
    const found = teamStarters.find(p => p.player_key === selectedSlot);
    return found ? found.full_name : '';
  };

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {t('substitutions')}
      </h1>

      {msg && <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' }}>{msg}</div>}
      {error && <div className="alert-banner critical">{error}</div>}

      <div className="grid-2">
        {/* Wizard Form */}
        {canEdit && (
          <form onSubmit={handleSave} className="card">
            <div className="card-header">
              <h2 className="card-title">🔄 {t('sub_wizard')}</h2>
            </div>

            <div style={{ background: 'rgba(14, 19, 43, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">{t('select_team')}</label>
                <select 
                  className="form-select number-text"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  {teams.map(t => (
                    <option key={t.team_number} value={t.team_number}>
                      {t.team_number} - {t.team_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t('replaced_player')} (Starter)</label>
                {teamStarters.length > 0 ? (
                  <select 
                    className="form-select"
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                  >
                    {teamStarters.map(p => (
                      <option key={p.id} value={p.player_key}>
                        {p.player_key} - {p.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" className="form-input" disabled value="لا يوجد لاعبين أساسيين متوفرين" />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('replacement_player')} (Reserve)</label>
                {teamReserves.length > 0 ? (
                  <select 
                    className="form-select"
                    value={selectedReserveId}
                    onChange={(e) => setSelectedReserveId(e.target.value)}
                  >
                    {teamReserves.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.player_key} - {p.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: '#f87171', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                    ⚠️ {t('limit_reached')}
                  </div>
                )}
              </div>
            </div>

            {selectedSlot && (
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.75rem', borderRadius: '6px', margin: '0.5rem 0 1rem 0', fontSize: '0.9rem' }}>
                📢 <strong>إجراء التبديل:</strong> استبعاد اللاعب <strong>{getReplacedPlayerName()}</strong> وترقية اللاعب المختار من الاحتياط ليأخذ الرمز <strong>{selectedSlot}</strong> للسباق.
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t('reason')}</label>
                <select 
                  className="form-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Injury">{t('Injury_Reason')}</option>
                  <option value="Withdrawal">{t('Withdrawal_Reason')}</option>
                  <option value="Late Arrival">{t('Late_Arrival')}</option>
                  <option value="Disqualification">{t('Disqualification')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('approving_judge')}</label>
                <select 
                  className="form-select"
                  value={approvingJudge}
                  onChange={(e) => setApprovingJudge(e.target.value)}
                >
                  <option value="رئيس الحكام">رئيس الحكام</option>
                  <option value="الحكم الأول">الحكم الأول</option>
                  <option value="الحكم الثاني">الحكم الثاني</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('sub_time')}</label>
              <input 
                type="time" 
                className="form-input timer-text"
                value={subTime}
                onChange={(e) => setSubTime(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }} disabled={teamReserves.length === 0 || !selectedSlot}>
              <RefreshCw size={18} /> {t('execute_sub')}
            </button>
          </form>
        )}

        {/* Substitutions History log */}
        <div className="card" style={{ gridColumn: !canEdit ? 'span 2' : 'span 1' }}>
          <div className="card-header">
            <h2 className="card-title">📋 {t('sub_history')}</h2>
          </div>
          <div className="table-container" style={{ border: 'none', marginBottom: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('sub_time')}</th>
                  <th>{t('player_key')}</th>
                  <th>{t('replaced_player')}</th>
                  <th>{t('replacement_player')}</th>
                  <th>{t('reason')}</th>
                  <th>{t('approving_judge')}</th>
                  {canEdit && <th>{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {substitutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      {t('yes') === 'نعم' ? 'لا توجد تبديلات مسجلة.' : 'No substitutions logged yet.'}
                    </td>
                  </tr>
                ) : (
                  substitutions.map(sub => (
                    <tr key={sub.id}>
                      <td className="number-text">{sub.substitution_time}</td>
                      <td className="number-text" style={{ fontWeight: 'bold' }}>{sub.player_key}</td>
                      <td>{sub.original_player_name}</td>
                      <td>{sub.replacement_player_name || <span style={{ color: '#9ca3af' }}>بانتظار الاختيار / TBD</span>}</td>
                      <td>{t(sub.reason + '_Reason') || t(sub.reason) || sub.reason}</td>
                      <td>{sub.approving_judge}</td>
                      {canEdit && (
                        <td>
                          <button 
                            className="btn btn-danger btn-icon" 
                            onClick={() => handleRevert(sub.id)}
                            title={t('delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
