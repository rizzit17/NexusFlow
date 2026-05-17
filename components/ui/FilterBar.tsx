'use client';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  active: string;
  onChange: (value: string) => void;
}

export function FilterBar({ filters, active, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`btn ${active === f.value ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 12px', fontSize: 12 }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
