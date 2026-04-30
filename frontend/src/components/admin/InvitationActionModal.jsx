import { useState, useEffect } from 'react';
import { Mail, MessageCircle, X, Loader2, Send, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvitationActionModal({ isOpen, onClose, guest, onSendEmail, onSendWhatsApp, onUpdateGuest }) {
    const [isSending, setIsSending] = useState(false);
    const [editData, setEditData] = useState({
        email: '',
        phone: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    // Sync state when guest changes
    useEffect(() => {
        if (guest) {
            setEditData({
                email: guest.email || '',
                phone: guest.phone || ''
            });
            setIsEditing(false);
        }
    }, [guest]);

    if (!guest) return null;

    const handleSendEmail = async () => {
        if (!editData.email) return;
        setIsSending(true);
        try {
            await onSendEmail(guest);
            onClose();
        } finally {
            setIsSending(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!editData.phone) return;
        setIsSending(true);
        try {
            await onSendWhatsApp(guest);
            onClose();
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveEdit = async () => {
        await onUpdateGuest(guest, editData);
        setIsEditing(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-stone-800">Invite {guest.name}</h3>
                                    {guest.rsvp_status !== 'pending' && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {guest.rsvp_status}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-stone-500 mt-1">Select your preferred invitation channel</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Contact Info Card */}
                            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 relative group">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[#A67B5B] bg-white p-2 rounded-lg shadow-sm">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        {isEditing ? (
                                            <input 
                                                type="email" 
                                                value={editData.email}
                                                onChange={(e) => setEditData({...editData, email: e.target.value})}
                                                className="bg-white border rounded px-2 py-1 text-sm w-full"
                                                placeholder="Enter email..."
                                            />
                                        ) : (
                                            <span className="text-stone-700 font-medium">{guest.email || <span className="text-stone-300 italic">No email</span>}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-green-600 bg-white p-2 rounded-lg shadow-sm">
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={editData.phone}
                                                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                                className="bg-white border rounded px-2 py-1 text-sm w-full"
                                                placeholder="Enter phone (e.g. 254...)"
                                            />
                                        ) : (
                                            <span className="text-stone-700 font-medium">{guest.phone || <span className="text-stone-300 italic">No phone number</span>}</span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
                                    className="absolute top-4 right-4 text-xs font-bold uppercase tracking-wider text-[#A67B5B] hover:text-[#8C6A4D]"
                                >
                                    {isEditing ? 'Save' : 'Update Info'}
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={handleSendEmail}
                                    disabled={!editData.email || isSending}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group
                                        ${!editData.email ? 'opacity-50 grayscale bg-stone-50 border-transparent cursor-not-allowed' : 
                                        'bg-white border-stone-100 hover:border-[#A67B5B]/30 hover:bg-[#A67B5B]/5'}
                                    `}
                                >
                                    <div className={`p-4 rounded-full transition-colors ${editData.email ? 'bg-stone-50 group-hover:bg-[#A67B5B] text-stone-400 group-hover:text-white' : 'bg-stone-200 text-white'}`}>
                                        <Mail className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-bold text-stone-800">Email Invite</span>
                                        <span className="text-[10px] text-stone-500 font-medium uppercase tracking-tighter">Official & Formal</span>
                                    </div>
                                </button>

                                <button 
                                    onClick={handleSendWhatsApp}
                                    disabled={!editData.phone || isSending}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group
                                        ${!editData.phone ? 'opacity-50 grayscale bg-stone-50 border-transparent cursor-not-allowed' : 
                                        'bg-white border-stone-100 hover:border-green-100 hover:bg-green-50'}
                                    `}
                                >
                                    <div className={`p-4 rounded-full transition-colors ${editData.phone ? 'bg-stone-50 group-hover:bg-green-500 text-stone-400 group-hover:text-white' : 'bg-stone-200 text-white'}`}>
                                        <MessageCircle className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-bold text-stone-800">WhatsApp Invite</span>
                                        <span className="text-[10px] text-stone-500 font-medium uppercase tracking-tighter">Personal & Fast</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Footer info */}
                        <div className="p-4 bg-stone-50 text-center border-t border-stone-100">
                            {isSending ? (
                                <div className="flex items-center justify-center gap-2 text-[#A67B5B] font-medium text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing invitation...
                                </div>
                            ) : (
                                <p className="text-[11px] text-stone-400">
                                    Sending an invitation will mark this guest as "Invited" in the system.
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
