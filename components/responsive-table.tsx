export type ResponsiveTableColumn<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
};

// Tabela do admin (design-x-performance.md § Tabela do Admin): tradicional
// em telas ≥768px, cada linha vira um card empilhado (pares label/valor)
// abaixo disso — nunca tabela com scroll horizontal. A última coluna é
// tratada como a coluna de ações (mesma convenção já usada nas 6 tabelas:
// header vazio "") e some sem label, no rodapé do card, no mobile.
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: ResponsiveTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  const bodyColumns = columns.slice(0, -1);
  const actionsColumn = columns[columns.length - 1];

  return (
    <>
      <div className="hidden overflow-x-auto rounded-[20px] border border-graphite md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-mist">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-xs font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-charcoal">
                {columns.map((col, i) => (
                  <td key={i} className="px-4 py-3 text-paper">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className="rounded-[20px] bg-charcoal p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          >
            <dl className="space-y-2">
              {bodyColumns.map((col, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="shrink-0 text-xs text-mist">{col.header}</dt>
                  <dd className="text-right text-paper">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 border-t border-graphite pt-3">{actionsColumn.cell(row)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
