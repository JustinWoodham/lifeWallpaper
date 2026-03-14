import { NextRequest, NextResponse } from 'next/server'
import { createCanvas } from '@napi-rs/canvas'

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = 'midnight' | 'bone' | 'ocean' | 'sage' | 'ember' | 'lavender'
type View = 'year' | 'life'
type Device = '16promax' | '16pro' | '16' | '12promax' | 'se'
type Style = 'dots' | 'squares' | 'rings'

interface ThemeColors {
  bg: string
  filled: string
  empty: string
  text: string
}

// ─── Theme Palette ───────────────────────────────────────────────────────────

const THEMES: Record<Theme, ThemeColors> = {
  midnight: { bg: '#000000', filled: '#FFFFFF', empty: '#383838', text: '#555555' },
  bone:     { bg: '#f5f0eb', filled: '#1a1410', empty: '#c8bdb4', text: '#8a7e72' },
  ocean:    { bg: '#0b1628', filled: '#4a9eff', empty: '#1e3a5c', text: '#4a6a8a' },
  sage:     { bg: '#0f1a14', filled: '#6bcf8e', empty: '#1e4030', text: '#4a7a5a' },
  ember:    { bg: '#1a0f0b', filled: '#ff6f3c', empty: '#3d2218', text: '#8a5a3a' },
  lavender: { bg: '#12101a', filled: '#b088f9', empty: '#2e2650', text: '#6a5a8a' },
}

// ─── Device Resolutions ──────────────────────────────────────────────────────

const DEVICES: Record<Device, { w: number; h: number }> = {
  '16promax': { w: 1320, h: 2868 },
  '16pro':    { w: 1206, h: 2622 },
  '16':       { w: 1179, h: 2556 },
  '12promax': { w: 1284, h: 2778 },
  'se':       { w: 750,  h: 1334 },
}

// ─── Time Calculations ───────────────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getWeeksLived(birthday: Date, now: Date): number {
  const diff = now.getTime() - birthday.getTime()
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

// ─── Drawing Helpers ─────────────────────────────────────────────────────────

type CanvasCtx = ReturnType<ReturnType<typeof createCanvas>['getContext']>

