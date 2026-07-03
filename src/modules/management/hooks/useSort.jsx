import { useState, useMemo } from 'react';

export default function useSort(data, defaultKey = null) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState('asc');

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}

export function SortTh({ label, sortKey: sk, currentKey, dir, onToggle, className = '' }) {
  const active = currentKey === sk;
  return (
    <th
      className={`${className} cursor-pointer select-none`}
      onClick={() => onToggle(sk)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span className="text-[10px] leading-none text-slate-400">
          {active ? (dir === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
        </span>
      </span>
    </th>
  );
}
