'use client';

import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, ChevronDown } from 'lucide-react';

interface FilterBarProps {
    onFilterChange: (startDate: string, endDate: string, label: string) => void;
    isLoading: boolean;
}

export function FilterBar({ onFilterChange, isLoading }: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('Hoje');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const handlePreset = (label: string, start: Date, end: Date) => {
        const s = format(start, 'yyyy-MM-dd');
        const e = format(end, 'yyyy-MM-dd');
        setSelectedLabel(label);
        onFilterChange(s, e, label);
        setIsOpen(false);
    };

    const handleCustom = () => {
        if (customStart && customEnd) {
            setSelectedLabel('Personalizado');
            onFilterChange(customStart, customEnd, 'Personalizado');
            setIsOpen(false);
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 flex items-center gap-4 relative z-20">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded text-sm text-slate-300">
                <Filter className="w-4 h-4" />
                <span>Filtro:</span>
                <span className="font-medium text-white">{selectedLabel}</span>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                >
                    <CalendarIcon className="w-4 h-4" />
                    Selecionar Período
                    <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 flex flex-col gap-2">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1">Períodos Rápidos</h3>
                        <button onClick={() => handlePreset('Hoje', today, today)} className="text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-200">Hoje</button>
                        <button onClick={() => handlePreset('Ontem', subDays(today, 1), subDays(today, 1))} className="text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-200">Ontem</button>
                        <button onClick={() => handlePreset('Últimos 7 dias', subDays(today, 6), today)} className="text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-200">Últimos 7 dias</button>
                        <button onClick={() => handlePreset('Este Mês', startOfMonth(today), today)} className="text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-200">Este Mês</button>
                        <button onClick={() => handlePreset('Mês Passado', startOfMonth(subMonths(today, 1)), endOfMonth(subMonths(today, 1)))} className="text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-slate-200">Mês Passado</button>

                        <div className="border-t border-slate-700 my-2 pt-2">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Personalizado</h3>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white [color-scheme:dark]"
                                />
                                <span className="text-slate-400 self-center">-</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white [color-scheme:dark]"
                                />
                            </div>
                            <button
                                onClick={handleCustom}
                                disabled={!customStart || !customEnd}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded text-xs font-medium disabled:opacity-50"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay to close */}
            {isOpen && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
            )}
        </div>
    );
}
