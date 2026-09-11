import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Search, Filter, UserCheck, User } from 'lucide-react';
import { checkinService } from '../services/api';
import NameBadge, { NameBadgeCompact } from './NameBadge';
import { useSmartPolling } from '../hooks/useSmartPolling';

const GROUP_FILTERS = [
  { value: 'all', label: 'All Guests' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'colleagues', label: 'Colleagues' },
  { value: 'vip', label: 'VIP' },
];

function GuestListItem({ guest, index }) {
  const firstName = guest.name?.split(' ')[0] || 'Guest';
  const checkedInTime = guest.checked_in_at ? new Date(guest.checked_in_at) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 hover:border-[#A67B5B]/30 transition-colors"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A67B5B] to-[#C8A68E] flex items-center justify-center text-white font-semibold text-sm">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <UserCheck className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{firstName}</p>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {guest.table_name && (
            <span>Table {guest.table_name}</span>
          )}
          {guest.group && (
            <>
              <span>•</span>
              <span className="capitalize">{guest.group}</span>
            </>
          )}
        </div>
      </div>

      {/* Time */}
      {checkedInTime && (
        <div className="text-right">
          <p className="text-xs text-stone-400">
            {checkedInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function GuestTracker({ embedded = false, guestCode }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [viewMode, setViewMode] = useState('badges'); // 'badges' or 'list'

  const fetchCheckedInGuests = useCallback(async () => {
    try {
      const res = await checkinService.getCheckedInGuests();
      const checkedIn = res.data || [];
      setGuests(checkedIn);
      return checkedIn;
    } catch (err) {
      console.error('Failed to fetch checked-in guests', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckedInGuests();
  }, [fetchCheckedInGuests]);

  // Smart polling for real-time updates
  const { hasNewItems } = useSmartPolling(fetchCheckedInGuests, {
    fastInterval: 10000,  // Check every 10 seconds
    slowInterval: 30000,  // Then every 30 seconds
    idleAfterMs: 120000,  // Stop after 2 minutes idle
    onNewItems: (newItems) => {
      // Merge new check-ins
      setGuests(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        const newCheckIns = newItems.filter(g => !existingIds.has(g.id));
        return newCheckIns.length > 0 ? [...prev, ...newCheckIns] : prev;
      });
    },
  });

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = !searchQuery || 
      guest.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.table_name?.toString().includes(searchQuery);
    
    const matchesGroup = groupFilter === 'all' || 
      guest.group?.toLowerCase() === groupFilter;
    
    return matchesSearch && matchesGroup;
  });

  // Stats
  const stats = {
    total: guests.length,
    family: guests.filter(g => g.group?.toLowerCase() === 'family').length,
    friends: guests.filter(g => g.group?.toLowerCase() === 'friends').length,
    colleagues: guests.filter(g => g.group?.toLowerCase() === 'colleagues').length,
    vip: guests.filter(g => g.group?.toLowerCase() === 'vip').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Users className="w-8 h-8 text-stone-300 animate-pulse" />
          <p className="text-sm text-stone-400">Loading guest tracker...</p>
        </div>
      </div>
    );
  }

  const trackerContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 text-lg">Who's Here</h3>
            <p className="text-sm text-stone-400">{stats.total} guests checked in</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-stone-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('badges')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'badges' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
          >
            Badges
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Family', count: stats.family, color: 'bg-rose-100 text-rose-600' },
          { label: 'Friends', count: stats.friends, color: 'bg-blue-100 text-blue-600' },
          { label: 'Colleagues', count: stats.colleagues, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'VIP', count: stats.vip, color: 'bg-amber-100 text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className={`p-3 rounded-xl ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs opacity-75">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or table..."
            className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
          />
        </div>
        
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B] bg-white"
        >
          {GROUP_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
      </div>

      {/* Guest display */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <p className="text-stone-500">
            {guests.length === 0 
              ? 'No guests have checked in yet'
              : 'No guests match your search'
            }
          </p>
        </div>
      ) : viewMode === 'badges' ? (
        <div className="flex flex-wrap gap-4 justify-center">
          <AnimatePresence>
            {filteredGuests.map((guest, i) => (
              <NameBadge 
                key={guest.id} 
                guest={{ ...guest, table_name: guest.table_name }} 
                size="normal"
                animate={true}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {filteredGuests.map((guest, i) => (
              <GuestListItem key={guest.id} guest={guest} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Live indicator */}
      {guests.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-stone-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live updates enabled
        </div>
      )}
    </>
  );

  // Compact embedded view
  if (embedded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6"
      >
        {trackerContent}
      </motion.div>
    );
  }

  // Full page view
  return (
    <div className="space-y-6">
      {trackerContent}
    </div>
  );
}
