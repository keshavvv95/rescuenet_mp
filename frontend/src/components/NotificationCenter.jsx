import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Bell, CheckCircle2, AlertTriangle, Info, Check, X, ShieldAlert, Heart } from 'lucide-react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    notifications.forEach(n => {
      if (!n.read) {
        apiClient.markNotificationRead(n.id).catch(() => {});
      }
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };


  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden fade-in-up">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No notifications available
                </div>
              ) : (
                notifications.map((n) => {
                  const IconComponent = n.icon || Info;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 transition-colors cursor-pointer flex gap-3 group relative ${
                        n.read ? 'bg-slate-900/40 hover:bg-slate-800/40' : 'bg-slate-800/60 hover:bg-slate-800/80 border-l-2 border-emerald-500'
                      }`}
                    >
                      <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${n.color} shrink-0 self-start`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 pr-6">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-semibold ${n.read ? 'text-slate-300' : 'text-slate-100'}`}>
                            {n.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                          {n.time}
                        </span>
                      </div>
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity absolute right-3 top-3"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500">
                RescueNet Real-Time Notification Stream Active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
