type FieldDef<T> = {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number';
  flex?: number;
};

interface Props<T> {
  items: T[];
  fields: FieldDef<T>[];
  defaultItem: T;
  onChange: (items: T[]) => void;
  onSave: (items: T[]) => void;
  addLabel?: string;
}

export function StructuredListEditor<T>({
  items,
  fields,
  defaultItem,
  onChange,
  onSave,
  addLabel = '+ Add row',
}: Props<T>) {
  const asRecord = (row: T) => row as Record<string, unknown>;

  const update = (i: number, key: string, value: string | number) => {
    const next = items.map((row, idx) => idx === i ? { ...asRecord(row), [key]: value } as T : row);
    onChange(next);
  };

  const remove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
    onSave(next);
  };

  const add = () => {
    onChange([...items, { ...asRecord(defaultItem) } as T]);
  };

  return (
    <div className="space-y-2">
      {items.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          {fields.map((f) => (
            <input
              key={f.key}
              type={f.type ?? 'text'}
              value={String(asRecord(row)[f.key] ?? '')}
              placeholder={f.placeholder ?? f.key}
              onChange={(e) => update(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
              onBlur={() => onSave(items)}
              style={{ flex: f.flex ?? 1 }}
              className="min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          ))}
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-2 shrink-0 text-xs text-text/40 transition hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs text-accent/70 transition hover:text-accent"
      >
        {addLabel}
      </button>
    </div>
  );
}
