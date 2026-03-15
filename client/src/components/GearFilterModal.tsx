import { useState, useEffect } from 'react';
import type { GearSpec } from '../types';
import { X, Plus, Save, Loader2, Cpu, Trash2 } from 'lucide-react';

interface GearFilterModalProps {
    token: string;
    isOpen: boolean;
    onClose: () => void;
    selectedGearIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

const STORAGE_KEY = 'namir_selected_gear_ids';

export const GearFilterModal = ({ token, isOpen, onClose, selectedGearIds, onSelectionChange }: GearFilterModalProps) => {
    const [gearList, setGearList] = useState<GearSpec[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newGear, setNewGear] = useState({ name: '', requireSampleRate: 44100, maxBitDepth: 24, maxLengthMs: 2000, caution: '' });

    useEffect(() => {
        if (isOpen) fetchGearDict();
    }, [isOpen]);

    const fetchGearDict = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/gear-dictionary', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setGearList(data.items || []);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleToggle = (id: string) => {
        const next = selectedGearIds.includes(id)
            ? selectedGearIds.filter(i => i !== id)
            : [...selectedGearIds, id];
        onSelectionChange(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };

    const handleAdd = async () => {
        if (!newGear.name.trim()) return;
        const updated = [...gearList, { ...newGear, id: String(gearList.length) }];
        setIsSaving(true);
        try {
            const res = await fetch('/api/gear-dictionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: updated })
            });
            if (res.ok) {
                await fetchGearDict();
                setNewGear({ name: '', requireSampleRate: 44100, maxBitDepth: 24, maxLengthMs: 2000, caution: '' });
                setShowAddForm(false);
            }
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (idx: number) => {
        if (!confirm('Remove this gear from the dictionary?')) return;
        const updated = gearList.filter((_, i) => i !== idx);
        setIsSaving(true);
        try {
            await fetch('/api/gear-dictionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: updated })
            });
            await fetchGearDict();
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
            <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                        <Cpu className="w-4 h-4 text-amber-400" /> Gear Settings / Filter
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowAddForm(v => !v)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all border border-amber-500/30">
                            <Plus className="w-3 h-3" /> Add Gear
                        </button>
                        <button onClick={onClose} className="text-neutral-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="p-4 border-b border-neutral-700 bg-neutral-800/60 space-y-3">
                        <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Add New Gear</p>
                        <input value={newGear.name} onChange={e => setNewGear(p => ({ ...p, name: e.target.value }))}
                            placeholder="Device name (e.g. Kemper Player)" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500/60" />
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Sample Rate (Hz)', key: 'requireSampleRate', val: newGear.requireSampleRate },
                                { label: 'Max Bit Depth', key: 'maxBitDepth', val: newGear.maxBitDepth },
                                { label: 'Max Length (ms)', key: 'maxLengthMs', val: newGear.maxLengthMs },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-[10px] text-neutral-500 mb-1 block">{f.label}</label>
                                    <input type="number" value={f.val}
                                        onChange={e => setNewGear(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500/60" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <label className="text-[10px] text-neutral-500 mb-1 block">Caution / NOTE</label>
                            <input value={newGear.caution} onChange={e => setNewGear(p => ({ ...p, caution: e.target.value }))}
                                placeholder="Any setup notes or length limits..." className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/60" />
                        </div>
                        <button onClick={handleAdd} disabled={isSaving || !newGear.name.trim()}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-all">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </button>
                    </div>
                )}

                {/* Gear List */}
                <div className="p-3 space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-neutral-600 w-6 h-6" /></div>
                    ) : gearList.filter(g => g.displayFlag !== false).length === 0 ? (
                        <p className="text-xs text-neutral-600 text-center py-8">No visible gear available. Use "Add Gear" to register devices or enable display flags.</p>
                    ) : gearList.filter(g => g.displayFlag !== false).map((gear) => {
                        const idx = gearList.indexOf(gear); // we need the original idx for delete
                        const id = gear.id ?? String(idx);
                        const checked = selectedGearIds.includes(id);
                        return (
                            <div key={id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group
                                ${checked ? 'bg-amber-500/10 border-amber-500/30' : 'bg-neutral-800/40 border-neutral-700/30 hover:border-neutral-600'}`}
                                onClick={() => handleToggle(id)}>
                                <input type="checkbox" checked={checked} readOnly
                                    className="accent-amber-500 w-4 h-4 shrink-0 pointer-events-none" />
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`text-sm font-bold truncate ${checked ? 'text-amber-300' : 'text-white'}`}>{gear.name}</p>
                                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                        {gear.requireSampleRate / 1000}kHz · {gear.maxBitDepth}bit · max {gear.maxLengthMs}ms
                                    </p>
                                    {gear.caution && (
                                        <p className={`text-[10px] ${checked ? 'text-amber-500/90' : 'text-neutral-500'} mt-1.5 line-clamp-1 leading-tight`} title={gear.caution}>
                                            <span className="font-bold mr-1 border border-current px-1 py-[1px] rounded-[3px] text-[8px] uppercase tracking-wider">Caution</span>
                                            {gear.caution}
                                        </p>
                                    )}
                                </div>
                                <button onClick={e => { e.stopPropagation(); handleDelete(idx); }}
                                    className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-neutral-700 flex justify-between items-center">
                    <span className="text-xs text-neutral-500">
                        {selectedGearIds.length > 0 ? `Filtering by ${selectedGearIds.length} device(s)` : 'No filter (showing all)'}
                    </span>
                    {selectedGearIds.length > 0 && (
                        <button onClick={() => { onSelectionChange([]); localStorage.removeItem(STORAGE_KEY); }}
                            className="text-xs text-neutral-400 hover:text-white transition-colors">Clear Filter</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const loadSavedGearIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
