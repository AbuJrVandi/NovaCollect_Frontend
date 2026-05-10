import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { notificationService } from '../../services/notificationService';
import useAppStore from '../../store/useAppStore';

export default function Notifications() {
  const addToast = useAppStore((s) => s.addToast);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.list()
      .then(({ data }) => setNotifications(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load notifications' }))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (notifId) => {
    try {
      await notificationService.markRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      addToast({ type: 'error', message: 'Failed to mark as read' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      addToast({ type: 'success', message: 'All notifications marked as read' });
    } catch {
      addToast({ type: 'error', message: 'Failed to mark all as read' });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="page-shell">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Workspace Updates</div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated with your workspace activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card title="Activity Feed" subtitle="Unread alerts, workflow updates, and system messages appear here.">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 py-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-[#e2e8f0] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton skeleton-line w-1/3" />
                  <div className="skeleton skeleton-line w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div>
            {notifications.map((notif, i) => {
              const notifData = notif.data || {};
              const isUnread = !notif.read_at;
              return (
                <div key={notif.id}>
                  <div
                    className={`notif-item animate-fade-in ${isUnread ? 'notif-item-unread' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => !notif.read_at && handleMarkRead(notif.id)}
                  >
                    <div className={`notif-dot ${isUnread ? 'notif-dot-unread' : 'notif-dot-read'}`} />
                    <div className="notif-body">
                      <p className={`notif-title ${isUnread ? 'notif-title-unread' : 'notif-title-read'}`}>
                        {notifData.title || notifData.message || notif.type || 'Notification'}
                      </p>
                      {notifData.message && notifData.title && (
                        <p className="notif-message">{notifData.message}</p>
                      )}
                      <p className="notif-time">
                        {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                    {!notif.read_at && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                        className="notif-mark"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  {i < notifications.length - 1 && <div className="notif-divider" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="empty-state-title">No notifications yet</p>
            <p className="empty-state-desc">We'll notify you when something arrives</p>
          </div>
        )}
      </Card>
    </div>
  );
}
