// Logo registry for the AI spectrum.
// SVGs are imported as raw strings and inlined into the SVG via foreignObject-free
// inner-svg embedding. We map tool ID -> raw SVG string. Tools without a logo fall back
// to the categorical shape.

import deepseek from "../../assets/svgs/logos/deepseek.svg?raw";
import qwen from "../../assets/svgs/logos/qwen.svg?raw";
import kimi from "../../assets/svgs/logos/kimi.svg?raw";
import grok from "../../assets/svgs/logos/grok.svg?raw";
// mistral is a multi-color pixelated grid, not viable monochrome, use letter fallback
import openai from "../../assets/svgs/logos/openai.svg?raw";
import gemini from "../../assets/svgs/logos/gemini.svg?raw";
import claude from "../../assets/svgs/logos/claude.svg?raw";
import claudeCode from "../../assets/svgs/logos/claude-code.svg?raw";
import codex from "../../assets/svgs/logos/codex.svg?raw";
import cursor from "../../assets/svgs/logos/cursor.svg?raw";
import zed from "../../assets/svgs/logos/zed.svg?raw";
import githubCopilot from "../../assets/svgs/logos/github-copilot.svg?raw";
import windsurf from "../../assets/svgs/logos/windsurf.svg?raw";
import continueLogo from "../../assets/svgs/logos/continue.svg?raw";
import cline from "../../assets/svgs/logos/cline.svg?raw";
import opencode from "../../assets/svgs/logos/opencode.svg?raw";
import goose from "../../assets/svgs/logos/goose.svg?raw";
import groq from "../../assets/svgs/logos/groq.svg?raw";
import together from "../../assets/svgs/logos/together.svg?raw";
import vercel from "../../assets/svgs/logos/vercel.svg?raw";
import cloudflare from "../../assets/svgs/logos/cloudflare.svg?raw";
import openrouter from "../../assets/svgs/logos/openrouter.svg?raw";
import minimax from "../../assets/svgs/logos/minimax.svg?raw";
import trae from "../../assets/svgs/logos/trae.svg?raw";
import amp from "../../assets/svgs/logos/amp.svg?raw";
import antigravity from "../../assets/svgs/logos/antigravity.svg?raw";
import rooCode from "../../assets/svgs/logos/roo-code.svg?raw";
import kiloCode from "../../assets/svgs/logos/kilo-code.svg?raw";
import replit from "../../assets/svgs/logos/replit.svg?raw";
import deepinfra from "../../assets/svgs/logos/deepinfra.svg?raw";
import aider from "../../assets/svgs/logos/aider.svg?raw";
import crush from "../../assets/svgs/logos/crush.svg?raw";
import zai from "../../assets/svgs/logos/zai.svg?raw";
import lovable from "../../assets/svgs/logos/lovable.svg?raw";
import v0 from "../../assets/svgs/logos/v0.svg?raw";
import figma from "../../assets/svgs/logos/figma.svg?raw";
import openhands from "../../assets/svgs/logos/openhands.svg?raw";
import fireworks from "../../assets/svgs/logos/fireworks.svg?raw";
import cerebras from "../../assets/svgs/logos/cerebras.svg?raw";
import jetbrainsAi from "../../assets/svgs/logos/jetbrains-ai.svg?raw";
import warp from "../../assets/svgs/logos/warp.svg?raw";
import bolt from "../../assets/svgs/logos/bolt.svg?raw";

export const LOGOS: Record<string, string> = {
  // chats
  deepseek,
  qwen,
  kimi,
  grok,
  chatgpt: openai,
  gemini,
  claude,
  // editors
  cursor,
  zed,
  "copilot-student": githubCopilot,
  copilot: githubCopilot,
  windsurf,
  continue: continueLogo,
  cline,
  // terminals
  "gemini-cli": gemini,
  "codex-cli": codex,
  "claude-code": claudeCode,
  opencode,
  goose,
  // gateways / providers
  groq,
  together,
  "vercel-gateway": vercel,
  "cf-gateway": cloudflare,
  openrouter,
  minimax,
  trae,
  amp,
  antigravity,
  "roo-code": rooCode,
  "kilo-code": kiloCode,
  replit,
  "replit-design": replit,
  deepinfra,
  aider,
  crush,
  zai,
  lovable,
  v0,
  "figma-make": figma,
  openhands,
  fireworks,
  cerebras,
  "jetbrains-ai": jetbrainsAi,
  warp,
  bolt,
};

// Extract just the inner contents of an <svg>...</svg> string so we can re-embed
// it inside our master SVG via <g> + paths. Cheap parser, good enough for the
// curated logos we control.
export function svgInner(raw: string): { viewBox: string; inner: string } {
  const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch?.[1] ?? "0 0 24 24";
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();
  return { viewBox, inner };
}
