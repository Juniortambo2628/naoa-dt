import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Table as TableIcon, Plus, Trash2, Check } from 'lucide-react';

export default function TableInsertModal({ isOpen, onClose, onInsert }) {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(2);
    const [headers, setHeaders] = useState(['Header 1', 'Header 2']);
    const [data, setData] = useState([
        ['Row 1 Col 1', 'Row 1 Col 2'],
        ['Row 2 Col 1', 'Row 2 Col 2']
    ]);

    const handleRowsChange = (val) => {
        const newRows = Math.max(1, parseInt(val) || 1);
        setRows(newRows);
        
        // Adjust data
        const newData = [...data];
        if (newRows - 1 > data.length) {
            for (let i = data.length; i < newRows - 1; i++) {
                newData.push(new Array(cols).fill(''));
            }
        } else {
            newData.length = Math.max(0, newRows - 1);
        }
        setData(newData);
    };

    const handleColsChange = (val) => {
        const newCols = Math.max(1, parseInt(val) || 1);
        setCols(newCols);
        
        // Adjust headers
        const newHeaders = [...headers];
        if (newCols > headers.length) {
            for (let i = headers.length; i < newCols; i++) {
                newHeaders.push(`Header ${i + 1}`);
            }
        } else {
            newHeaders.length = newCols;
        }
        setHeaders(newHeaders);

        // Adjust data
        const newData = data.map(row => {
            const newRow = [...row];
            if (newCols > row.length) {
                for (let i = row.length; i < newCols; i++) {
                    newRow.push('');
                }
            } else {
                newRow.length = newCols;
            }
            return newRow;
        });
        setData(newData);
    };

    const handleHeaderChange = (idx, val) => {
        const h = [...headers];
        h[idx] = val;
        setHeaders(h);
    };

    const handleDataChange = (r, c, val) => {
        const d = [...data];
        d[r][c] = val;
        setData(d);
    };

    const generateTableHtml = () => {
        let html = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-stone-200 rounded-lg overflow-hidden">';
        
        // Header
        html += '<thead class="bg-stone-50 border-b border-stone-200"><tr>';
        headers.forEach(h => {
            html += `<th class="px-4 py-2 text-left text-sm font-semibold text-stone-700 border-r border-stone-200 last:border-0">${h}</th>`;
        });
        html += '</tr></thead>';

        // Body
        html += '<tbody class="divide-y divide-stone-200">';
        data.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td class="px-4 py-2 text-sm text-stone-600 border-r border-stone-200 last:border-0">${cell}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        
        return html;
    };

    const handleInsert = () => {
        onInsert(generateTableHtml());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TableIcon className="w-6 h-6 text-[#A67B5B]" />
                        <h2 className="text-xl font-semibold text-stone-800">Table Builder</h2>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Rows (inc header)</label>
                            <input 
                                type="number" 
                                value={rows} 
                                onChange={(e) => handleRowsChange(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Columns</label>
                            <input 
                                type="number" 
                                value={cols} 
                                onChange={(e) => handleColsChange(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#A67B5B]/10 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-medium text-stone-600">Table Preview & Data Entry</p>
                        <div className="border border-stone-200 rounded-xl overflow-hidden overflow-x-auto shadow-inner bg-stone-50/30">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200">
                                        {headers.map((h, i) => (
                                            <th key={i} className="p-2 border-r border-stone-200 last:border-0">
                                                <input 
                                                    type="text" 
                                                    value={h} 
                                                    onChange={(e) => handleHeaderChange(i, e.target.value)}
                                                    className="w-full bg-transparent font-bold text-stone-700 outline-none text-center"
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, ri) => (
                                        <tr key={ri} className="border-b border-stone-100 last:border-0 bg-white">
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="p-2 border-r border-stone-200 last:border-0">
                                                    <input 
                                                        type="text" 
                                                        value={cell} 
                                                        onChange={(e) => handleDataChange(ri, ci, e.target.value)}
                                                        className="w-full bg-transparent text-stone-600 outline-none"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleInsert}
                        className="px-6 py-2 bg-[#8B9A7D] text-white rounded-xl font-bold hover:bg-[#78886D] transition-all shadow-lg shadow-[#8B9A7D]/30 flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Insert Table
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
