import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '../Form/Checkbox.jsx';
import styles from './Table.module.css';

export function Table({
  columns = [], // Array of { key, header, sortable?, render?, width? }
  data = [],
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  keyField = 'id',
  onSort,
  defaultSortField = null,
  defaultSortDir = 'asc',
  emptyText = 'No records found',
  className = '',
}) {
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDir, setSortDir] = useState(defaultSortDir);

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    let nextDir = 'asc';
    if (sortField === col.key) {
      nextDir = sortDir === 'asc' ? 'desc' : 'asc';
    }
    setSortField(col.key);
    setSortDir(nextDir);
    if (onSort) onSort(col.key, nextDir);
  };

  const handleSelectAll = (checked) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allKeys = data.map((item) => item[keyField]);
      onSelectionChange(allKeys);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (key, checked) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedKeys, key]);
    } else {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    }
  };

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;

  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {selectable && (
              <th className={styles.selectHeaderCell}>
                <Checkbox
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => {
              const isCurrentSort = sortField === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`${styles.th} ${col.sortable ? styles.sortableTh : ''}`}
                  onClick={() => handleHeaderClick(col)}
                  aria-sort={
                    isCurrentSort ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  <div className={styles.thContent}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className={styles.sortIcon}>
                        {isCurrentSort ? (
                          sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.emptyCell}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const rowKey = row[keyField] ?? rowIdx;
              const isSelected = selectedKeys.includes(rowKey);

              return (
                <tr
                  key={rowKey}
                  className={`${styles.tr} ${isSelected ? styles.selectedRow : ''}`}
                >
                  {selectable && (
                    <td className={styles.selectCell}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(rowKey, e.target.checked)}
                        aria-label={`Select row ${rowIdx + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td} data-label={col.header}>
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
