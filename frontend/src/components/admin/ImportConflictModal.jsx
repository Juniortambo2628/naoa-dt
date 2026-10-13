import Overlay from '../Overlay';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check, ArrowRight, User, Mail, Phone, Users } from 'lucide-react';
import Button from '../Button';
import SegmentedControl from '../SegmentedControl';

const RESOLUTION_OPTIONS = [
    { value: 'skip', label: 'Keep Existing' },
    { value: 'overwrite', label: 'Use New' },
    { value: 'merge', label: 'Merge Fields' },
];

export default function ImportConflictModal({ isOpen, onClose, conflicts, validCount, onConfirm }) {
    const [resolutions, setResolutions] = useState(
        conflicts.map(() => 'skip')
    );

    const handleResolutionChange = (index, value) => {
        const newResolutions = [...resolutions];
        newResolutions[index] = value;
        setResolutions(newResolutions);
    };

    const handleConfirm = () => {
        const resolvedConflicts = conflicts.map((conflict, index) => ({
            ...conflict,
            resolution: resolutions[index]
        }));
        onConfirm(resolvedConflicts);
    };

    if (!isOpen) return null;

    return (
        <Overlay onClose={onClose} closeOnBackdrop={false}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-stone-800">Resolve Import Conflicts</h2>
                            <p className="text-sm text-stone-500">
                                {conflicts.length} duplicates found. {validCount} new guests are ready to import.
                            </p>
                        </div>
                    </div>
                    <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-stone-50/20">
                    {conflicts.map((conflict, index) => (
                        <div key={index} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                            <div className="grid grid-cols-2 bg-stone-50 border-b border-stone-200">
                                <div className="p-3 text-xs font-bold text-stone-500 uppercase tracking-wider text-center border-r border-stone-200">Existing Record</div>
                                <div className="p-3 text-xs font-bold text-[#A67B5B] uppercase tracking-wider text-center">New Data (from Excel)</div>
                            </div>
                            
                            <div className="grid grid-cols-2 divide-x divide-stone-200">
                                {/* Existing */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-stone-400" />
                                        <span className="text-sm font-medium text-stone-700">{conflict.existing.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-stone-400" />
                                        <span className="text-xs text-stone-500">{conflict.existing.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-stone-400" />
                                        <span className="text-xs text-stone-500">{conflict.existing.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-stone-400" />
                                        <span className="text-xs text-stone-500">Plus ones allowed: {conflict.existing.plus_ones_allowed}</span>
                                    </div>
                                </div>

                                {/* New */}
                                <div className="p-4 space-y-3 bg-[#A67B5B]/5">
                                    <div className="flex items-center gap-2">
                                        <User className={`w-4 h-4 ${conflict.existing.name !== conflict.new.name ? 'text-orange-500 font-bold' : 'text-stone-400'}`} />
                                        <span className={`text-sm font-medium ${conflict.existing.name !== conflict.new.name ? 'text-orange-600' : 'text-stone-700'}`}>
                                            {conflict.new.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className={`w-4 h-4 ${conflict.existing.email !== conflict.new.email ? 'text-orange-500 font-bold' : 'text-stone-400'}`} />
                                        <span className={`text-xs ${conflict.existing.email !== conflict.new.email ? 'text-orange-600' : 'text-stone-500'}`}>
                                            {conflict.new.email || 'No email'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className={`w-4 h-4 ${conflict.existing.phone !== conflict.new.phone ? 'text-orange-500 font-bold' : 'text-stone-400'}`} />
                                        <span className={`text-xs ${conflict.existing.phone !== conflict.new.phone ? 'text-orange-600' : 'text-stone-500'}`}>
                                            {conflict.new.phone || 'No phone'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className={`w-4 h-4 ${conflict.existing.plus_ones_allowed != conflict.new.plus_ones_allowed ? 'text-orange-500 font-bold' : 'text-stone-400'}`} />
                                        <span className={`text-xs ${conflict.existing.plus_ones_allowed != conflict.new.plus_ones_allowed ? 'text-orange-600' : 'text-stone-500'}`}>
                                            Plus ones allowed: {conflict.new.plus_ones_allowed}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                                <span className="text-xs font-semibold text-stone-500 uppercase">Resolution:</span>
                                <SegmentedControl
                                    aria-label={`Resolution for ${conflict.existing.name}`}
                                    size="sm"
                                    options={RESOLUTION_OPTIONS}
                                    value={resolutions[index]}
                                    onChange={(value) => handleResolutionChange(index, value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-stone-100 bg-white flex items-center justify-between">
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <div className="flex items-center gap-4">
                         <div className="text-right hidden sm:block">
                            <p className="text-xs text-stone-500 font-medium">Ready to import</p>
                            <p className="text-sm font-bold text-[#A67B5B]">{validCount + resolutions.filter(r => r !== 'skip').length} guests</p>
                        </div>
                        <Button variant="secondary" size="lg" onClick={handleConfirm}>
                            Complete Import <ArrowRight />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </Overlay>
    );
}
