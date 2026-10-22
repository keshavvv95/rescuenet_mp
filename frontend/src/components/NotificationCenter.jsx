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
        className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-all focus:outline-none cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 stroke-[1.75]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-[9px] font-bold text-white animate-pulse">
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
          
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden fade-in-up">
            <div className="p-4 border-b border-slate-800 bg-[#0F172A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FFB703] stroke-[2]" />
                <h3 className="font-heading font-bold text-sm text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold font-mono shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#FFB703] hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Check className="w-3 h-3 stroke-[2.5]" /> Mark read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
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
                        n.read ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/50 hover:bg-orange-50 border-l-4 border-orange-500'
                      }`}
                    >
                      <div className={`p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 ${n.color || 'text-orange-600'} shrink-0 self-start`}>
                        <IconComponent className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="flex-1 pr-6">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-heading font-bold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                            {n.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                          {n.time}
                        </span>
                      </div>
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity absolute right-3 top-3 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium">
                RescueNet Real-Time Notification Stream Active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
