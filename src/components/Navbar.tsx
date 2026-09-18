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
  ChevronDown
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
  const { language, setLanguage, isTamil } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    { href: "/pos", label: "POS Bill", icon: UtensilsCrossed, isPrimary: true },
    { href: "/bills", label: "Bills", icon: Clock },
  ];

  const ownerMainLinks = [
    { href: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "POS Bill", icon: UtensilsCrossed, isPrimary: true },
    { href: "/bills", label: "Bills", icon: Clock },
    { href: "/owner/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/owner/stock", label: "Stock", icon: Boxes },
    { href: "/owner/payments", label: "Payments", icon: IndianRupee },
    { href: "/owner/day-closing", label: "Day Closing", icon: CalendarCheck },
  ];

  const ownerIconOnlyLinks = [
    { href: "/owner/whatsapp", label: "WhatsApp", title: "WhatsApp Service", icon: MessageSquare, iconColor: "text-emerald-400" },
    { href: "/owner/cancelled", label: "Cancelled", title: "Cancelled Bills", icon: Ban, iconColor: "text-red-400" },
  ];

  const links = isOwner ? ownerMainLinks : staffLinks;

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl text-white shadow-2xl relative print:hidden select-none border-b border-slate-800/80 w-full z-50">
      <div className="w-full px-3 sm:px-5 lg:px-7">
        <div className="flex items-center justify-between h-15 gap-2">
          
          {/* ========================================================================= */}
          {/* LEFT: HOTEL JB LOGO & BRANDING */}
          {/* ========================================================================= */}
          <Link
            href={isOwner ? "/owner/dashboard" : "/pos"}
            className="flex items-center space-x-2.5 shrink-0 group hover:opacity-95 transition-all min-w-[125px]"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center font-black text-sm shadow-glow-emerald text-white shrink-0 tracking-wider ring-1 ring-emerald-300/30 group-hover:scale-105 transition-transform">
              JB
            </div>
            <div className="leading-tight">
              <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:from-emerald-400 group-hover:to-teal-300 transition-colors block whitespace-nowrap">
                HOTEL JB
              </span>
              <span className="text-[9px] font-bold text-emerald-400/90 tracking-widest uppercase block -mt-0.5">
                POS &bull; Enterprise
              </span>
            </div>
          </Link>

          {/* ========================================================================= */}
          {/* CENTER: DESKTOP NAVIGATION (Compact & Never Overflows) */}
          {/* ========================================================================= */}
          <nav className="hidden lg:flex items-center space-x-1 shrink-0 bg-slate-900/80 p-1 rounded-2xl border border-slate-800/70 shadow-inner">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/pos" && pathname.startsWith(item.href));
              const isPrimary = item.isPrimary;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald font-black ring-1 ring-emerald-400/40"
                      : isPrimary
                      ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 font-black"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Quick Icon Utilities (WhatsApp, Users, Cancelled) */}
            {isOwner && (
              <div className="flex items-center space-x-1 pl-1 ml-1 border-l border-slate-700/60">
                {ownerIconOnlyLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
          {/* RIGHT SUITE: SINGLE 👤 USER AVATAR DROPDOWN */}
          {/* ========================================================================= */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* 👤 USER AVATAR WITH DROPDOWN MENU */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                  userMenuOpen
                    ? "bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400 shadow-md"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600"
                }`}
                title="User Profile & Logout"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-black">
                  <UserIcon className="w-3 h-3" />
                </div>
                <span className="hidden md:inline text-xs font-black truncate max-w-[70px]">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* DROPDOWN MENU POPOVER */}
              {userMenuOpen && (
                <div className="absolute right-0 top-11 w-60 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up text-left">
                  {/* User Profile Card */}
                  <div className="px-3 py-2.5 bg-slate-800/90 rounded-xl border border-slate-700/60 mb-2">
                    <div className="font-black text-white text-xs truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">@{user.username}</div>
                    <div className="mt-1.5">
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isOwner
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Password & Account Settings</span>
                    </Link>

                    <div className="pt-1 mt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-300 hover:text-white hover:bg-red-600 rounded-xl transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{loggingOut ? "..." : "Log Out"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none shrink-0"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-800 border-t border-slate-700 px-4 pt-2 pb-4 space-y-2 animate-slide-down">
          <div className="py-2 border-b border-slate-700 flex items-center justify-between">
            <Link
              href="/owner/users"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200 text-xs">{user.name}</div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  {isOwner ? "👑 Owner Account" : "👤 Staff Account"}
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold transition-colors"
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
                    isActive ? "bg-emerald-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
