import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { guestService, tableService } from '../../services/api';
import { Plus, Users, MoreVertical, Trash2, Check, X, Search, Eye, Armchair } from 'lucide-react';
import AdminPageHero from '../../components/admin/AdminPageHero';

// Portal for Dropdowns/Modals
const Portal = ({ children }) => {
  return createPortal(children, document.body);
};


// GuestItem with Portal Menu
function GuestItem({ guest, tables, onAssign }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  
  const plusOnesCount = guest.plus_ones?.length || 0;

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ 
        top: rect.bottom + window.scrollY + 5, 
        left: rect.right + window.scrollX - 224 // Align right edge (w-56 = 224px)
      });
    }
    setShowMenu(!showMenu);
  };

  // Close menu when clicking outside (handled by overlay in Portal)

  return (
    <>
        <div className="p-3 bg-white rounded-lg shadow-sm border border-stone-200 flex items-center justify-between group hover:border-[#A67B5B]/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                    {guest.name.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-medium text-stone-700">{guest.name}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-stone-500 capitalize">{guest.group}</p>
                        {plusOnesCount > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                +{plusOnesCount}
                            </span>
                        )}
                    </div>
                    {plusOnesCount > 0 && (
                        <p className="text-[10px] text-stone-400 mt-0.5">
                            {guest.plus_ones.map(po => po.name).join(', ')}
                        </p>
                    )}
                </div>
            </div>
            
            <button 
                ref={buttonRef}
                onClick={handleToggleMenu} 
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>

        {/* Portal Menu */}
        <AnimatePresence>
            {showMenu && (
                <Portal>
                     <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        style={{ top: menuPos.top, left: menuPos.left }}
                        className="fixed w-56 bg-white rounded-xl shadow-xl border border-stone-100 z-[101] overflow-hidden"
                     >
                        <div className="bg-stone-50 px-3 py-2 border-b border-stone-100">
                            <p className="text-xs font-semibold text-stone-500">Assign to Table</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                            {tables.length > 0 ? (
                                tables.map(table => {
                                    const isFull = (table.guests?.length || 0) >= table.capacity;
                                    return (
                                        <button
                                            key={table.id}
                                            onClick={() => { onAssign(guest.id, table.id); setShowMenu(false); }}
                                            disabled={isFull}
                                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors
                                                ${isFull ? 'opacity-50 cursor-not-allowed text-stone-400' : 'text-stone-700 hover:bg-[#FAF7F2] hover:text-[#A67B5B]'}
                                            `}
                                        >
                                            <span>{table.name}</span>
                                            <span className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                                                {table.guests?.length || 0}/{table.capacity}
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-3 text-sm text-stone-400 text-center italic">
                                    No tables created yet
                                </div>
                            )}
                        </div>
                     </motion.div>
                </Portal>
            )}
        </AnimatePresence>
    </>
  );
}

// Table Card for List View
function TableCard({ table, onClick, onDelete }) {
    const isFull = (table.guests?.length || 0) >= table.capacity;

    return (
        <motion.div
            layout
            onClick={() => onClick(table)}
            className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 hover:shadow-md hover:border-[#A67B5B]/30 transition-all cursor-pointer group relative"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFull ? 'bg-amber-50 text-[#A67B5B]' : 'bg-stone-100 text-stone-500'}`}>
                        <Armchair className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-stone-800">{table.name}</h3>
                        <p className="text-xs text-stone-500 capitalize">{table.type} Table</p>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(table.id); }}
                    className="p-1.5 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-500"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Capacity</span>
                    <span className={`font-medium ${isFull ? 'text-[#A67B5B]' : 'text-stone-700'}`}>
                        {table.guests?.length || 0} / {table.capacity}
                    </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-[#A67B5B]' : 'bg-stone-300'}`}
                        style={{ width: `${Math.min(100, ((table.guests?.length || 0) / table.capacity) * 100)}%` }}
                    />
                </div>

                {/* Guest Preview */}
                <div className="flex -space-x-2 pt-1">
                    {table.guests?.slice(0, 4).map((g, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-stone-100 border border-white flex items-center justify-center text-[10px] text-stone-500 shadow-sm">
                            {g.name.charAt(0)}
                        </div>
                    ))}
                    {(table.guests?.length || 0) > 4 && (
                        <div className="w-6 h-6 rounded-full bg-stone-50 border border-white flex items-center justify-center text-[9px] text-stone-500 shadow-sm">
                            +{table.guests.length - 4}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>View Details</span>
                <Eye className="w-3 h-3 group-hover:text-[#A67B5B] transition-colors" />
            </div>
        </motion.div>
    );
}

// Table Details Modal
function TableDetailsModal({ table, onClose, onUnassign }) {
    if (!table) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100"
                >
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#A67B5B]/10 flex items-center justify-center text-[#A67B5B]">
                                <Armchair className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xl text-stone-800">{table.name}</h3>
                                <p className="text-xs text-stone-500">Capacity: {table.guests?.length || 0}/{table.capacity}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {table.guests && table.guests.length > 0 ? (
                            <div className="space-y-1">
                                {table.guests.map(guest => (
                                    <div key={guest.id} className="p-3 hover:bg-stone-50 rounded-xl flex items-center justify-between group transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                                                {guest.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-stone-700">{guest.name}</p>
                                                <p className="text-xs text-stone-500 capitalize">{guest.group}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onUnassign(guest.id)}
                                            className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-xs flex items-center gap-1"
                                            title="Unassign Guest"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <Users className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                                <p className="text-stone-500">This table is empty</p>
                                <p className="text-xs text-stone-400 mt-1">Assign guests from the sidebar</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}

export default function SeatingChart() {
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Table Form
  const [newTable, setNewTable] = useState({ name: '', capacity: 10, type: 'round' });
  const [isAdding, setIsAdding] = useState(false);
  
  // Selected Table for Modal
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [guestRes, tableRes] = await Promise.all([
            guestService.getAll(),
            tableService.getAll()
        ]);
        setGuests(guestRes.data.data || guestRes.data || []);
        
        // Ensure table.guests is populated (backend should return it with eager load)
        setTables(tableRes.data || []);
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  const handleAssignGuest = async (guestId, tableId) => {
      try {
          await tableService.assignGuest(tableId, guestId);
          fetchData(); 
          
          // Use setTimeout because we refresh data from server
          // If modal is open, we need to refresh selectedTable too
          if (selectedTable && selectedTable.id === tableId) {
             // We can't update selectedTable directly with new data until fetch completes
             // A better way: store selectedTableId and derive selectedTable from tables array
          }
      } catch (err) {
          alert('Failed to assign guest: ' + (err.response?.data?.message || err.message));
      }
  };
  
  const handleUnassignGuest = async (guestId) => {
      try {
          // Assuming API has unassign endpoint: DELETE /tables/{table}/guests/{guest} or similar
          // Or update guest setting table_id = null
          await tableService.unassignGuest(guestId); // Check api.js for correct method
          fetchData();
      } catch (err) {
           alert('Failed to unassign guest');
      }
  };

  const handleAddTable = async () => {
      try {
          // Default position center (not used in list view but keep for model compat)
          const tableData = { ...newTable, x: 100, y: 100 };
          await tableService.create(tableData);
          setNewTable({ name: '', capacity: 10, type: 'round' });
          setIsAdding(false);
          fetchData();
      } catch (err) {
          alert('Failed to add table');
      }
  };

  const handleDeleteTable = async (id) => {
      if (confirm('Delete this table? Assigned guests will be unassigned.')) {
          await tableService.delete(id);
          fetchData();
          if (selectedTable?.id === id) setSelectedTable(null);
      }
  };

  const unassignedGuests = guests
    .filter(g => !g.table_id)
    .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Derive active selected table from state to get updates
  const activeSelectedTable = selectedTable ? tables.find(t => t.id === selectedTable.id) : null;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
       <AdminPageHero
          title="Seating Chart"
          description="Drag and drop guests to assign them to tables"
          breadcrumb={[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Seating Chart' },
          ]}
          icon={<Armchair className="w-5 h-5 text-[#A67B5B]" />}
       />

       <div className="flex-1 flex gap-6 overflow-hidden">
           {/* Sidebar: Unassigned Guests */}
           <div className="w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 h-full relative z-20">
              <div className="p-4 border-b border-stone-100 space-y-3">
              <div>
                <h2 className="font-semibold text-lg text-stone-800">Guests ({unassignedGuests.length})</h2>
                <p className="text-xs text-stone-500">Unassigned guests</p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                    type="text" 
                    placeholder="Search guests..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#A67B5B]"
                />
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {unassignedGuests.map(guest => (
                  <GuestItem 
                    key={guest.id} 
                    guest={guest} 
                    tables={tables}
                    onAssign={handleAssignGuest}
                  />
              ))}
              {unassignedGuests.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-sm">
                      No guests found
                  </div>
              )}
          </div>
       </div>

       {/* Main Area: Table Grid */}
       <div className="flex-1 bg-stone-50/50 rounded-2xl border-2 border-dashed border-stone-200 relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-stone-100/50">
              <div>
                  <h2 className="font-semibold text-lg text-stone-800">Tables Overview</h2>
              </div>
              
              {isAdding ? (
                  <div className="bg-white p-2 rounded-xl shadow-lg border border-stone-100 flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
                       <input 
                          type="text" 
                          placeholder="Table Name"
                          className="w-32 px-3 py-2 bg-stone-50 border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#A67B5B]"
                          value={newTable.name}
                          onChange={e => setNewTable({...newTable, name: e.target.value})}
                       />
                       <input 
                          type="number" 
                          className="w-20 px-3 py-2 bg-stone-50 border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#A67B5B]"
                          value={newTable.capacity}
                          onChange={e => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                          placeholder="Cap"
                       />
                       <button onClick={handleAddTable} className="p-2 bg-[#A67B5B] text-white rounded-lg hover:bg-[#8B6A4E]">
                           <Check className="w-4 h-4" />
                       </button>
                       <button onClick={() => setIsAdding(false)} className="p-2 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200">
                           <X className="w-4 h-4" />
                       </button>
                  </div>
              ) : (
                  <button 
                      onClick={() => setIsAdding(true)}
                      className="btn-primary flex items-center gap-2 shadow-lg"
                  >
                      <Plus className="w-4 h-4" />
                      Add Table
                  </button>
              )}
          </div>

          {/* Table Grid */}
          <div className="flex-1 overflow-y-auto p-6">
              {tables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {tables.map(table => (
                          <TableCard 
                              key={table.id}
                              table={table}
                              onClick={setSelectedTable}
                              onDelete={handleDeleteTable}
                          />
                      ))}
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                      <Armchair className="w-16 h-16 mb-4 opacity-20" />
                      <p>No tables created yet</p>
                      <button onClick={() => setIsAdding(true)} className="text-[#A67B5B] hover:underline mt-2 text-sm">Create your first table</button>
                  </div>
              )}
          </div>
       </div>

       {/* Modals */}
       <AnimatePresence>
            {activeSelectedTable && (
                <TableDetailsModal 
                    table={activeSelectedTable} 
                    onClose={() => setSelectedTable(null)}
                    onUnassign={handleUnassignGuest}
                />
            )}
       </AnimatePresence>
       </div>
    </div>
  );
}
