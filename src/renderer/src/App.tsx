import { type JSX } from 'react'

export default function App(): JSX.Element {
  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        color: 'var(--ink)'
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: 600 }}>Countdown timer test</p>
    </main>
  )
}
