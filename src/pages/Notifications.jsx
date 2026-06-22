import React, { useState, useEffect } from 'react';
import { getNotificationLog } from '../state';
import { Bell, ShieldAlert, CheckSquare, RefreshCw } from 'lucide-react';

export default function Notifications({ t, syncTick }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = () => {
      setNotifications(getNotificationLog());
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 4000); // refresh every 4s
    return () => clearInterval(interval);
  }, [syncTick]);

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
        {t('notifications')}
      </h1>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🔔 {t('notification_title')}</h2>
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.5 }} />
            {t('no_notifications')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(notif => {
              // Action tag styling
              let actionClass = 'badge ';
              if (notif.action.includes('Continue') || notif.action.includes('✅')) {
                actionClass += 'approved';
              } else if (notif.action.includes('Review') || notif.action.includes('🔄') || notif.action.includes('⚠️') || notif.action.includes('reserve')) {
                actionClass += 'pending';
              } else {
                actionClass += 'refunded';
              }

              const isIncident = notif.type === 'incident';

              return (
                <div 
                  key={notif.id} 
                  className="card" 
                  style={{ 
                    margin: 0, 
                    background: isIncident ? 'rgba(245, 158, 11, 0.02)' : 'rgba(239, 68, 68, 0.02)',
                    borderColor: isIncident ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    padding: '1.25rem'
                  }}
                >
                  <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{notif.icon}</span>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '1rem' }}>
                          {notif.team_name}
                        </strong>
                        <span className="number-text ml-2" style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                          [{notif.team_number}]
                        </span>
                      </div>
                    </div>
                    <span className="timer-text" style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      ⏱️ {notif.time}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#e5e7eb', paddingInlineStart: '2.25rem' }}>
                    <strong>اللاعب / Roster Name:</strong> {notif.player_name} <br />
                    <strong>التفاصيل / Details:</strong> {notif.details}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />

                  <div className="flex-between" style={{ paddingInlineStart: '2.25rem' }}>
                    <span className="form-label">{t('required_action')}:</span>
                    <span className={actionClass} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {notif.action}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
