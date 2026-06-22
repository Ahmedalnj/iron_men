import React, { useState, useEffect } from 'react';
import { getPlayers, getIncidents, upsertIncident, deleteIncident } from '../state';
import { ShieldAlert, Trash2, Check, X, Shield } from 'lucide-react';

export default function Incidents({ t, role, syncTick }) {
  const canEdit = role === 'admin' || role === 'timekeeper';

  const [players, setPlayers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  
  const [formData, setFormData] = useState({
    id: '',
    player_key: '',
    incident_time: '',
    incident_type: 'Injury',
    body_part: 'Other',
    severity: 'Minor',
    continued: true
  });
  
  const [msg, setMsg] = useState('');

  const loadData = () => {
    setPlayers(getPlayers().filter(p => p.status !== 'Substituted'));
    setIncidents(getIncidents().reverse());
  };

  useEffect(() => {
    loadData();
    // Default time to current hh:mm
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setFormData(prev => ({ ...prev, incident_time: timeStr }));
  }, [syncTick]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!formData.player_key) {
      alert(t('yes') === 'نعم' ? 'الرجاء اختيار لاعب' : 'Please select a player.');
      return;
    }

    upsertIncident({
      ...formData,
      continued: !!formData.continued
    });

    setMsg(t('yes') === 'نعم' ? 'تم تسجيل الحادثة بنجاح!' : 'Incident logged successfully!');
    loadData();
    
    // Reset form
    const now = new Date();
    setFormData({
      id: '',
      player_key: '',
      incident_time: now.toTimeString().slice(0, 5),
      incident_type: 'Injury',
      body_part: 'Other',
      severity: 'Minor',
      continued: true
    });

    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = (id) => {
    if (!canEdit) return;
    if (window.confirm(t('delete_confirm'))) {
      deleteIncident(id);
      loadData();
    }
  };

  // Resolve player name helper
  const getPlayerName = (key) => {
    const p = players.find(x => x.player_key === key);
    return p ? p.full_name : t('unregistered');
  };

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {t('incidents')}
      </h1>

      {msg && <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' }}>{msg}</div>}

      <div className="grid-2">
        {/* Log Incident Form */}
        {canEdit && (
          <form onSubmit={handleSave} className="card">
            <div className="card-header">
              <h2 className="card-title">🚨 {t('log_incident')}</h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t('full_name')} / Player</label>
                <select 
                  className="form-select"
                  value={formData.player_key}
                  onChange={(e) => setFormData({ ...formData, player_key: e.target.value })}
                  required
                >
                  <option value="">-- اختر اللاعب --</option>
                  {players.map(p => (
                    <option key={p.id} value={p.player_key}>
                      {p.player_key} - {p.full_name} ({p.team_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('incident_time')}</label>
                <input 
                  type="time" 
                  className="form-input timer-text"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t('incident_type')}</label>
                <select 
                  className="form-select"
                  value={formData.incident_type}
                  onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                >
                  <option value="Injury">{t('Injury')}</option>
                  <option value="Fall">{t('Fall')}</option>
                  <option value="Equipment Failure">{t('Equipment_Failure')}</option>
                  <option value="Medical Stop">{t('Medical_Stop')}</option>
                  <option value="Withdrawal">{t('Withdrawal')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('body_part')}</label>
                <select 
                  className="form-select"
                  value={formData.body_part}
                  onChange={(e) => setFormData({ ...formData, body_part: e.target.value })}
                >
                  <option value="Head">{t('Head')}</option>
                  <option value="Neck">{t('Neck')}</option>
                  <option value="Shoulder">{t('Shoulder')}</option>
                  <option value="Arm">{t('Arm')}</option>
                  <option value="Hand">{t('Hand')}</option>
                  <option value="Back">{t('Back')}</option>
                  <option value="Hip">{t('Hip')}</option>
                  <option value="Knee">{t('Knee')}</option>
                  <option value="Ankle">{t('Ankle')}</option>
                  <option value="Foot">{t('Foot')}</option>
                  <option value="Other">{t('Other')}</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t('severity')}</label>
                <select 
                  className="form-select"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="Minor">{t('Minor')}</option>
                  <option value="Moderate">{t('Moderate')}</option>
                  <option value="Severe">{t('Severe')}</option>
                  <option value="Critical">{t('Critical')}</option>
                </select>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="continued"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  checked={formData.continued}
                  onChange={(e) => setFormData({ ...formData, continued: e.target.checked })}
                />
                <label htmlFor="continued" className="form-label" style={{ cursor: 'pointer', color: '#fff' }}>
                  {t('continued')}
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
              <ShieldAlert size={18} /> {t('save_incident')}
            </button>
          </form>
        )}

        {/* Incident History Table */}
        <div className="card" style={{ gridColumn: !canEdit ? 'span 2' : 'span 1' }}>
          <div className="card-header">
            <h2 className="card-title">📋 {t('yes') === 'نعم' ? 'سجل الحوادث والتدخلات' : 'Safety Logs'}</h2>
          </div>
          <div className="table-container" style={{ border: 'none', marginBottom: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('incident_time')}</th>
                  <th>{t('player_key')}</th>
                  <th>{t('full_name')}</th>
                  <th>{t('incident_type')}</th>
                  <th>{t('severity')}</th>
                  <th>{t('continued')}</th>
                  {canEdit && <th>{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }}>
                      {t('yes') === 'نعم' ? 'لا توجد حوادث مسجلة.' : 'No incidents logged yet.'}
                    </td>
                  </tr>
                ) : (
                  incidents.map(inc => (
                    <tr key={inc.id}>
                      <td className="number-text">{inc.incident_time}</td>
                      <td className="number-text" style={{ fontWeight: 'bold' }}>{inc.player_key}</td>
                      <td style={{ fontWeight: 600 }}>{getPlayerName(inc.player_key)}</td>
                      <td>{t(inc.incident_type) || inc.incident_type}</td>
                      <td>
                        <span className={`badge ${inc.severity.toLowerCase()}`}>
                          {t(inc.severity) || inc.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${inc.continued ? 'approved' : 'refunded'}`}>
                          {inc.continued ? t('yes') : t('no')}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <button 
                            className="btn btn-danger btn-icon" 
                            onClick={() => handleDelete(inc.id)}
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
