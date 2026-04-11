import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { on, off } = useSocket() || {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!on) return;
    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      toast.custom((t) => (
        <div style={{
          background: '#1e293b', color: '#f1f5f9', padding: '12px 16px',
          borderRadius: '12px', borderLeft: '4px solid #6366f1',
          maxWidth: '320px', fontSize: '14px',
          opacity: t.visible ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{notif.title}</div>
          <div style={{ color: '#94a3b8' }}>{notif.message}</div>
        </div>
      ), { duration: 5000 });
    };
    on('notification', handler);
    return () => off?.('notification', handler);
  }, [on, off]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
