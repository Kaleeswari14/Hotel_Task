"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Receipt,
  Clock,
  LayoutDashboard,
  Boxes,
  Menu,
  X,
  LogOut,
  IndianRupee,
  CalendarCheck,
  Ban,
  UserCheck,
  MessageSquare,
  KeyRound,
  User as UserIcon,
  ChevronDown,
  Wallet,
  QrCode,
  Wifi,
  WifiOff
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  user?: {
    name: string;
    username: string;
    role: "OWNER" | "STAFF";
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, isTamil, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Online / Offline listener & Service Worker registration
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  const isOwner = user.role === "OWNER";

  const staffLinks = [
    { href: "/pos", key: "nav.pos", fallback: "POS Bill", icon: UtensilsCrossed, isPrimary: true },
    { href: "/bills", key: "nav.bills", fallback: "Bills", icon: Clock },
  ];

  const ownerMainLinks = [
    { href: "/owner/dashboard", key: "nav.dashboard", fallback: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", key: "nav.pos", fallback: "POS Bill", icon: UtensilsCrossed, isPrimary: true },
    { href: "/bills", key: "nav.bills", fallback: "Bills", icon: Clock },
    { href: "/owner/menu", key: "nav.menu", fallback: "Menu", icon: UtensilsCrossed },
    { href: "/owner/stock", key: "nav.stock", fallback: "Stock", icon: Boxes },
    { href: "/owner/expenses", key: "nav.expenses", fallback: "Expenses", icon: Wallet },
    { href: "/owner/payments", key: "nav.payments", fallback: "Payments", icon: IndianRupee },
    { href: "/owner/day-closing", key: "nav.dayClosing", fallback: "Day Closing", icon: CalendarCheck },
  ];

  const ownerIconOnlyLinks = [
    { href: "/owner/qr-codes", key: "nav.qrCodes", title: "Table QR Stickers", icon: QrCode, iconColor: "text-orange-500" },
    { href: "/owner/whatsapp", key: "nav.whatsapp", title: "WhatsApp Service", icon: MessageSquare, iconColor: "text-orange-500" },
    { href: "/owner/cancelled", key: "nav.cancelled", title: "Cancelled Bills", icon: Ban, iconColor: "text-red-400" },
  ];

  const links = isOwner ? ownerMainLinks : staffLinks;

  return (
    <header className="bg-white/95 backdrop-blur-xl text-slate-900 shadow-sm relative print:hidden select-none border-b border-slate-200/90 w-full z-50">
      <div className="w-full px-3 sm:px-5 lg:px-7">
        <div className="flex items-center justify-between h-15 gap-2">
          
          {/* ========================================================================= */}
          {/* LEFT: HOTEL JB LOGO & BRANDING */}
          {/* ========================================================================= */}
          <Link
            href={isOwner ? "/owner/dashboard" : "/pos"}
            className="flex items-center space-x-2.5 shrink-0 group hover:opacity-95 transition-all min-w-[125px]"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center font-black text-sm shadow-glow-orange text-white shrink-0 tracking-wider ring-1 ring-orange-300/40 group-hover:scale-105 transition-transform">
              JB
            </div>
            <div className="leading-tight">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors block whitespace-nowrap">
                HOTEL JB
              </span>
              <span className="text-[9px] font-extrabold text-orange-600 tracking-widest uppercase block -mt-0.5">
                {t("nav.subtitle")}
              </span>
            </div>
          </Link>

          {/* ========================================================================= */}
          {/* CENTER: DESKTOP NAVIGATION (Compact & Never Overflows) */}
          {/* ========================================================================= */}
          <nav className="hidden lg:flex items-center space-x-1 shrink-0 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/pos" && pathname.startsWith(item.href));
              const isPrimary = item.isPrimary;
              const label = t(item.key) || item.fallback;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-glow-orange font-black ring-1 ring-orange-400/40"
                      : isPrimary
                      ? "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 font-black"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* Quick Icon Utilities (WhatsApp, Users, Cancelled) */}
            {isOwner && (
              <div className="flex items-center space-x-1 pl-1 ml-1 border-l border-slate-300">
                {ownerIconOnlyLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isActive
                          ? "bg-orange-500 text-white shadow-sm ring-1 ring-orange-400"
                          : "text-slate-500 hover:bg-white hover:text-slate-900"
                      }`}
                      title={item.title}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.iconColor}`} />
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* ========================================================================= */}
          {/* RIGHT SUITE: PWA STATUS + LANGUAGE SWITCHER + USER AVATAR */}
          {/* ========================================================================= */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* 📶 ONLINE / OFFLINE PWA INDICATOR */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                isOnline
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-900 border-amber-300 animate-pulse"
              }`}
              title={isOnline ? "Online - Real-time Database Connected" : "Offline Mode - Bills Saved Locally"}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* 🌐 LANGUAGE SWITCHER PILL (ENGLISH ↔ தமிழ்) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-glow-orange"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ta")}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === "ta"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-glow-orange"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="தமிழுக்கு மாறவும்"
              >
                தமிழ்
              </button>
            </div>

            {/* 👤 USER AVATAR WITH DROPDOWN MENU */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                  userMenuOpen
                    ? "bg-orange-500 text-white border-orange-400 ring-2 ring-orange-300 shadow-md"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 hover:border-slate-300"
                }`}
                title="User Profile & Logout"
              >
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black">
                  <UserIcon className="w-3 h-3" />
                </div>
                <span className="hidden md:inline text-xs font-black truncate max-w-[70px]">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* DROPDOWN MENU POPOVER */}
              {userMenuOpen && (
                <div className="absolute right-0 top-11 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up text-left">
                  {/* User Profile Card */}
                  <div className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                    <div className="font-black text-slate-900 text-xs truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">@{user.username}</div>
                    <div className="mt-1.5">
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isOwner
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-orange-100 text-orange-900 border border-orange-300"
                      }`}>
                        {isOwner ? "👑 Owner Account" : "👤 Staff Account"}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  <div className="space-y-1">
                    <Link
                      href="/owner/users"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <KeyRound className="w-4 h-4 text-orange-600" />
                      <span>Password & Account Settings</span>
                    </Link>

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{loggingOut ? "..." : t("nav.logout")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none shrink-0 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-4 space-y-2 animate-slide-down">
          <div className="py-2 border-b border-slate-100 flex items-center justify-between">
            <Link
              href="/owner/users"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">{user.name}</div>
                <div className="text-[10px] text-orange-600 font-bold">
                  {isOwner ? "👑 Owner Account" : "👤 Staff Account"}
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[...links, ...(isOwner ? ownerIconOnlyLinks : [])].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(item.key) || (item as any).fallback || (item as any).title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
