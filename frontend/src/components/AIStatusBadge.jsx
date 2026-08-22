import React, { useState, useEffect } from "react";
import { checkHealth } from "../api/aiAPI";

export function AIStatusBadge() {
  const [status, setStatus] = useState("checking"); // "online" | "offline" | "checking"

  const verifyHealth = async () => {
    try {
      const data = await checkHealth();
      if (data && data.status === "ok") {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch (err) {
      setStatus("offline");
    }
  };

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === "checking") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Checking AI Engine...
      </div>
    );
  }

  if (status === "online") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-900/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        AI Engine Online
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-900/20">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      AI Engine Offline
    </div>
  );
}

export default AIStatusBadge;