function drawShape(
  ctx: CanvasCtx,
  style: Style,
  x: number,
  y: number,
  size: number,
  color: string,
  isFilled: boolean
) {
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.12

  if (style === 'squares') {
    const r = size * 0.25
    const half = size / 2
    ctx.beginPath()
    ctx.moveTo(x - half + r, y - half)
    ctx.lineTo(x + half - r, y - half)
    ctx.quadraticCurveTo(x + half, y - half, x + half, y - half + r)
    ctx.lineTo(x + half, y + half - r)
    ctx.quadraticCurveTo(x + half, y + half, x + half - r, y + half)
    ctx.lineTo(x - half + r, y + half)
    ctx.quadraticCurveTo(x - half, y + half, x - half, y + half - r)
    ctx.lineTo(x - half, y - half + r)
    ctx.quadraticCurveTo(x - half, y - half, x - half + r, y - half)
    ctx.closePath()
    ctx.fill()
  } else if (style === 'rings') {
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    if (isFilled) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
  } else {
    // dots (default)
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── Year View ───────────────────────────────────────────────────────────────

function drawYearView(
  ctx: CanvasCtx,
  width: number,
  height: number,
  dayOfYear: number,
  theme: ThemeColors,
  style: Style,
  year: number
) {
  const TOTAL = isLeapYear(year) ? 366 : 365
  const COLS = 15
  const ROWS = Math.ceil(TOTAL / COLS) // 25 rows

  const topPad = height * 0.22
  const botPad = height * 0.08
  const sidePad = width * 0.08

  const availW = width - sidePad * 2
  const availH = height - topPad - botPad

  const labelAreaH = height * 0.09
  const gridAvailH = availH - labelAreaH

  const cellW = availW / COLS
  const cellH = gridAvailH / ROWS
  const dotSize = Math.min(cellW, cellH) * 0.44

  const gridW = COLS * cellW
  const gridX = (width - gridW) / 2
  const gridY = topPad + labelAreaH

  // Labels
  const pct = ((dayOfYear / TOTAL) * 100).toFixed(1)
  const labelFontSize = Math.round(width * 0.036)
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `300 ${labelFontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(`Day ${dayOfYear} of ${TOTAL}`, width / 2, topPad + labelAreaH * 0.3)

  ctx.font = `200 ${Math.round(labelFontSize * 0.85)}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(`${pct}% of ${year}`, width / 2, topPad + labelAreaH * 0.72)

  // Dots
  for (let i = 0; i < TOTAL; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const cx = gridX + col * cellW + cellW / 2
    const cy = gridY + row * cellH + cellH / 2
    const filled = i < dayOfYear
    drawShape(ctx, style, cx, cy, dotSize, filled ? theme.filled : theme.empty, filled)
  }
}

// ─── Life View ───────────────────────────────────────────────────────────────

function drawLifeView(
  ctx: CanvasCtx,
  width: number,
  height: number,
  weeksLived: number,
  theme: ThemeColors,
  style: Style,
  birthdayYear: number
) {
  const TOTAL_YEARS = 90
  const WEEKS_PER_YEAR = 52
  const TOTAL = TOTAL_YEARS * WEEKS_PER_YEAR // 4680
  const COLS = WEEKS_PER_YEAR // 52 cols
  const ROWS = TOTAL_YEARS   // 90 rows

  const topPad = height * 0.22
  const botPad = height * 0.06
  const sidePad = width * 0.05

  const availW = width - sidePad * 2
  const availH = height - topPad - botPad

  const labelAreaH = height * 0.09
  const gridAvailH = availH - labelAreaH

  const cellW = availW / COLS
  const cellH = gridAvailH / ROWS
  const dotSize = Math.min(cellW, cellH) * 0.52

  const gridW = COLS * cellW
  const gridH = ROWS * cellH
  const gridX = (width - gridW) / 2
  const gridY = topPad + labelAreaH

  // Labels
  const yearsLived = Math.floor(weeksLived / 52)
  const labelFontSize = Math.round(width * 0.036)
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `300 ${labelFontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(`${yearsLived} years lived`, width / 2, topPad + labelAreaH * 0.3)

  ctx.font = `200 ${Math.round(labelFontSize * 0.85)}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(
    `${weeksLived.toLocaleString()} of ${TOTAL.toLocaleString()} weeks`,
    width / 2,
    topPad + labelAreaH * 0.72
  )

  // Dots
  for (let i = 0; i < TOTAL; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const cx = gridX + col * cellW + cellW / 2
    const cy = gridY + row * cellH + cellH / 2
    const filled = i < weeksLived
    drawShape(ctx, style, cx, cy, dotSize, filled ? theme.filled : theme.empty, filled)
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // Parse params
  const birthdayStr = searchParams.get('birthday')
  const view = (searchParams.get('view') ?? 'year') as View
  const themeName = (searchParams.get('theme') ?? 'midnight') as Theme
  const deviceName = (searchParams.get('device') ?? '16promax') as Device
  const style = (searchParams.get('style') ?? 'dots') as Style

  // Validate birthday
  if (!birthdayStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) {
    return NextResponse.json(
      { error: 'Missing or invalid birthday. Use format YYYY-MM-DD.' },
      { status: 400 }
    )
  }

  const birthday = new Date(birthdayStr + 'T00:00:00')
  if (isNaN(birthday.getTime())) {
    return NextResponse.json({ error: 'Invalid birthday date.' }, { status: 400 })
  }

  const theme = THEMES[themeName] ?? THEMES.midnight
  const device = DEVICES[deviceName] ?? DEVICES['16promax']
  const now = new Date()

  // Canvas
  const canvas = createCanvas(device.w, device.h)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, device.w, device.h)

  if (view === 'year') {
    const dayOfYear = getDayOfYear(now)
    drawYearView(ctx, device.w, device.h, dayOfYear, theme, style, now.getFullYear())
  } else {
    const weeksLived = Math.max(0, getWeeksLived(birthday, now))
    drawLifeView(ctx, device.w, device.h, weeksLived, theme, style, birthday.getFullYear())
  }

  const buffer = canvas.toBuffer('image/png')

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Disposition': 'inline; filename="wallpaper.png"',
    },
  })
}
