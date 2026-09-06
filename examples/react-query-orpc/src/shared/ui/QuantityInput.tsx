'use client'
export function QuantityInput({
  name,
  value,
  onChange,
}: {
  name: string
  value: number
  onChange: (value: number) => void
}) {
  function update(value: number) {
    onChange(Number.isFinite(value) ? Math.max(0, Math.min(20, Math.trunc(value))) : 0)
  }
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label={`Decrease ${name}`}
        disabled={value <= 0}
        onClick={() => update(value - 1)}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="20"
        step="1"
        aria-label={`${name} quantity`}
        value={value}
        onChange={(event) => update(Number(event.target.value))}
      />
      <button
        type="button"
        aria-label={`Increase ${name}`}
        disabled={value >= 20}
        onClick={() => update(value + 1)}
      >
        +
      </button>
    </div>
  )
}
