import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import styles from './Table.module.css'

/**
 * Reusable Table with built-in pagination.
 * 
 * @param {string[]} columns - Column headers
 * @param {Function} renderRow - (item, index) => <tr>...</tr>
 * @param {Array} data - Data array
 * @param {Object} pagination - { page, totalPages, total, limit, onPageChange }
 * @param {string} emptyMessage - Message when no data
 */
export default function Table({
  columns,
  data,
  renderRow,
  pagination,
  emptyMessage = 'No data found',
}) {
  const { page = 1, totalPages = 1, total = 0, onPageChange } = pagination || {}

  return (
    <div>
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => renderRow(item, index))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.empty}>
                    <Inbox size={40} className={styles.emptyIcon} />
                    <p className={styles.emptyText}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {Math.min((page - 1) * (pagination.limit || 10) + 1, total)}–
            {Math.min(page * (pagination.limit || 10), total)} of {total}
          </span>
          <div className={styles.paginationButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  className={`${styles.pageBtn} ${pageNum === page ? styles.active : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
