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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Notifications</h1>
          <p className="text-sm text-[#64748b] mt-1">Stay updated with your workspace activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 py-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-[#e2e8f0] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#f1f5f9] rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-[#f1f5f9] rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-[#e2e8f0]">
            {notifications.map((notif, i) => {
              const notifData = notif.data || {};
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 py-4 px-2 rounded-lg transition-colors cursor-pointer hover:bg-[#f8fafc] animate-fade-in ${
                    !notif.read_at ? 'bg-primary-50/30' : ''
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => !notif.read_at && handleMarkRead(notif.id)}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!notif.read_at ? 'bg-primary-500 shadow-sm shadow-primary-500/30' : 'bg-[#e2e8f0]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read_at ? 'font-semibold text-[#0f172a]' : 'text-[#475569]'}`}>
                      {notifData.title || notifData.message || notif.type || 'Notification'}
                    </p>
                    {notifData.message && notifData.title && (
                      <p className="text-xs text-[#64748b] mt-0.5">{notifData.message}</p>
                    )}
                    <p className="text-xs text-[#94a3b8] mt-1.5">
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  {!notif.read_at && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex-shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#64748b]">No notifications yet</p>
            <p className="text-xs text-[#94a3b8] mt-1">We'll notify you when something arrives</p>
          </div>
        )}
      </Card>
    </div>
  );
}
