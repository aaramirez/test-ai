// @ts-nocheck
/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiThemeCurrent } from "@opencode-ai/plugin/tui"
import { useTerminalDimensions } from "@opentui/solid"
import { createMemo } from "solid-js"

const FULL_ART = [
  "                      .__  ",
  "_____ ____________  |__|",
  "\\__  \\\\_  __ \\__  \\ |  |",
  " / __ \\|  | \\// __ \\|  |",
  "(____  /__|  (____  /__|",
  "     \\/           \\/    ",
  "",
  "                  test-ia                ",
  "       AI-enhanced multi-agent project   ",
  "",
  "       ─── Skills · Agents · Tests ───   ",
]

const COMPACT_ART = "✦ test-ia ── AI-Enhanced Multi-Agent Platform ──"

const Logo = (props: { theme: TuiThemeCurrent }) => {
  const dim = useTerminalDimensions()

  const lines = createMemo(() => {
    const { height, width } = dim()
    if (height >= FULL_ART.length + 6 && width >= 50) return FULL_ART
    return [COMPACT_ART]
  })

  return (
    <box flexDirection="column" alignItems="center" gap={0}>
      {lines().map((line, i) => (
        <text
          bold={i < 6}
          fg={
            i < 6
              ? "#ffffff"
              : i < 8
                ? "#fafafa"
                : i === 10
                  ? "#eeeeee"
                  : "#aaaaaa"
          }
        >
          {line}
        </text>
      ))}
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    id: "test-ia-logo",
    order: 50,
    slots: {
      home_logo(ctx) {
        return <Logo theme={ctx.theme.current} />
      },
    },
  })
}

const plugin = { id: "test-ia-logo", tui }
export default plugin
