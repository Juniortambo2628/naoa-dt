import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, Users, MapPin, Maximize2, X, Search } from 'lucide-react';
import { tableService } from '../services/api';

const GROUP_COLORS = {
  family: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', dot: 'bg-rose-400' },
  friends: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-400' },
  colleagues: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  vip: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-400' },
  default: { bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-600', dot: 'bg-stone-400' },
};

function getGroupColor(group) {
  return GROUP_COLORS[group?.toLowerCase()] || GROUP_COLORS.default;
}

function TableShape({ table, isGuestsTable, guestCount, onClick, isSelected }) {
  const isRound = table.type === 'round';
  const isFull = guestCount >= table.capacity;
  const isEmpty = guestCount === 0;
  const fillPercent = Math.round((guestCount / table.capacity) * 100);

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(table)}
      className={`relative flex flex-col items-center cursor-pointer ${isGuestsTable ? 'z-10' : ''}`}
    >
      {/* Pulse animation for guest's table */}
      {isGuestsTable && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-[#A67B5B]"
          style={{ margin: '-4px' }}
        />
      )}
      
      <div
        className={`
          relative flex items-center justify-center transition-all duration-300
          ${isRound ? 'rounded-full' : 'rounded-2xl'}
          ${isGuestsTable 
            ? 'w-28 h-28 md:w-32 md:h-32 border-[3px]' 
            : isSelected
              ? 'w-26 h-26 md:w-28 md:h-28 border-2'
              : 'w-22 h-22 md:w-24 md:h-24 border-2'}
        `}
        style={{
          background: isGuestsTable 
            ? 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)' 
            : isFull
              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
              : 'rgba(255,255,255,0.95)',
          borderColor: isGuestsTable 
            ? '#A67B5B' 
            : isSelected
              ? '#A67B5B'
              : isFull
                ? '#fbbf24'
                : '#E8D4C8',
          boxShadow: isGuestsTable 
            ? '0 12px 40px rgba(166, 123, 91, 0.4)' 
            : isSelected
              ? '0 8px 25px rgba(166, 123, 91, 0.2)'
              : '0 4px 15px rgba(0,0,0,0.08)',
        }}
      >
        {/* Fill indicator ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={isGuestsTable ? 'rgba(255,255,255,0.3)' : '#E8D4C8'}
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={isGuestsTable ? 'rgba(255,255,255,0.7)' : '#A67B5B'}
            strokeWidth="2"
            strokeDasharray={`${fillPercent * 3.01} ${301 - fillPercent * 3.01}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        <div className="text-center relative z-10">
          <span className={`text-xs font-bold block ${isGuestsTable ? 'text-white' : 'text-stone-700'}`}>
            {table.name}
          </span>
          <span className={`text-[10px] block ${isGuestsTable ? 'text-white/80' : isFull ? 'text-amber-600' : 'text-stone-400'}`}>
            {guestCount}/{table.capacity}
          </span>
          {isFull && !isGuestsTable && (
            <span className="text-[8px] text-amber-500 font-medium">FULL</span>
          )}
        </div>
      </div>

      {/* Seat indicators */}
      <div className={`absolute -bottom-2 flex gap-1 ${isRound ? '' : 'flex-wrap w-24 justify-center'}`}>
        {Array.from({ length: Math.min(table.capacity, 10) }).map((_, i) => (
          <motion.div 
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < guestCount 
                ? isGuestsTable 
                  ? 'bg-white shadow-sm' 
                  : 'bg-[#A67B5B]' 
                : 'bg-stone-200'
            }`}
          />
        ))}
        {table.capacity > 10 && (
          <span className="text-[8px] text-stone-400 ml-0.5">+{table.capacity - 10}</span>
        )}
      </div>

      {isGuestsTable && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-7 bg-gradient-to-r from-[#A67B5B] to-[#C8A68E] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg"
        >
          ✨ Your Table
        </motion.div>
      )}
    </motion.div>
  );
}

function GuestList({ guests, maxShow = 6 }) {
  const [showAll, setShowAll] = useState(false);
  const displayGuests = showAll ? guests : guests.slice(0, maxShow);
  const remaining = guests.length - maxShow;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {displayGuests.map((guest, i) => {
          const colors = getGroupColor(guest.group);
          return (
            <motion.div
              key={guest.id || i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {guest.name}
            </motion.div>
          );
        })}
      </div>
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-[#A67B5B] hover:underline"
        >
          +{remaining} more
        </button>
      )}
      {showAll && guests.length > maxShow && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-stone-400 hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function TableDetailPanel({ table, guestTableId, onClose }) {
  if (!table) return null;
  const isGuestsTable = table.id === guestTableId;
  const guests = table.guests || [];
  const fillPercent = Math.round((guests.length / table.capacity) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-2xl border border-stone-200 shadow-lg p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isGuestsTable ? 'bg-gradient-to-br from-[#A67B5B] to-[#C8A68E]' : 'bg-stone-100'
            }`}
          >
            <Armchair className={`w-5 h-5 ${isGuestsTable ? 'text-white' : 'text-stone-500'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-stone-800">{table.name}</h4>
            <p className="text-xs text-stone-400 capitalize">{table.type || 'round'} table</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Capacity bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-stone-500">Capacity</span>
          <span className="font-medium text-stone-700">{guests.length}/{table.capacity}</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            className={`h-full rounded-full ${
              fillPercent >= 100 ? 'bg-amber-400' : fillPercent >= 75 ? 'bg-[#A67B5B]' : 'bg-emerald-400'
            }`}
          />
        </div>
      </div>

      {/* Guest list */}
      <div>
        <p className="text-xs font-medium text-stone-500 mb-2">Guests at this table</p>
        {guests.length > 0 ? (
          <GuestList guests={guests} />
        ) : (
          <p className="text-xs text-stone-400 italic">No guests assigned yet</p>
        )}
      </div>
    </motion.div>
  );
}

export default function PublicSeatingChart({ guestCode, embedded = true }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestTableId, setGuestTableId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await tableService.getPublic();
        setTables(res.data || []);
      } catch (err) {
        console.error('Failed to fetch seating', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    if (!guestCode || !tables.length) return;
    const fetchGuest = async () => {
      try {
        const { guestService } = await import('../services/api');
        const res = await guestService.getByCode(guestCode);
        if (res.data?.table_id) {
          setGuestTableId(res.data.table_id);
          // Auto-select guest's table
          const guestTable = tables.find(t => t.id === res.data.table_id);
          if (guestTable) setSelectedTable(guestTable);
        }
      } catch {
        // Guest lookup failed silently
      }
    };
    fetchGuest();
  }, [guestCode, tables]);

  // Filter tables by search
  const filteredTables = tables.filter(table => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = table.name?.toLowerCase().includes(query);
    const matchesGuest = table.guests?.some(g => g.name?.toLowerCase().includes(query));
    return matchesName || matchesGuest;
  });

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const filledSeats = tables.reduce((s, t) => s + (t.guests?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Armchair className="w-8 h-8 text-stone-300 animate-pulse" />
          <p className="text-sm text-stone-400">Loading seating chart...</p>
        </div>
      </div>
    );
  }

  if (!tables.length) return null;

  const chartContent = (
    <div className="relative bg-gradient-to-br from-[#FAF7F2] to-[#F5EDE6] rounded-2xl p-4 md:p-6 min-h-[250px]">
      {/* Decorative elements */}
      <div className="absolute top-4 left-4 w-8 h-8 border-2 border-[#E8D4C8] rounded-lg opacity-30" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-[#E8D4C8] rounded-full opacity-20" />
      
      {/* Floor plan grid */}
      <div className="relative flex flex-wrap items-center justify-center gap-8 md:gap-10">
        {filteredTables.map((table, index) => (
          <motion.div 
            key={table.id} 
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <TableShape 
              table={table} 
              isGuestsTable={table.id === guestTableId}
              guestCount={table.guests?.length || 0}
              onClick={setSelectedTable}
              isSelected={selectedTable?.id === table.id}
            />
          </motion.div>
        ))}
      </div>

      {filteredTables.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-sm text-stone-400">No tables matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );

  const headerContent = (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A67B5B] to-[#C8A68E] flex items-center justify-center shadow-lg">
          <Armchair className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-800 text-lg">Seating Arrangement</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#A67B5B]" />
              <p className="text-xs text-stone-400">{filledSeats} of {totalSeats} seats filled</p>
            </div>
            <span className="text-stone-300">•</span>
            <p className="text-xs text-stone-400">{tables.length} tables</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find table or guest..."
            className="pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B] w-40 md:w-48"
          />
        </div>
        
        {/* Expand button */}
        {embedded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors group"
            title="Expand to full view"
          >
            <Maximize2 className="w-4 h-4 text-stone-400 group-hover:text-[#A67B5B]" />
          </button>
        )}
      </div>
    </div>
  );

  // Compact embedded view
  if (embedded && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6"
      >
        {headerContent}
        {chartContent}
        
        {guestTableId && !selectedTable && (
          <p className="text-xs text-center text-[#A67B5B] mt-4 font-medium">
            <MapPin className="w-3 h-3 inline mr-1" />
            Look for your highlighted table above
          </p>
        )}

        {/* Selected table preview */}
        <AnimatePresence>
          {selectedTable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <TableDetailPanel
                table={selectedTable}
                guestTableId={guestTableId}
                onClose={() => setSelectedTable(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Full expanded view (dialog)
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsExpanded(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A67B5B] to-[#C8A68E] flex items-center justify-center">
                  <Armchair className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-stone-800">Seating Arrangement</h2>
                  <p className="text-sm text-stone-400">{filledSeats} of {totalSeats} seats filled • {tables.length} tables</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            {/* Dialog content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="flex gap-6">
                {/* Chart area */}
                <div className="flex-1">
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tables or guests..."
                      className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
                    />
                  </div>

                  {/* Chart */}
                  <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F5EDE6] rounded-2xl p-6 min-h-[400px]">
                    <div className="flex flex-wrap items-center justify-center gap-10">
                      {filteredTables.map((table, index) => (
                        <motion.div 
                          key={table.id} 
                          className="flex flex-col items-center gap-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TableShape 
                            table={table} 
                            isGuestsTable={table.id === guestTableId}
                            guestCount={table.guests?.length || 0}
                            onClick={setSelectedTable}
                            isSelected={selectedTable?.id === table.id}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {filteredTables.length === 0 && searchQuery && (
                      <div className="text-center py-12">
                        <p className="text-stone-400">No tables matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>

                  {guestTableId && (
                    <p className="text-sm text-center text-[#A67B5B] mt-4 font-medium">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Look for your highlighted table above
                    </p>
                  )}
                </div>

                {/* Detail panel */}
                <AnimatePresence>
                  {selectedTable && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 320 }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-shrink-0 overflow-hidden"
                    >
                      <TableDetailPanel
                        table={selectedTable}
                        guestTableId={guestTableId}
                        onClose={() => setSelectedTable(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
