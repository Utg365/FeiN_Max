'use client';

import { useTrading } from '../context/TradingContext';

const ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  info:    'fa-circle-info',
};

export default function NotificationContainer() {
  const { notifications } = useTrading();

  return (
    <div className="notification-container">
      {notifications.map(n => (
        <div key={n.id} className={`toast ${n.type}`}>
          <i className={`fa-solid ${ICONS[n.type] || ICONS.info}`} style={{ fontSize: 16, flexShrink: 0 }} />
          <span>{n.message}</span>
        </div>
      ))}
    </div>
  );
}
