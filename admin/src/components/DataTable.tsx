import { ReactNode, useState, useMemo } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  selectedValues?: Set<string | number>;
  onSelectChange?: (selected: Set<string | number>) => void;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, keyField, onEdit, onDelete, searchPlaceholder,
  selectedValues, onSelectChange,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let items = data;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        columns.some(col => String(item[col.key] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [data, search, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSelect = (id: string | number, checked: boolean) => {
    if (!selectedValues || !onSelectChange) return;
    const next = new Set(selectedValues);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectChange(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectChange) return;
    if (checked) {
      onSelectChange(new Set(filtered.map(item => item[keyField])));
    } else {
      onSelectChange(new Set());
    }
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(item => selectedValues?.has(item[keyField]));

  return (
    <div style={{
      background: 'var(--color-paper)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {searchPlaceholder !== undefined && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <input
            placeholder={searchPlaceholder || 'Search...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              outline: 'none',
              background: 'var(--color-paper-2)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-paper-2)' }}>
              {onSelectChange && (
                <th style={{ padding: 'var(--space-2) var(--space-3)', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-2)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th style={{
                  padding: 'var(--space-2) var(--space-3)',
                  width: 100,
                }} />
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr
                key={item[keyField]}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background var(--transition-fast)',
                  background: selectedValues?.has(item[keyField]) ? 'var(--color-accent-muted)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = selectedValues?.has(item[keyField]) ? 'var(--color-accent-muted)' : 'var(--color-paper-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedValues?.has(item[keyField]) ? 'var(--color-accent-muted)' : 'transparent')}
              >
                {onSelectChange && (
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <input
                      type="checkbox"
                      checked={selectedValues?.has(item[keyField]) || false}
                      onChange={e => handleSelect(item[keyField], e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} style={{
                    padding: 'var(--space-2) var(--space-3)',
                    color: 'var(--color-text)',
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {col.render ? col.render(item) : item[col.key] ?? '—'}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td style={{ padding: 'var(--space-2) var(--space-3)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      {onEdit && (
                        <button onClick={() => onEdit(item)} style={btnStyle}>Edit</button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item)} style={{ ...btnStyle, color: 'var(--color-danger)' }}>Delete</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0) + (onSelectChange ? 1 : 0)} style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--color-text-3)',
                }}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  color: 'var(--color-text-2)',
  transition: 'border-color var(--transition-fast), color var(--transition-fast)',
};
