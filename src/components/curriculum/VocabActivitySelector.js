import React, { useState } from 'react';

const VOCAB_ACTIVITY_CHOICES = [
  {
    value: 'sort',
    label: 'Sort (6–9 words, 2 categories)',
    desc: 'Sort a small set of vocabulary words into two simple categories.'
  },
  {
    value: 'matching',
    label: 'Matching',
    desc: 'Match each vocabulary word to its definition or a picture.'
  },
  {
    value: 'grouping',
    label: 'Grouping',
    desc: 'Group words by similar meaning or theme.'
  },
  {
    value: 'fillblank',
    label: 'Fill-in-the-Blank',
    desc: 'Use vocabulary words to complete sentences.'
  },
  {
    value: 'picture',
    label: 'Word-Picture Association',
    desc: 'Draw or select a picture that represents each word.'
  },
  {
    value: 'truefalse',
    label: 'True/False Sorting',
    desc: 'Sort words into "True" (fits topic) or "False" (does not fit).' 
  },
  {
    value: 'focus',
    label: 'Word of the Day Focus',
    desc: 'Choose one word, discuss its meaning, and use it in a sentence or drawing.'
  }
];

export default function VocabActivitySelector({ onChange }) {
  const [selected, setSelected] = useState(VOCAB_ACTIVITY_CHOICES[0].value);

  function handleChange(e) {
    setSelected(e.target.value);
    if (onChange) onChange(e.target.value);
  }

  const choice = VOCAB_ACTIVITY_CHOICES.find(c => c.value === selected);

  return (
    <div className="my-2">
      <label className="block font-semibold text-sm mb-1">Vocabulary Activity:</label>
      <select value={selected} onChange={handleChange} className="border rounded px-2 py-1 text-sm">
        {VOCAB_ACTIVITY_CHOICES.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="mt-2 text-xs text-gray-600">{choice?.desc}</div>
    </div>
  );
}
