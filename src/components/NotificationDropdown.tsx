"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  GraduationCap,
  Tags,
  AlertTriangle,
  Users,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { seedNotifications, type Notification } from "@/lib/data";

const typeIcons: Record<Notification["type"], typeof FileText> = {
  sds: FileText,
  training: GraduationCap,
  labels: Tags,
  osha: AlertTriangle,
  contractor: Users,
};

const typeColors: Record<Notification["type"], string> = {
  sds: "text-blue-400",
  training: "text-amber-400",
  labels: "text-purple-400",
  osha: "text-status-red",
  contractor: "text-emerald-400",
};

export default function NotificationDropdown({ onAction }: { onAction?: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAction = (n: Notification) => {
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    if (n.actionLabel === "Follow Up" || n.actionLabel === "Send Reminder") {
      onAction?.(`${n.actionLabel === "Follow Up" ? "Follow-up email sent" : "Reminder sent"} for ${n.title.split(": ")[1] || n.title}`);
      setOpen(false);
    } else if (n.actionLabel === "Learn More") {
      onAction?.("Opening OSHA HazCom 2024 update information...");
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-status-red text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-navy-900 border border-navy-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700">
            <h3 className="font-display font-bold text-sm text-white">
              Notifications {unreadCount > 0 && <span className="text-gray-500">({unreadCount} new)</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-status-green mx-auto mb-2" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type];
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-navy-700/30 hover:bg-navy-800/50 transition-colors ${
                      !n.read ? "bg-navy-800/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-7 w-7 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`h-3.5 w-3.5 ${typeColors[n.type]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!n.read ? "text-white" : "text-gray-300"}`}>
                            {n.title}
                          </p>
                          <button
                            onClick={() => dismiss(n.id)}
                            className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{n.detail}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-600">{n.time}</span>
                          {n.actionLabel && (
                            n.actionHref && n.actionLabel !== "Follow Up" && n.actionLabel !== "Send Reminder" && n.actionLabel !== "Learn More" ? (
                              <Link
                                href={n.actionHref}
                                onClick={() => { setOpen(false); setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x)); }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                {n.actionLabel} <ArrowRight className="h-3 w-3" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleAction(n)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                {n.actionLabel} <ArrowRight className="h-3 w-3" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                    {!n.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
