export default function Table({ columns = [], data = [], loading, onRowClick }) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e2e8f0]">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {columns.map((col, i) => (
                  <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm text-[#94a3b8]">No data found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="min-w-full divide-y divide-[#e2e8f0]">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? 'cursor-pointer' : ''} transition-all duration-150 hover:bg-[#f8fafc] active:bg-[#f1f5f9]`}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-[#475569]">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
