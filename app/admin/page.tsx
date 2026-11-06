"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { ChevronLeft, Trash2, Plus, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/users");
      setUsers(res.data.usernames || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "loogied") {
      setIsAuthenticated(true);
      fetchUsers();
    } else {
      alert("Incorrect password");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newUser.trim();
    if (!cleanUser) return;
    setLoading(true);
    
    // Check if it's a valid LeetCode user first
    try {
      const [profileRes, solvedRes, calendarRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${cleanUser}`),
        axios.get(`https://kinkdin.onrender.com/${cleanUser}/solved`),
        axios.get(`https://kinkdin.onrender.com/${cleanUser}/calendar`)
      ]);

      if (profileRes.data.errors || solvedRes.data.errors || calendarRes.data.errors) {
        alert("Invalid LeetCode username or account not found!");
        setLoading(false);
        return;
      }

      await axios.post("/api/users", { username: cleanUser });
      setNewUser("");
      fetchUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Error adding user to database");
      } else {
        alert("Error adding user to database");
      }
    }
    setLoading(false);
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to completely remove ${username}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/api/users?username=${username}`);
      fetchUsers();
    } catch {
      alert("Failed to delete user");
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#0d0e15] p-8 rounded-2xl border border-[#171824] max-w-sm w-full shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 mb-6 text-violet-400">
            <ShieldAlert className="w-5 h-5" />
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Gate</h1>
          </div>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password..."
            className="bg-[#070709] border border-[#1e202e] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 w-full mb-4 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all font-mono"
          />
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-3 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.25)] active:scale-98"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-16 max-w-2xl mx-auto">
      <Link 
        href="/" 
        className="group flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors mb-8 w-fit"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-mono">leaderboard</span>
      </Link>

      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">Admin Console</h1>
      <p className="text-slate-400 text-sm mb-10">Manage mentees. Changes propagate instantly to the public leaderboard.</p>

      {/* Add Form */}
      <div className="bg-[#0d0e15] p-6 rounded-2xl border border-[#171824] mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-sm font-semibold mb-3 text-white">Add Mentee Manually</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input 
            type="text" 
            value={newUser}
            onChange={e => setNewUser(e.target.value)}
            placeholder="LeetCode username..."
            className="flex-1 bg-[#070709] border border-[#1e202e] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all font-mono"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
            Add
          </button>
        </form>
      </div>

      {/* User List */}
      <div className="bg-[#0d0e15] rounded-2xl border border-[#171824] overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="px-6 py-4 border-b border-[#171824] bg-[#090a10]/60 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Active Mentees ({users.length})
          </h2>
        </div>
        <div className="divide-y divide-[#171824]">
          {users.map(u => (
            <div key={u} className="px-6 py-3.5 flex items-center justify-between hover:bg-[#12131e]/50 transition-colors">
              <span className="text-sm font-medium text-slate-200 font-mono">{u}</span>
              <button 
                onClick={() => handleDelete(u)}
                disabled={loading}
                className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                title={`Delete ${u}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {users.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500 text-sm font-mono">
              no users in database
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
