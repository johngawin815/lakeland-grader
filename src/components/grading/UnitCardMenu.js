import React from 'react';

const UNIT_CARDS = [
  { id: 'Determination', label: 'Determination' },
  { id: 'Discovery',     label: 'Discovery' },
  { id: 'Freedom',       label: 'Freedom' },
  { id: 'Harmony',       label: 'Harmony' },
  { id: 'Integrity',     label: 'Integrity' },
  { id: 'Serenity',      label: 'Serenity' },
];

export default function UnitCardMenu({ selectedUnit, onSelect }) {
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {UNIT_CARDS.map(card => (
        <button
          key={card.id}
          onClick={() => onSelect(card.id)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
            selectedUnit === card.id
              ? 'bg-white shadow-sm border border-slate-200/80 text-indigo-700 font-bold'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          {card.label}
        </button>
      ))}
    </div>
  );
}
