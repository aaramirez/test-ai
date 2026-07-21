// @ts-nocheck
/** @jsxImportSource @opentui/solid */
import type { TuiPlugin } from "@opencode-ai/plugin/tui"
import { createSignal, onCleanup } from "solid-js"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

interface TutorialState {
  active: boolean
  tutorialName: string
  currentStep: number
  totalSteps: number
  xpEarned: number
  streakCurrent: number
  streakBest: number
  percentage: number
  elapsed: string
}

function loadState(): TutorialState | null {
  try {
    const statePath = join(process.cwd(), "tutorials", "current.json")
    if (!existsSync(statePath)) return null
    const raw = readFileSync(statePath, "utf-8")
    if (!raw || raw.trim() === "") return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function ProgressBar(props: { percentage: number; width: number }) {
  const filled = Math.round((props.percentage / 100) * props.width)
  const empty = props.width - filled
  return (
    <text>
      {"█".repeat(filled)}{"░".repeat(empty)} {props.percentage}%
    </text>
  )
}

const ProgressDisplay = () => {
  const [state, setState] = createSignal<TutorialState | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const poll = () => {
    try {
      const s = loadState()
      setState(s)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    }
  }

  poll()
  const interval = setInterval(poll, 2000)
  onCleanup(() => clearInterval(interval))

  return (
    <box
      flexDirection="column"
      borderStyle="round"
      borderColor="#666666"
      padding={1}
      gap={0}
    >
      {state() ? (
        <>
          <box flexDirection="row" justifyContent="space-between">
            <text bold fg="#ffffff">
              {state()!.tutorialName}
            </text>
            <text fg="#aaaaaa">
              Step {state()!.currentStep}/{state()!.totalSteps}
            </text>
          </box>
          <box flexDirection="row" gap={2}>
            <ProgressBar percentage={state()!.percentage} width={20} />
          </box>
          <box flexDirection="row" gap={4}>
            <text fg="#ffd700">
              XP: {state()!.xpEarned}
            </text>
            <text fg="#ff6600">
              🔥 Streak: {state()!.streakCurrent}
            </text>
            {state()!.elapsed && (
              <text fg="#888888">
                ⏱ {state()!.elapsed}
              </text>
            )}
          </box>
        </>
      ) : (
        <text fg="#666666">
          No active tutorial
        </text>
      )}
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    id: "tutorial-progress",
    order: 60,
    slots: {
      "tui.prompt.append"() {
        return <ProgressDisplay />
      },
    },
  })
}

const plugin = { id: "tutorial-progress", tui }
export default plugin
