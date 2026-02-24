"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import NotificationDropdown from "./NotificationDropdown";
import { CheckCircle2, X } from "lucide-react";

function NotifToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[70] bg-navy-800 border border-navy-600 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl">
      <CheckCircle2 className="h-5 w-5 text-status-green flex-shrink-0" />
      <span className="text-sm text-white">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white ml-2"><X className="h-4 w-4" /></button>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifToast, setNotifToast] = useState<string | null>(null);

  const handleNotifAction = (msg: string) => {
    setNotifToast(msg);
    setTimeout(() => setNotifToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Sidebar />
      {/* Top notification bar */}
      <div className="fixed top-0 left-64 right-0 h-0 z-40">
        <div className="absolute top-3 right-6">
          <NotificationDropdown onAction={handleNotifAction} />
        </div>
      </div>
      <main className="ml-64 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
      {notifToast && <NotifToast message={notifToast} onClose={() => setNotifToast(null)} />}
    </div>
  );
}
