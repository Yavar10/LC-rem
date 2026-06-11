"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, Trash2, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      setUsers(res.data.usernames || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // A simple client-side password for basic authorization. 
    // You can change this to whatever you want.
    if (password === "loogied") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.trim()) return;
    setLoading(true);
    
    // Check if it's a valid Leetcode user first
    try {
      const [profileRes, solvedRes, calendarRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${newUser}`),
        axios.get(`https://kinkdin.onrender.com/${newUser}/solved`),
        axios.get(`https://kinkdin.onrender.com/${newUser}/calendar`)
      ]);

      if (profileRes.data.errors || solvedRes.data.errors || calendarRes.data.errors) {
         alert("Invalid LeetCode username or API error!");
         setLoading(false);
         return;
      }

      await axios.post("/api/users", { username: newUser });
      setNewUser("");
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error adding user to database");
    }
    setLoading(false);
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to completely remove ${username}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/api/users?username=${username}`);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to delete user");
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#1a1917] p-8 rounded-xl border border-[#2a2926] max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-6 text-[#e8e6e3]">Admin Access</h1>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password (admin123)"
            className="bg-[#111110] border border-[#2a2926] rounded-lg px-4 py-3 text-sm text-[#e8e6e3] w-full mb-4 focus:outline-none focus:border-[#e07a3a]"
          />
          <button type="submit" className="w-full bg-[#e07a3a] text-[#111110] py-3 rounded-lg font-semibold hover:bg-[#e07a3a]/90 transition-colors">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-12 max-w-2xl mx-auto">
      <Link href="/" className="group flex items-center gap-1.5 text-[#6b6963] hover:text-[#e8e6e3] transition-colors mb-8 w-fit">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-mono">back to leaderboard</span>
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Admin Panel</h1>
      <p className="text-[#6b6963] text-sm mb-10">Manage mentees. Changes reflect instantly on the public leaderboard.</p>

      {/* Add Form */}
      <div className="bg-[#1a1917] p-6 rounded-xl border border-[#2a2926] mb-8">
        <h2 className="text-sm font-semibold mb-4 text-[#e8e6e3]">Add New Mentee</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input 
            type="text" 
            value={newUser}
            onChange={e => setNewUser(e.target.value)}
            placeholder="LeetCode username..."
            className="flex-1 bg-[#111110] border border-[#2a2926] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder-[#6b6963] focus:outline-none focus:border-[#e07a3a] transition-colors"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#3db86a] text-[#111110] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3db86a]/90 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {/* User List */}
      <div className="bg-[#1a1917] rounded-xl border border-[#2a2926] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2926] bg-[#1a1917]/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-[#e8e6e3]">Current Mentees ({users.length})</h2>
        </div>
        <div className="divide-y divide-[#2a2926]">
          {users.map(u => (
            <div key={u} className="px-6 py-4 flex items-center justify-between hover:bg-[#111110]/50 transition-colors">
              <span className="text-sm font-medium text-[#e8e6e3]">{u}</span>
              <button 
                onClick={() => handleDelete(u)}
                disabled={loading}
                className="text-[#6b6963] hover:text-[#e05a5a] p-2 rounded-lg hover:bg-[#e05a5a]/10 transition-colors disabled:opacity-50"
                title={`Delete ${u}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {users.length === 0 && (
            <div className="px-6 py-8 text-center text-[#6b6963] text-sm font-mono">
              no users in database
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
