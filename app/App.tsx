'use client';

import { useState, useEffect, useMemo } from 'react';
import { Flame, Hash, Target, Award, ChevronLeft } from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [currentPage, setCurrentPage] = useState('leaderboard');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultUsers = ["zuri10", "divyanshi_dhangar2005", "Syed_Ali_Raza786", "IdPoTqX4HA", "Aditi_singh16", "Kratikajaiswal_25"];
    
    defaultUsers.forEach(username => fetchUser(username));
  }, []);

  const fetchUser = async (username) => {
    try {
      const [solvedRes, profileRes, calendarRes] = await Promise.all([
        axios.get(`https://kinkdin.onrender.com/${username}/solved`),
        axios.get(`https://kinkdin.onrender.com/${username}`),
        axios.get(`https://kinkdin.onrender.com/${username}/calendar`)
      ]);

      const calendarData = calendarRes.data;
      const submissionCalendar = calendarData.submissionCalendar ? JSON.parse(calendarData.submissionCalendar) : {};
      
      const getDateTimestamp = (date) => {
        const d = new Date(date);
        const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.floor(utcDate / 1000);
      };
      
      const today = new Date();
      
      const last8Days = Array.from({ length: 8 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (7 - i));
        return getDateTimestamp(date);
      });
      
      const streak = last8Days.map(timestamp => {
        return submissionCalendar[timestamp] ? 1 : 0;
      });

      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - mondayOffset + i);
        const timestamp = getDateTimestamp(date);
        return submissionCalendar[timestamp] ? true : false;
      });

      let currentStreak = 0;
      const sortedTimestamps = Object.keys(submissionCalendar)
        .map(Number)
        .sort((a, b) => b - a);
      
      const todayTimestamp = getDateTimestamp(today);
      const yesterdayTimestamp = getDateTimestamp(new Date(today.getTime() - 86400000));
      
      let checkDate = sortedTimestamps[0] >= todayTimestamp ? todayTimestamp : yesterdayTimestamp;
      
      for (let ts of sortedTimestamps) {
        if (ts <= checkDate) {
          if (ts === checkDate) {
            currentStreak++;
            checkDate -= 86400;
          } else {
            const daysDiff = Math.floor((checkDate - ts) / 86400);
            if (daysDiff > 1) break;
          }
        }
      }

      const thisWeekCount = weekDays.filter(day => day).length;
      const totalProblems = 3000;
      const completion = Math.round((solvedRes.data.solvedProblem / totalProblems) * 100);

      console.log('Calendar Data:', {
        username,
        streak,
        weekDays,
        currentStreak,
        thisWeekCount,
        submissionCalendar: Object.keys(submissionCalendar).length,
        last8Days,
        todayTimestamp
      });

      const newUser = {
        name: username,
        img: profileRes.data.avatar || profileRes.data.profile?.userAvatar,
        easy: solvedRes.data.easySolved,
        medium: solvedRes.data.mediumSolved,
        hard: solvedRes.data.hardSolved,
        solved: solvedRes.data.solvedProblem,
        streak: streak,
        currentStreak: currentStreak,
        thisWeek: thisWeekCount,
        completion: completion,
        weekDays: weekDays
      };

      setUsers(prev => {
        if (prev.some(u => u.name.toLowerCase() === username.toLowerCase())) {
          return prev;
        }
        return [...prev, newUser];
      });
      setLoading(false);
    } catch (error) {
      console.log("Error fetching user:", error.message);
      setLoading(false);
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const locksB = (b.easy * 50) + (b.medium * 100) + (b.hard * 200);
      const locksA = (a.easy * 50) + (a.medium * 100) + (a.hard * 200);
      return locksB - locksA;
    });
  }, [users]);

  const openDashboard = (user) => {
    setSelectedUser(user);
    setCurrentPage('dashboard');
  };

  const backToLeaderboard = () => {
    setCurrentPage('leaderboard');
    setSelectedUser(null);
  };

  if (currentPage === 'leaderboard') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h1 className="text-2xl font-bold mb-1">Streak Tracker</h1>
            <p className="text-slate-400 text-sm">Track your daily progress</p>
          </div>

          {loading && users.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Loading users...</div>
          ) : (
            <div className="space-y-3">
              {sortedUsers.map((user, index) => (
                <div 
                  key={user.name} 
                  className="relative cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => openDashboard(user)}
                >
                  {index < 3 && (
                    <div className="absolute -right-2 -top-2 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 z-10">
                      {index + 1}
                    </div>
                  )}
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600">
                        {user.img ? (
                          <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            👤
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-slate-400 text-sm">{user.solved} problems solved</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {user.streak.map((active, i) => (
                        <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${
                          active === 1 ? 'bg-green-500' : 'bg-slate-700'
                        }`}></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const user = selectedUser;
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        
        <div className="bg-slate-800 rounded-xl p-4 md:p-6">
          <button 
            onClick={backToLeaderboard}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-3 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back to Leaderboard</span>
          </button>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your weekly progress</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600">
              {user.img ? (
                <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-slate-400">{user.solved} problems solved</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-slate-800 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Current Streak</p>
                <p className="text-2xl md:text-3xl font-bold">{user.currentStreak}</p>
                <p className="text-slate-400 text-xs">days</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Hash className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Solved</p>
                <p className="text-2xl md:text-3xl font-bold">{user.solved}</p>
                <p className="text-slate-400 text-xs">problems</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">This Week</p>
                <p className="text-2xl md:text-3xl font-bold">{user.thisWeek}</p>
                <p className="text-slate-400 text-xs">/ 7 days</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Completion</p>
                <p className="text-2xl md:text-3xl font-bold">{user.completion}</p>
                <p className="text-slate-400 text-xs">%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-semibold mb-4">This Week</h2>
          <div className="flex gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={i} className="flex-1">
                <div className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                  user.weekDays[i] === true ? 'bg-green-500' : 'bg-slate-700'
                }`}>
                  {user.weekDays[i] === true && <span className="text-lg text-white">✓</span>}
                </div>
                <p className="text-xs text-center mt-1 text-slate-400">{day}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Problems by Difficulty</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Easy</span>
                <span className="text-sm font-bold">{user.easy}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${(user.easy/800)*100}%`}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Medium</span>
                <span className="text-sm font-bold">{user.medium}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-orange-500 h-2.5 rounded-full" style={{width: `${(user.medium/1700)*100}%`}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Hard</span>
                <span className="text-sm font-bold">{user.hard}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-pink-500 h-2.5 rounded-full" style={{width: `${(user.hard/700)*100}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}