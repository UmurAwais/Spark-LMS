import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiFetch } from '../config';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Ref to track order count for polling
  const lastOrderCount = useRef(null);

  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Poll for new orders every 30 seconds
  useEffect(() => {
    let interval;
    
    const checkNewOrders = async () => {
      try {
        // Only poll if we have an admin token
        if (!localStorage.getItem('admin_token')) return;

        const res = await apiFetch('/api/orders', {
          headers: { "x-admin-token": localStorage.getItem("admin_token") }
        });
        const data = await res.json();
        
        if (data.ok && data.orders) {
          const currentCount = data.orders.length;
          
          // Initialize count on first run
          if (lastOrderCount.current === null) {
            lastOrderCount.current = currentCount;
            return;
          }

          // If new orders found
          if (currentCount > lastOrderCount.current) {
            const diff = currentCount - lastOrderCount.current;
            addNotification({
              type: 'order',
              title: 'New Order Received',
              message: `${diff} new order(s) have been placed!`,
            });
            lastOrderCount.current = currentCount;
          }
        }
      } catch (error) {
        console.error("Notification polling error:", error);
      }
    };

    // Initial check
    checkNewOrders();
    
    // Set interval
    interval = setInterval(checkNewOrders, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const addNotification = async ({ type = 'info', title, message }) => {
    const newNotif = {
      id: Date.now(),
      type, // 'success', 'error', 'info', 'order'
      title,
      message,
      time: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Play sound based on notification type (only in admin dashboard)
    const isAdminDashboard = window.location.pathname.startsWith('/admin');
    const soundEnabled = localStorage.getItem('notification_sound_enabled');
    const shouldPlaySound = soundEnabled === null || soundEnabled === 'true';
    
    if (isAdminDashboard && shouldPlaySound) {
      try {
        let soundFile;
        if (type === 'error') {
          soundFile = '/sounds/error-sound.mp3';
        } else {
          // For success, info, order, etc.
          soundFile = '/sounds/notification-sound.mp3';
        }
        
        const audio = new Audio(soundFile);
        audio.volume = 0.5; // Set volume to 50%
        audio.play().catch(err => {
          console.log('Sound playback failed:', err);
          // Silently fail if sound can't play (e.g., browser autoplay policy)
        });
      } catch (err) {
        console.log('Sound initialization failed:', err);
      }
    }

    // Persist to backend activity log
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        await apiFetch('/api/admin/activity-logs', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-token': token
          },
          body: JSON.stringify({
            type,
            title,
            message,
            user: 'Admin' // You might want to get the actual user name if available
          })
        });
      }
    } catch (err) {
      console.error('Failed to persist activity log:', err);
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearAll,
      unreadCount 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
