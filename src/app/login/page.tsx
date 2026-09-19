"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  Lock,
  User,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Printer,
  MessageSquare,
  ArrowRight
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Setup state (Whether initial owner registration is needed)
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [hotelName, setHotelName] = useState("HOTEL JB");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Initial Owner Setup form state
  const [setupOwnerName, setSetupOwnerName] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);

  // Check setup status on load
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/auth/setup");
        if (res.ok) {
          const data = await res.json();
          setNeedsSetup(data.needsSetup);
          if (data.hotelName) setHotelName(data.hotelName);
        }
      } catch (err) {
        console.error("Failed to check setup status:", err);
      } finally {
        setCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  // Handle Standard Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username or password");
        setLoading(false);
        return;
      }

      // Successful login -> route according to role
      if (data.user?.role === "OWNER") {
        router.push("/owner/dashboard");
      } else {
        router.push("/pos");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Network connection error. Please try again.");
      setLoading(false);
    }
  };

  // Handle Initial Owner Setup Registration
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!setupOwnerName.trim()) {
      setError("Please enter Owner Full Name");
      return;
    }

    if (!setupUsername.trim()) {
      setError("Please enter Username or Email");
      return;
    }

    if (setupPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setupOwnerName.trim(),
          username: setupUsername.trim(),
          password: setupPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create owner account");
        setLoading(false);
        return;
      }

      setSetupSuccess(true);
      setTimeout(() => {
        router.push("/owner/dashboard");
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Network connection error. Please try again.");
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold text-stone-400 tracking-wider uppercase">Loading System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 sm:px-6 bg-stone-950 text-stone-100 overflow-hidden py-12">
      {/* Background Subtle Luxury Ambient Glows */}
      <div className="absolute top-1/6 -left-32 w-[32rem] h-[32rem] bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 -right-32 w-[32rem] h-[32rem] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 shadow-glow-orange mb-4 border border-orange-300/30 text-white transform hover:scale-105 transition-all">
            <Utensils className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-stone-100 to-orange-200 bg-clip-text text-transparent tracking-tight">
            {hotelName}
          </h1>
          <p className="text-orange-400/90 text-xs sm:text-sm mt-1.5 font-bold tracking-wider uppercase">
            {needsSetup ? "Initial Owner Account Setup" : "Enterprise Point of Sale & Management"}
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-panel-dark rounded-3xl border border-stone-800/90 shadow-2xl p-6 sm:p-8">
          {needsSetup ? (
            /* ========================================================================= */
            /* 1. INITIAL OWNER SETUP (FRESH INSTALLATION ONLY) */
            /* ========================================================================= */
            <div>
              <div className="mb-6 pb-4 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <span>Create Owner Account</span>
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">Setup master credentials for your restaurant</p>
                </div>
                <span className="text-[11px] bg-orange-950/80 text-orange-300 font-bold px-2.5 py-1 rounded-full border border-orange-500/30">
                  Initial Setup
                </span>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-950/70 border border-red-500/50 rounded-2xl flex items-start gap-3 text-red-200 text-xs font-medium animate-shake">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-100">Setup Error</div>
                    <div className="text-red-300 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              {setupSuccess ? (
                <div className="p-8 bg-orange-950/60 border border-orange-500/40 rounded-2xl text-center space-y-3 text-orange-200">
                  <CheckCircle2 className="w-12 h-12 text-orange-400 mx-auto animate-bounce" />
                  <div className="font-black text-lg text-white">Account Created Successfully!</div>
                  <div className="text-xs text-orange-300">Launching Dashboard...</div>
                </div>
              ) : (
                <form onSubmit={handleSetupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      Owner Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={setupOwnerName}
                        onChange={(e) => setSetupOwnerName(e.target.value)}
                        placeholder="e.g. Restaurant Owner"
                        className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={setupUsername}
                        onChange={(e) => setSetupUsername(e.target.value)}
                        placeholder="e.g. owner or admin@restaurant.com"
                        className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSetupPassword ? "text" : "password"}
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full pl-10 pr-11 py-3 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition-colors"
                      >
                        {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSetupPassword ? "text" : "password"}
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold rounded-2xl shadow-xl shadow-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Create Owner Account & Launch POS</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. STANDARD SECURE PROFESSIONAL LOGIN SCREEN */
            /* ========================================================================= */
            <div>
              <div className="mb-6 pb-4 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-orange-400" />
                    <span>Sign In to Terminal</span>
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">Enter your authorized credentials</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-300 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                  <span>Secure Access</span>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-950/80 border border-red-500/50 rounded-2xl flex items-start gap-3 text-red-200 text-xs font-medium animate-shake">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-100">Authentication Failed</div>
                    <div className="text-red-300 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username or email"
                      className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base font-medium transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-3 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base font-medium transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold rounded-2xl shadow-xl shadow-orange-700/30 focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center">
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-2.5">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-stone-300">1-Click Billing</div>
            <div className="text-[10px] text-stone-500">Fast Counter POS</div>
          </div>
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-2.5">
            <Printer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-stone-300">Thermal Print</div>
            <div className="text-[10px] text-stone-500">58mm & 80mm KOT</div>
          </div>
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-2.5">
            <MessageSquare className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-stone-300">WhatsApp Invoicing</div>
            <div className="text-[10px] text-stone-500">Instant Free Delivery</div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 font-medium">
          Professional Restaurant Management &bull; 256-Bit Encrypted Session
        </div>
      </div>
    </div>
  );
}
