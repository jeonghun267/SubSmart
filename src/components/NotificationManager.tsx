"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface NotificationContextType {
  enabled: boolean;
  permission: NotificationPermission | "default";
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  sendNotification: (title: string, body: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  enabled: false,
  permission: "default",
  enableNotifications: async () => false,
  disableNotifications: () => {},
  sendNotification: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export default function NotificationManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      const saved = localStorage.getItem("subsmart-notifications");
      setEnabled(saved === "true" && Notification.permission === "granted");
    }
  }, []);

  async function enableNotifications(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      setEnabled(true);
      localStorage.setItem("subsmart-notifications", "true");
      // Send a test notification
      new Notification("SubSmart", {
        body: "알림이 활성화되었습니다!",
        icon: "/icon-192.png",
      });
      return true;
    }
    return false;
  }

  function disableNotifications() {
    setEnabled(false);
    localStorage.setItem("subsmart-notifications", "false");
  }

  function sendNotification(title: string, body: string) {
    if (enabled && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  }

  return (
    <NotificationContext.Provider
      value={{ enabled, permission, enableNotifications, disableNotifications, sendNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
