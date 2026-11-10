import type { TimerAPI } from '../shared/types'

declare global {
  interface Window {
    api: TimerAPI
  }
}
