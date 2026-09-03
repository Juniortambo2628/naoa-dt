import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Armchair, Users, MapPin } from 'lucide-react';
import { tableService } from '../services/api';

function TableShape({ table, isGuestsTable, guestCount }) {
    const isRound = table.type === 'round';

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative flex flex-col items-center ${isGuestsTable ? 'z-10' : ''}`}
        >
            <div
                className={`
                    flex items-center justify-center transition-all
                    ${isRound ? 'rounded-full' : 'rounded-xl'}
                    ${isGuestsTable 
                        ? 'w-24 h-24 md:w-28 md:h-28 border-3 shadow-lg' 
                        : 'w-20 h-20 md:w-24 md:h-24 border-2'}
                `}
                style={{
                    background: isGuestsTable 
                        ? 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)' 
                        : 'rgba(255,255,255,0.9)',
                    borderColor: isGuestsTable ? '#A67B5B' : '#E8D4C8',
                    boxShadow: isGuestsTable ? '0 8px 30px rgba(166, 123, 91, 0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
                }}
            >
                <div className="text-center">
                    <span className={`text-[10px] font-bold block ${isGuestsTable ? 'text-white' : 'text-stone-600'}`}>
                        {table.name}
                    </span>
                    <span className={`text-[8px] block ${isGuestsTable ? 'text-white/80' : 'text-stone-400'}`}>
                        {guestCount}/{table.capacity}
                    </span>
                </div>
            </div>
            
            {/* Seat dots */}
            <div className={`absolute -bottom-1 flex gap-0.5 ${isRound ? '' : 'flex-wrap w-20 justify-center'}`}>
                {Array.from({ length: Math.min(table.capacity, 8) }).map((_, i) => (
                    <div 
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < guestCount ? 'bg-[#A67B5B]' : 'bg-stone-200'}`}
                    />
                ))}
                {table.capacity > 8 && (
                    <span className="text-[7px] text-stone-400 ml-0.5">+{table.capacity - 8}</span>
                )}
            </div>

            {isGuestsTable && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-6 bg-[#A67B5B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                    Your Table
                </motion.div>
            )}
        </motion.div>
    );
}

export default function PublicSeatingChart({ guestCode }) {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [guestTableId, setGuestTableId] = useState(null);

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
                }
            } catch {
                // Guest lookup failed silently
            }
        };
        fetchGuest();
    }, [guestCode, tables]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Armchair className="w-6 h-6 text-stone-300 animate-pulse" />
            </div>
        );
    }

    if (!tables.length) return null;

    const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
    const filledSeats = tables.reduce((s, t) => s + (t.guests?.length || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-[#A67B5B]/10 flex items-center justify-center">
                    <Armchair className="w-4 h-4 text-[#A67B5B]" />
                </div>
                <div>
                    <h3 className="font-semibold text-stone-800">Seating Arrangement</h3>
                    <p className="text-xs text-stone-400">{filledSeats} of {totalSeats} seats filled</p>
                </div>
            </div>

            <div className="relative bg-[#FAF7F2] rounded-xl p-6 min-h-[200px]">
                {/* Floor plan grid */}
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                    {tables.map(table => (
                        <div key={table.id} className="flex flex-col items-center gap-2">
                            <TableShape 
                                table={table} 
                                isGuestsTable={table.id === guestTableId}
                                guestCount={table.guests?.length || 0}
                            />
                            <div className="flex -space-x-1 mt-1">
                                {(table.guests || []).slice(0, 4).map((g, i) => (
                                    <div 
                                        key={i}
                                        className="w-5 h-5 rounded-full bg-stone-100 border border-white flex items-center justify-center text-[7px] text-stone-500"
                                        title={g.name}
                                    >
                                        {g.name.charAt(0)}
                                    </div>
                                ))}
                                {(table.guests?.length || 0) > 4 && (
                                    <div className="w-5 h-5 rounded-full bg-stone-50 border border-white flex items-center justify-center text-[7px] text-stone-400">
                                        +{table.guests.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {guestTableId && (
                <p className="text-xs text-center text-[#A67B5B] mt-4 font-medium">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    Look for your highlighted table above
                </p>
            )}
        </motion.div>
    );
}
