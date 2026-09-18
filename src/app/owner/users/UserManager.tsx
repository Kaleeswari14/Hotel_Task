"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  KeyRound,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  RefreshCw
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface UserData {
  id: string;
  name: string;
  username: string;
  role: "OWNER" | "STAFF";
  isActive: boolean;
  createdAt: string;
}

interface UserManagerProps {
  currentUser: {
    userId: string;
    name: string;
    username: string;
    role: "OWNER" | "STAFF";
  };
}

export default function UserManager({ currentUser }: UserManagerProps) {
  const { isTamil } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tab State: "PROFILE" (Change my password/username) vs "STAFF_LIST" (Manage other users)
  const [activeTab, setActiveTab] = useState<"PROFILE" | "STAFF_LIST">("PROFILE");

  // My Profile Form State
  const [myName, setMyName] = useState(currentUser.name);
  const [myUsername, setMyUsername] = useState(currentUser.username);
  const [myCurrentPassword, setMyCurrentPassword] = useState("");
  const [myNewPassword, setMyNewPassword] = useState("");
  const [myConfirmPassword, setMyConfirmPassword] = useState("");
  const [showMyCurrentPass, setShowMyCurrentPass] = useState(false);
  const [showMyNewPass, setShowMyNewPass] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Add / Edit Staff Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserData | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<"STAFF" | "OWNER">("STAFF");
  const [staffActive, setStaffActive] = useState(true);
  const [showStaffPass, setShowStaffPass] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === "OWNER") {
      fetchUsers();
    }
  }, [currentUser.role]);

  // Handle My Profile & Password Update
  const handleUpdateMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!myUsername.trim()) {
      alert(isTamil ? "பயனர்பெயர் (Username) தேவை" : "Username is required");
      return;
    }

    if (myNewPassword) {
      if (myNewPassword.length < 4) {
        alert(isTamil ? "புதிய பாஸ்வேர்ட் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்" : "New password must be at least 4 characters");
        return;
      }
      if (myNewPassword !== myConfirmPassword) {
        alert(isTamil ? "புதிய பாஸ்வேர்டும் உறுதிப்படுத்தலும் பொருந்தவில்லை!" : "New password and confirm password do not match!");
        return;
      }
    }

    setProfileSaving(true);
    try {
      const res = await fetch("/api/auth/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: currentUser.userId,
          name: myName,
          username: myUsername,
          currentPassword: myCurrentPassword || undefined,
          newPassword: myNewPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      showToast(isTamil ? "✅ சுயவிவரம் மற்றும் பாஸ்வேர்ட் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!" : "✅ Profile & Password updated successfully!");
      setMyCurrentPassword("");
      setMyNewPassword("");
      setMyConfirmPassword("");
      if (currentUser.role === "OWNER") fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Open Add Staff Modal
  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffName("");
    setStaffUsername("");
    setStaffPassword("");
    setStaffRole("STAFF");
    setStaffActive(true);
    setStaffModalOpen(true);
  };

  // Open Edit Staff Modal
  const openEditStaffModal = (staff: UserData) => {
    setEditingStaff(staff);
    setStaffName(staff.name);
    setStaffUsername(staff.username);
    setStaffPassword(""); // Empty to keep existing
    setStaffRole(staff.role);
    setStaffActive(staff.isActive);
    setStaffModalOpen(true);
  };

  // Save Staff (Create or Update)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffName.trim() || !staffUsername.trim()) {
      alert(isTamil ? "பெயர் மற்றும் பயனர்பெயர் தேவை" : "Name and Username are required");
      return;
    }

    if (!editingStaff && (!staffPassword || staffPassword.length < 4)) {
      alert(isTamil ? "புதிய பயனருக்கு பாஸ்வேர்ட் (குறைந்தது 4 எழுத்துக்கள்) தேவை" : "Password (min 4 chars) is required for new user");
      return;
    }

    setStaffSaving(true);
    try {
      if (editingStaff) {
        // Update staff
        const res = await fetch("/api/auth/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: editingStaff.id,
            name: staffName,
            username: staffUsername,
            newPassword: staffPassword || undefined,
            role: staffRole,
            isActive: staffActive,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user");
        showToast(isTamil ? `✅ பயனர் "${staffUsername}" புதுப்பிக்கப்பட்டார்` : `✅ User "${staffUsername}" updated`);
      } else {
        // Create staff
        const res = await fetch("/api/auth/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: staffName,
            username: staffUsername,
            password: staffPassword,
            role: staffRole,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create user");
        showToast(isTamil ? `🎉 புதிய பயனர் "${staffUsername}" சேர்க்கப்பட்டார்!` : `🎉 New user "${staffUsername}" created!`);
      }

      setStaffModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  // Delete Staff
  const handleDeleteStaff = async (staff: UserData) => {
    if (staff.id === currentUser.userId) {
      alert(isTamil ? "உங்கள் சொந்த கணக்கை நீக்க முடியாது!" : "You cannot delete your own account!");
      return;
    }

    const confirmMsg = isTamil
      ? `"${staff.name}" (${staff.username}) என்ற பயனரை நிச்சயமாக நீக்க வேண்டுமா?`
      : `Are you sure you want to delete user "${staff.name}" (${staff.username})?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/auth/users?id=${staff.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      showToast(isTamil ? `🗑️ பயனர் "${staff.username}" நீக்கப்பட்டார்` : `🗑️ User "${staff.username}" deleted`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-600 text-sm font-bold animate-slide-up">
          <Check className="w-5 h-5 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>{isTamil ? "பாதுகாப்பு & கணக்கு அமைப்புகள்" : "Security & Account Settings"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isTamil ? "பயனர்பெயர் & பாஸ்வேர்ட் மேலாண்மை" : "Username & Password Settings"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {isTamil
              ? "உங்கள் சொந்த Login Username / Password மாற்றலாம் மற்றும் பணியாளர் கணக்குகளை நிர்வகிக்கலாம்."
              : "Update your login credentials, change passwords, and manage staff user accounts."}
          </p>
        </div>

        {/* Tab Switcher (For Owner) */}
        {currentUser.role === "OWNER" && (
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("PROFILE")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === "PROFILE"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTamil ? "என் பாஸ்வேர்ட்" : "My Password"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("STAFF_LIST")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === "STAFF_LIST"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isTamil ? "பணியாளர்கள் பட்டியல்" : "Staff Accounts"}</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px]">
                {users.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY PROFILE & CHANGE PASSWORD */}
      {/* ========================================================================= */}
      {activeTab === "PROFILE" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isTamil ? "உங்கள் கணக்கு & பாஸ்வேர்ட் மாற்றம்" : "Change Your Login Password & Username"}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-700">Role: {currentUser.role}</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">Current User: @{currentUser.username}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateMyProfile} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {isTamil ? "உங்கள் முழு பெயர் (Full Name)" : "Full Display Name"}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  placeholder="e.g. Hotel Owner / Cashier 1"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {isTamil ? "உள்நுழைவு பெயர் (Login Username)" : "Login Username"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={myUsername}
                  onChange={(e) => setMyUsername(e.target.value)}
                  placeholder="e.g. owner"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isTamil ? "Login செய்வதற்கு இந்த Username பயன்படுத்தப்படும்." : "You will use this username to log in."}
              </p>
            </div>

            {/* Current Password */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {isTamil ? "தற்போதைய பாஸ்வேர்ட் (Current Password)" : "Current Password"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showMyCurrentPass ? "text" : "password"}
                  value={myCurrentPassword}
                  onChange={(e) => setMyCurrentPassword(e.target.value)}
                  placeholder={isTamil ? "பாதுகாப்பிற்கு தற்போதைய பாஸ்வேர்ட்..." : "Enter current password to verify..."}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMyCurrentPass(!showMyCurrentPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showMyCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isTamil ? "புதிய பாஸ்வேர்ட் (New Password)" : "New Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showMyNewPass ? "text" : "password"}
                    value={myNewPassword}
                    onChange={(e) => setMyNewPassword(e.target.value)}
                    placeholder={isTamil ? "புதிய பாஸ்வேர்ட்..." : "New password..."}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMyNewPass(!showMyNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showMyNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isTamil ? "உறுதி செய்க (Confirm Password)" : "Confirm Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showMyNewPass ? "text" : "password"}
                    value={myConfirmPassword}
                    onChange={(e) => setMyConfirmPassword(e.target.value)}
                    placeholder={isTamil ? "மீண்டும் தட்டச்சு செய்க..." : "Re-enter new password..."}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {profileSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isTamil ? "சேமிக்கிறது..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isTamil ? "மாற்றங்களைச் சேமிக்க" : "Save Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF & USER MANAGEMENT (Owner Only) */}
      {/* ========================================================================= */}
      {activeTab === "STAFF_LIST" && currentUser.role === "OWNER" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isTamil ? "அனைத்து பணியாளர் கணக்குகள்" : "All Staff & User Accounts"}
              </h2>
              <p className="text-xs text-slate-500">
                {isTamil
                  ? "ஹோட்டலில் பில்லிங் மற்றும் நிர்வாகம் செய்யும் பணியாளர்களின் கணக்குகள்."
                  : "Manage access, reset passwords, or create new login accounts."}
              </p>
            </div>

            <button
              type="button"
              onClick={openAddStaffModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{isTamil ? "+ புதிய பணியாளர் சேர்க்க" : "+ Add Staff Account"}</span>
            </button>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((staff) => {
              const isSelf = staff.id === currentUser.userId;
              return (
                <div
                  key={staff.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelf
                      ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        staff.role === "OWNER"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                      }`}>
                        {staff.role === "OWNER" ? "👑 OWNER" : "👤 STAFF / CASHIER"}
                      </span>

                      {staff.isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                          <UserX className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-base">{staff.name}</h3>
                    <div className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>Username:</span>
                      <span className="text-emerald-800 font-mono">@{staff.username}</span>
                      {isSelf && (
                        <span className="ml-1 text-[10px] text-emerald-700 font-black bg-emerald-100 px-1.5 py-0.2 rounded">
                          (You)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditStaffModal(staff)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs"
                    >
                      <Edit className="w-3 h-3 text-slate-500" />
                      <span>{isTamil ? "திருத்து / Reset" : "Edit / Reset"}</span>
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STAFF USER */}
      {/* ========================================================================= */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 my-8 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingStaff
                    ? (isTamil ? `பயனர் திருத்து: @${editingStaff.username}` : `Edit User: @${editingStaff.username}`)
                    : (isTamil ? "புதிய பணியாளர் கணக்கு சேர்க்க" : "Add New Staff Account")}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil ? "பணியாளரின் பெயர், பயனர்பெயர் மற்றும் பாஸ்வேர்ட்." : "Set login credentials and role."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isTamil ? "பணியாளர் பெயர் (Name)" : "Staff Display Name"}
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isTamil ? "பயனர்பெயர் (Username)" : "Login Username"}
                </label>
                <input
                  type="text"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="e.g. cashier2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {editingStaff
                    ? (isTamil ? "புதிய பாஸ்வேர்ட் (மாற்ற விரும்பினால் மட்டும்)" : "New Password (Leave empty to keep existing)")
                    : (isTamil ? "பாஸ்வேர்ட் (Password)" : "Login Password")}
                </label>
                <div className="relative">
                  <input
                    type={showStaffPass ? "text" : "password"}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder={editingStaff ? "••••••••" : "Min 4 characters..."}
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required={!editingStaff}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPass(!showStaffPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showStaffPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isTamil ? "பயனர் வகை (Role)" : "Account Role"}
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as "STAFF" | "OWNER")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="STAFF">👤 Staff / Cashier (POS & Bills only)</option>
                  <option value="OWNER">👑 Owner (Full Access)</option>
                </select>
              </div>

              {editingStaff && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="staffActiveCheck"
                    checked={staffActive}
                    onChange={(e) => setStaffActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="staffActiveCheck" className="text-xs font-bold text-slate-800">
                    {isTamil ? "கணக்கு செயல்பாட்டில் உள்ளது (Active Account)" : "Account is Active"}
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {isTamil ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={staffSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {staffSaving ? (isTamil ? "சேமிக்கிறது..." : "Saving...") : (isTamil ? "சேமிக்க" : "Save User")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
