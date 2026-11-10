import type { JSX } from 'react'

export interface KeypadProps {
  onDigit: (digit: string) => void
  onBackspace: () => void
}

function KeypadKey({
  label,
  onPress,
  ariaLabel,
  className = ''
}: {
  label: string
  onPress: () => void
  ariaLabel?: string
  className?: string
}): JSX.Element {
  return (
    <button
      type="button"
      className={`keypad-key no-drag ${className}`.trim()}
      onClick={onPress}
      aria-label={ariaLabel ?? label}
    >
      {label}
    </button>
  )
}

export function Keypad({ onDigit, onBackspace }: KeypadProps): JSX.Element {
  const single = (digit: string): (() => void) => (): void => onDigit(digit)

  const keys: Array<{ label: string; onPress: () => void; className?: string; ariaLabel?: string }> = [
    { label: '1', onPress: single('1') },
    { label: '2', onPress: single('2') },
    { label: '3', onPress: single('3') },
    { label: '4', onPress: single('4') },
    { label: '5', onPress: single('5') },
    { label: '6', onPress: single('6') },
    { label: '7', onPress: single('7') },
    { label: '8', onPress: single('8') },
    { label: '9', onPress: single('9') },
    { label: '00', onPress: single('00') },
    { label: '0', onPress: single('0') },
    {
      label: '⌫',
      onPress: onBackspace,
      className: 'keypad-key--backspace',
      ariaLabel: 'Backspace'
    }
  ]

  const rows: Array<Array<(typeof keys)[number]>> = [
    keys.slice(0, 3),
    keys.slice(3, 6),
    keys.slice(6, 9),
    keys.slice(9, 12)
  ]

  return (
    <div className="keypad-grid" role="group" aria-label="Duration keypad">
      {rows.map((row, rowIndex) => (
        <div className="keypad-row" key={rowIndex}>
          {row.map((key) => (
            <KeypadKey key={key.label} label={key.label} onPress={key.onPress} className={key.className} ariaLabel={key.ariaLabel} />
          ))}
        </div>
      ))}
    </div>
  )
}
