import type { JSX } from 'react'

export interface KeypadProps {
  digits: string
  onDigit: (digit: string) => void
  onBackspace: () => void
}

function keyButton(label: string, onClick: () => void, className?: string): JSX.Element {
  return (
    <button
      type="button"
      className={`keypad-key no-drag ${className ?? ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {label}
    </button>
  )
}

export function Keypad({ digits, onDigit, onBackspace }: KeypadProps): JSX.Element {
  const digitsPreview = digits.split('').join(' ')

  return (
    <div className="keypad" role="grid" aria-label="Keypad">
      <div className="keypad-preview" aria-hidden="true">
        {digitsPreview}
      </div>
      <div className="keypad-grid">
        {keyButton('1', () => onDigit('1'))}
        {keyButton('2', () => onDigit('2'))}
        {keyButton('3', () => onDigit('3'))}
        {keyButton('4', () => onDigit('4'))}
        {keyButton('5', () => onDigit('5'))}
        {keyButton('6', () => onDigit('6'))}
        {keyButton('7', () => onDigit('7'))}
        {keyButton('8', () => onDigit('8'))}
        {keyButton('9', () => onDigit('9'))}
        {keyButton('00', () => onDigit('00'), 'double')}
        {keyButton('0', () => onDigit('0'))}
        {keyButton('\u232b', onBackspace, 'backspace')}
      </div>
    </div>
  )
}
