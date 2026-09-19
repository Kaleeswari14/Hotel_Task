"use client";

import React, { useState } from "react";
import { ShieldAlert, KeyRound, Lock, X, CheckCircle2, AlertTriangle } from "lucide-react";

interface OwnerPermissionModalProps {
  title: string;
  actionDescription: string;
  userRole: string;
  onAuthorized: () => void;
  onClose: () => void;
}

export default function OwnerPermissionModal({
  title,
  actionDescription,
  userRole,
  onAuthorized,
  onClose,
}: OwnerPermissionModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If logged in as owner, authorize directly
    if (userRole === "OWNER") {
      onAuthorized();
      return;
    }

    if (!password.trim()) {
      setError("Please enter the Owner Password or PIN");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authorization failed");
      }

      onAuthorized();
    } catch (err: any) {
      setError(err.message || "Invalid Owner Authorization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Owner Permission Required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Security Protected Action</div>
              <div className="text-[11px] text-amber-800/90 mt-0.5">
                {actionDescription}
              </div>
            </div>
          </div>

          {userRole === "OWNER" ? (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
              <span>You are logged in as <strong>OWNER</strong>. Click authorize to proceed.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Enter Owner Password / PIN:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter owner password (e.g. admin123)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 animate-shake">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? "Verifying..." : "Authorize Action"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}