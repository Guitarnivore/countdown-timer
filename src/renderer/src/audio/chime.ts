// Synthesised with Web Audio so no audio assets ship with the app.

export interface ChimeNote {
  startSec: number
  durationSec: number
  frequencyHz: number
}

export const CHIME_MAX_REPEATS = 3
const CHIME_GAP_SEC = 1.5
const NOTE_DURATION_SEC = 0.9
const NOTE_SPACING_SEC = 0.18
// Two-note rising phrase (A5, D6) keeps the alert friendly rather than harsh.
const PHRASE_HZ = [880, 1174.66]
const MAX_BUS_GAIN = 0.25

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/** Returns the note schedule for `repeats` chimes, capped at CHIME_MAX_REPEATS. */
export function planChime(repeats: number): ChimeNote[] {
  const count = Math.min(CHIME_MAX_REPEATS, Math.max(0, Math.floor(repeats)))
  const blockSec = PHRASE_HZ.length * NOTE_SPACING_SEC + NOTE_DURATION_SEC + CHIME_GAP_SEC
  const notes: ChimeNote[] = []

  for (let repeat = 0; repeat < count; repeat += 1) {
    PHRASE_HZ.forEach((frequencyHz, index) => {
      notes.push({
        startSec: repeat * blockSec + index * NOTE_SPACING_SEC,
        durationSec: NOTE_DURATION_SEC,
        frequencyHz
      })
    })
  }
  return notes
}

/** Maps the 0..1 volume setting to a bus gain with headroom. */
export function chimeBusGain(volume: number): number {
  return clampUnit(volume) * MAX_BUS_GAIN
}

let context: AudioContext | null = null
let activeBus: GainNode | null = null

/**
 * Creates or resumes the AudioContext. Call from a user gesture (for example
 * the Go press or a keypress) so macOS and Chromium autoplay rules allow the
 * chime later, when the timer finishes without a gesture.
 */
export function primeAlertAudio(): void {
  if (typeof AudioContext === 'undefined') return
  if (!context) {
    context = new AudioContext()
  }
  if (context.state === 'suspended') {
    void context.resume()
  }
}

export function playFinishChime(volume: number): void {
  primeAlertAudio()
  if (!context) return

  stopFinishChime()
  const bus = context.createGain()
  bus.gain.value = chimeBusGain(volume)
  bus.connect(context.destination)
  activeBus = bus

  const startAt = context.currentTime + 0.05
  for (const note of planChime(CHIME_MAX_REPEATS)) {
    const osc = context.createOscillator()
    const env = context.createGain()
    const t0 = startAt + note.startSec
    const t1 = t0 + note.durationSec

    osc.type = 'sine'
    osc.frequency.value = note.frequencyHz
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(1, t0 + 0.02)
    env.gain.exponentialRampToValueAtTime(0.0001, t1)

    osc.connect(env)
    env.connect(bus)
    osc.start(t0)
    osc.stop(t1 + 0.05)
  }
}

/** Silences any chime still playing. Disconnecting the bus stops its oscillators' output. */
export function stopFinishChime(): void {
  if (activeBus) {
    activeBus.disconnect()
    activeBus = null
  }
}
