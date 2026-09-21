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
  ArrowRight,
  HelpCircle,
  Phone,
  Send,
  RefreshCw,
  X,
  Smartphone,
  ExternalLink
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

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTargetUser, setForgotTargetUser] = useState("owner");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    whatsappUrl?: string;
    username?: string;
    maskedPhone?: string;
    message?: string;
    directSent?: boolean;
  } | null>(null);
  const [forgotError, setForgotError] = useState("");
  const [forgotMode, setForgotMode] = useState<"WHATSAPP" | "DIRECT_PIN">("WHATSAPP");

  // Direct PIN reset state
  const [masterPin, setMasterPin] = useState("");
  const [newDirectPassword, setNewDirectPassword] = useState("");
  const [directResetSuccess, setDirectResetSuccess] = useState(false);

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

  // Fetch default owner phone for forgot password modal
  useEffect(() => {
    async function loadForgotInfo() {
      try {
        const res = await fetch("/api/auth/forgot-password");
        if (res.ok) {
          const data = await res.json();
          if (data.defaultPhone) {
            setForgotPhone(data.defaultPhone);
          }
        }
      } catch {}
    }
    loadForgotInfo();
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username or password");
        setLoading(false);
        return;
      }

      // Successful login -> instant hard navigation with fresh session cookie
      const targetUrl = data.user?.role === "OWNER" ? "/owner/dashboard" : "/pos";
      window.location.href = targetUrl;
    } catch (err: any) {
      console.error(err);
      setError(
        err.name === "AbortError"
          ? "Login request timed out. Please try again."
          : "Network connection error. Please try again."
      );
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
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Failed to complete setup. Please check network connection.");
      setLoading(false);
    }
  };

  // Handle Send to WhatsApp
  const handleSendWhatsAppRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotResult(null);

    const cleanPhone = forgotPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setForgotError("Please enter a valid 10-digit WhatsApp phone number");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_whatsapp",
          targetUsername: forgotTargetUser,
          phoneNumber: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Failed to dispatch WhatsApp credentials");
        setForgotLoading(false);
        return;
      }

      setForgotResult({
        whatsappUrl: data.whatsappUrl,
        username: data.username,
        maskedPhone: data.maskedPhone || cleanPhone,
        message: data.message,
        directSent: data.directSent,
      });

      // Keep username but DO NOT auto-fill the password (must only be read from phone)
      setUsername(data.username);
      setPassword("");

      // If not sent directly by engine and user needs to open WhatsApp web
      if (!data.directSent && data.whatsappUrl) {
        const link = document.createElement("a");
        link.href = data.whatsappUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setForgotError(err.message || "Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Direct Reset PIN (Master Code / Emergency)
  const handleDirectPinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!masterPin.trim()) {
      setForgotError("Please enter your Master Security PIN.");
      return;
    }

    if (!newDirectPassword || newDirectPassword.length < 4) {
      setForgotError("New password must be at least 4 characters.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_direct",
          targetUsername: forgotTargetUser,
          newPassword: newDirectPassword,
          masterPin: masterPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Failed to reset password. Please check PIN.");
        setForgotLoading(false);
        return;
      }

      setDirectResetSuccess(true);
      setUsername(forgotTargetUser);
      setPassword(newDirectPassword);

      setTimeout(() => {
        setShowForgotModal(false);
        setDirectResetSuccess(false);
        setMasterPin("");
        setNewDirectPassword("");
      }, 1200);
    } catch (err: any) {
      setForgotError(err.message || "Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-orange-200">Initializing Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 shadow-xl shadow-orange-500/25 mb-3 border border-orange-400/30">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            {hotelName}
          </h1>
          <p className="text-xs sm:text-sm text-orange-200/80 font-medium mt-1">
            {needsSetup ? "Initial Owner Account Setup" : "Enterprise Point of Sale & Management"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
          {needsSetup ? (
            /* ========================================================================= */
            /* 1. INITIAL OWNER SETUP (FRESH INSTALLATION ONLY) */
            /* ========================================================================= */
            <div>
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                    <span>Create Owner Account</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Setup master credentials for your restaurant</p>
                </div>
                <span className="text-[11px] bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-full border border-orange-200">
                  Initial Setup
                </span>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-medium animate-shake">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-900">Setup Error</div>
                    <div className="text-red-700 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              {setupSuccess ? (
                <div className="p-8 bg-orange-50 border border-orange-200 rounded-2xl text-center space-y-3 text-orange-950">
                  <CheckCircle2 className="w-12 h-12 text-orange-600 mx-auto animate-bounce" />
                  <div className="font-black text-lg text-slate-900">Account Created Successfully!</div>
                  <div className="text-xs text-orange-700 font-bold">Launching Dashboard...</div>
                </div>
              ) : (
                <form onSubmit={handleSetupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Owner Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={setupOwnerName}
                        onChange={(e) => setSetupOwnerName(e.target.value)}
                        placeholder="e.g. Restaurant Owner"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={setupUsername}
                        onChange={(e) => setSetupUsername(e.target.value)}
                        placeholder="e.g. owner or admin@restaurant.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSetupPassword ? "text" : "password"}
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm font-medium transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSetupPassword ? "text" : "password"}
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <>
                        <span>Complete Setup &amp; Launch</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. STANDARD LOGIN FORM */
            /* ========================================================================= */
            <div>
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-orange-600" />
                    <span>Sign In to Terminal</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your authorized credentials</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  <span>Secure Access</span>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-medium animate-shake">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-900">Authentication Failed</div>
                    <div className="text-red-700 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username (e.g. owner or staff)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm sm:text-base font-medium transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Forgot Password? (கடவுச்சொல் மீட்பு)</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm sm:text-base font-medium transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
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
        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-2.5 shadow-xs">
            <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-white">1-Click Billing</div>
            <div className="text-[10px] text-orange-200/70">Fast Counter POS</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-2.5 shadow-xs">
            <Printer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-white">Thermal Print</div>
            <div className="text-[10px] text-orange-200/70">58mm &amp; 80mm KOT</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-2.5 shadow-xs">
            <MessageSquare className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-white">WhatsApp Bills</div>
            <div className="text-[10px] text-orange-200/70">Instant Delivery</div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-orange-200/60 font-medium">
          Professional Restaurant POS &bull; 256-Bit Encrypted Session
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FORGOT PASSWORD & WHATSAPP RECOVERY MODAL */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  🔐
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Account Recovery &bull; பாஸ்வேர்ட் மீட்பு
                  </h3>
                  <p className="text-xs text-slate-500">Send password &amp; username to Owner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotResult(null);
                  setForgotError("");
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recovery Mode Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setForgotMode("WHATSAPP")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  forgotMode === "WHATSAPP"
                    ? "bg-white text-orange-950 shadow-xs font-black"
                    : "text-slate-600"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Recovery</span>
              </button>
              <button
                type="button"
                onClick={() => setForgotMode("DIRECT_PIN")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  forgotMode === "DIRECT_PIN"
                    ? "bg-white text-orange-950 shadow-xs font-black"
                    : "text-slate-600"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Master PIN Reset</span>
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* TAB 1: WHATSAPP DISPATCH */}
            {forgotMode === "WHATSAPP" && (
              <form onSubmit={handleSendWhatsAppRecovery} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Account:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotTargetUser("owner")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        forgotTargetUser === "owner"
                          ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>👑 Owner (owner)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotTargetUser("staff")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        forgotTargetUser === "staff"
                          ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>👨‍🍳 Staff (staff)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner WhatsApp Mobile Number:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    புதிய பாஸ்வேர்ட் உருவாக்கப்பட்டு இந்த WhatsApp எண்ணிற்கு உடனடியாக அனுப்பப்படும்.
                  </p>
                </div>

                {forgotResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 text-emerald-950">
                    <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {forgotResult.directSent
                          ? "✓ WhatsApp API வழியாக கடவுச்சொல் போனுக்கு அனுப்பப்பட்டுவிட்டது!"
                          : "✓ கடவுச்சொல் வாட்ஸ்அப்பிற்கு அனுப்ப தயாராக உள்ளது!"}
                      </span>
                    </div>
                    <div className="text-xs bg-white p-3 rounded-xl border border-emerald-100 space-y-1 text-slate-800">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">Account:</span>
                        <span className="font-black text-slate-900 font-mono">{forgotResult.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">WhatsApp Phone:</span>
                        <span className="font-bold text-emerald-700 font-mono">+91 {forgotResult.maskedPhone}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-orange-700 font-medium flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>பாதுகாப்பிற்காக கடவுச்சொல் இந்த திரையில் காட்டப்படாது. உங்கள் WhatsApp போனில் பார்த்து Login செய்யவும்.</span>
                      </div>
                    </div>
                    {forgotResult.whatsappUrl && !forgotResult.directSent && (
                      <a
                        href={forgotResult.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in WhatsApp &bull; வாட்ஸ்அப்பில் அனுப்பு</span>
                      </a>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {forgotLoading ? "Generating Credentials..." : "📲 Send Login Details to WhatsApp"}
                  </span>
                </button>
              </form>
            )}

            {/* TAB 2: DIRECT MASTER PIN RESET */}
            {forgotMode === "DIRECT_PIN" && (
              <form onSubmit={handleDirectPinReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Account to Reset:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotTargetUser("owner")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        forgotTargetUser === "owner"
                          ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>👑 Owner (owner)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotTargetUser("staff")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        forgotTargetUser === "staff"
                          ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>👨‍🍳 Staff (staff)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Master Security PIN (ரகசிய குறியீடு):
                  </label>
                  <input
                    type="password"
                    value={masterPin}
                    onChange={(e) => setMasterPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 tracking-widest"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ஹோட்டல் உரிமையாளரின் Master Security PIN குறியீட்டை உள்ளிடவும்.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter New Password (புதிய கடவுச்சொல்):
                  </label>
                  <input
                    type="password"
                    value={newDirectPassword}
                    onChange={(e) => setNewDirectPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {directResetSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center">
                    ✓ Password updated! Filling login form...
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{forgotLoading ? "Resetting..." : "🔑 Reset Password Now"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
