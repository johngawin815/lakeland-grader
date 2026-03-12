import React from 'react';

const UNIT_CARDS = [
  { id: 'Determination', label: 'Determination', colorClass: 'text-amber-700', bgClass: 'bg-amber-50', icon: null },
  { id: 'Discovery', label: 'Discovery', colorClass: 'text-blue-700', bgClass: 'bg-blue-50', icon: null },
  { id: 'Freedom', label: 'Freedom', colorClass: 'text-green-700', bgClass: 'bg-green-50', icon: null },
  { id: 'Harmony', label: 'Harmony', colorClass: 'text-purple-700', bgClass: 'bg-purple-50', icon: null },
  { id: 'Integrity', label: 'Integrity', colorClass: 'text-pink-700', bgClass: 'bg-pink-50', icon: null },
  { id: 'Serenity', label: 'Serenity', colorClass: 'text-cyan-700', bgClass: 'bg-cyan-50', icon: null },
];

export default function UnitCardMenu({ selectedUnit, onSelect }) {
  return (
    <div className="flex gap-4 justify-center py-6 mb-4">
      {UNIT_CARDS.map(card => (
        <button
          key={card.id}
          onClick={() => onSelect(card.id)}
          className={`px-6 py-4 rounded-xl shadow-sm border-2 transition-all duration-200 flex flex-col items-center gap-2 font-bold text-lg cursor-pointer ${card.bgClass} ${card.colorClass} ${selectedUnit === card.id ? 'border-indigo-600 shadow-lg !bg-white !text-indigo-700 -translate-y-1' : 'border-transparent opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg'}`}
        >
          {card.icon && <card.icon className="w-6 h-6 mb-1" />}
          <span>{card.label}</span>
        </button>
      ))}
    </div>
  );
}
