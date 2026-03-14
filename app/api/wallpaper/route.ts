import { NextRequest, NextResponse } from 'next/server'
import { createCanvas } from '@napi-rs/canvas'

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = 'midnight' | 'bone' | 'ocean' | 'sage' | 'ember' | 'lavender'
type View = 'year' | 'life'
type Device = '16promax' | '16pro' | '16' | '12promax' | 'se'
type Style = 'dots' | 'squares' | 'rings'

interface ThemeColors {
  bg: string; filled: string; empty: string; text: string
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

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Time Calculations ───────────────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getWeeksLived(birthday: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - birthday.getTime()) / (7 * 24 * 60 * 60 * 1000)))
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
  ctx.lineWidth = Math.max(1, size * 0.12)

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
    if (isFilled) ctx.fill()
    else ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Draw the two-stat footer line: ● X lived   ○ Y left
function drawStats(
  ctx: CanvasCtx,
  width: number,
  y: number,
  theme: ThemeColors,
  livedText: string,
  leftText: string,
  dotR: number,
) {
  const fontSize = Math.round(dotR * 2.2)
  ctx.font = `300 ${fontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.textBaseline = 'middle'

  const pad = dotR * 1.2   // space between dot edge and text
  const gap = width * 0.1  // gap between the two stat groups at center

  const livedW = ctx.measureText(livedText).width
  const leftW  = ctx.measureText(leftText).width

  // each group: [dot] [pad] [text]
  const livedGroupW = dotR * 2 + pad + livedW
  const leftGroupW  = dotR * 2 + pad + leftW

  const centerX = width / 2

  // lived group ends just left of center
  const livedGroupX = centerX - gap / 2 - livedGroupW
  // left group starts just right of center
  const leftGroupX = centerX + gap / 2

  // ● lived
  ctx.fillStyle = theme.filled
  ctx.beginPath()
  ctx.arc(livedGroupX + dotR, y, dotR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = theme.text
  ctx.textAlign = 'left'
  ctx.fillText(livedText, livedGroupX + dotR * 2 + pad, y)

  // ○ left
  ctx.strokeStyle = theme.empty
  ctx.lineWidth = Math.max(1, dotR * 0.25)
  ctx.beginPath()
  ctx.arc(leftGroupX + dotR, y, dotR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = theme.text
  ctx.fillText(leftText, leftGroupX + dotR * 2 + pad, y)
}

// ─── Year View (12 month blocks in 3×4 grid) ─────────────────────────────────

function drawYearView(
  ctx: CanvasCtx,
  width: number,
  height: number,
  dayOfYear: number,
  theme: ThemeColors,
  style: Style,
  year: number,
) {
  const BLOCK_COLS = 3
  const BLOCK_ROWS = 4
  const INNER_COLS = 7      // days per row within a month block
  const MAX_INNER_ROWS = 5  // max rows (ceil(31/7) = 5)

  const topPad      = height * 0.20
  const mainLabelH  = height * 0.08
  const statH       = height * 0.07
  const botPad      = height * 0.05
  const sidePad     = width  * 0.05

  const availW = width  - 2 * sidePad
  const availH = height - topPad - mainLabelH - statH - botPad

  const blockGapX = availW * 0.04
  const blockGapY = availH * 0.05

  const blockW = (availW - (BLOCK_COLS - 1) * blockGapX) / BLOCK_COLS
  const blockH = (availH - (BLOCK_ROWS - 1) * blockGapY) / BLOCK_ROWS

  const monthLabelH = blockH * 0.20
  const innerH      = blockH - monthLabelH
  const dotCellW    = blockW / INNER_COLS
  const dotCellH    = innerH / MAX_INNER_ROWS
  const dotSize     = Math.min(dotCellW, dotCellH) * 0.58

  const TOTAL = isLeapYear(year) ? 366 : 365
  const pct = ((dayOfYear / TOTAL) * 100).toFixed(1)
  const labelFontSize = Math.round(width * 0.036)

  // Main title labels
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `300 ${labelFontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(`Day ${dayOfYear} of ${TOTAL}`, width / 2, topPad + mainLabelH * 0.3)
  ctx.font = `200 ${Math.round(labelFontSize * 0.85)}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(`${pct}% of ${year}`, width / 2, topPad + mainLabelH * 0.72)

  // Month blocks
  const monthLabelFont = Math.round(Math.max(dotSize * 1.1, width * 0.018))
  let daysCounted = 0

  for (let m = 0; m < 12; m++) {
    const blockCol = m % BLOCK_COLS
    const blockRow = Math.floor(m / BLOCK_COLS)
    const blockX = sidePad + blockCol * (blockW + blockGapX)
    const blockY = topPad + mainLabelH + blockRow * (blockH + blockGapY)

    // Month label
    ctx.font = `300 ${monthLabelFont}px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.fillStyle = theme.text
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(MONTH_NAMES[m], blockX, blockY + monthLabelH * 0.5)

    const daysInM = getDaysInMonth(m, year)

    for (let d = 0; d < daysInM; d++) {
      const innerCol = d % INNER_COLS
      const innerRow = Math.floor(d / INNER_COLS)
      const cx = blockX + innerCol * dotCellW + dotCellW / 2
      const cy = blockY + monthLabelH + innerRow * dotCellH + dotCellH / 2
      const filled = daysCounted + d < dayOfYear
      drawShape(ctx, style, cx, cy, dotSize, filled ? theme.filled : theme.empty, filled)
    }

    daysCounted += daysInM
  }

  // Stats footer
  const statDotR = Math.round(width * 0.010)
  const statsY   = height - botPad * 0.5 - statH * 0.2
  drawStats(ctx, width, statsY, theme,
    `${dayOfYear} days lived`,
    `${TOTAL - dayOfYear} days left`,
    statDotR,
  )
}

// ─── Life View (decade blocks) ────────────────────────────────────────────────

function drawLifeView(
  ctx: CanvasCtx,
  width: number,
  height: number,
  weeksLived: number,
  theme: ThemeColors,
  style: Style,
  lifespan: number,
) {
  const WEEKS_PER_YEAR  = 52
  const ROWS_PER_DECADE = 10
  const COLS            = WEEKS_PER_YEAR
  const MAX_WEEKS       = lifespan * WEEKS_PER_YEAR
  const numDecades      = Math.ceil(lifespan / 10)

  const topPad     = height * 0.20
  const mainLabelH = height * 0.08
  const statH      = height * 0.07
  const botPad     = height * 0.05

  // Center the dot grid with equal margins; decade labels float in the left margin
  const sidePad       = width * 0.07
  const gridStartX    = sidePad
  const gridW         = width - 2 * sidePad

  const availH = height - topPad - mainLabelH - statH - botPad

  // Gap between decade blocks = GAP_FACTOR × cellH
  // availH = numDecades × ROWS_PER_DECADE × cellH + (numDecades-1) × GAP_FACTOR × cellH
  const GAP_FACTOR = 1.4
  const cellH  = availH / (numDecades * ROWS_PER_DECADE + (numDecades - 1) * GAP_FACTOR)
  const gapH   = GAP_FACTOR * cellH
  const cellW  = gridW / COLS
  const dotSize = Math.min(cellW, cellH) * 0.52

  // Main title labels
  const yearsLived = Math.floor(weeksLived / WEEKS_PER_YEAR)
  const labelFontSize = Math.round(width * 0.036)
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `300 ${labelFontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(`${yearsLived} years lived`, width / 2, topPad + mainLabelH * 0.3)
  ctx.font = `200 ${Math.round(labelFontSize * 0.85)}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillText(
    `${weeksLived.toLocaleString()} of ${MAX_WEEKS.toLocaleString()} weeks`,
    width / 2, topPad + mainLabelH * 0.72
  )

  // Dots grouped into decade blocks
  for (let w = 0; w < MAX_WEEKS; w++) {
    const decadeIdx    = Math.floor(w / (COLS * ROWS_PER_DECADE))
    const weekInDecade = w % (COLS * ROWS_PER_DECADE)
    const col          = weekInDecade % COLS
    const rowInDecade  = Math.floor(weekInDecade / COLS)

    const cx = gridStartX + col * cellW + cellW / 2
    const cy = topPad + mainLabelH
              + decadeIdx * (ROWS_PER_DECADE * cellH + gapH)
              + rowInDecade * cellH + cellH / 2

    const filled = w < weeksLived
    drawShape(ctx, style, cx, cy, dotSize, filled ? theme.filled : theme.empty, filled)
  }

  // Decade labels on the left gutter
  const decadeLabelFontSize = Math.round(Math.max(cellH * 0.9, width * 0.016))
  ctx.font = `200 ${decadeLabelFontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let d = 0; d < numDecades; d++) {
    const blockMidY = topPad + mainLabelH
                    + d * (ROWS_PER_DECADE * cellH + gapH)
                    + ROWS_PER_DECADE * cellH / 2
    ctx.fillText(`${d * 10}`, sidePad * 0.38, blockMidY)
  }

  // Stats footer
  const statDotR = Math.round(width * 0.010)
  const statsY   = height - botPad * 0.5 - statH * 0.2
  const weeksLeft = Math.max(0, MAX_WEEKS - weeksLived)
  drawStats(ctx, width, statsY, theme,
    `${weeksLived.toLocaleString()} weeks lived`,
    `${weeksLeft.toLocaleString()} weeks left`,
    statDotR,
  )
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const birthdayStr = searchParams.get('birthday')
  const view        = (searchParams.get('view')   ?? 'year')     as View
  const themeName   = (searchParams.get('theme')  ?? 'midnight') as Theme
  const deviceName  = (searchParams.get('device') ?? '16promax') as Device
  const style       = (searchParams.get('style')  ?? 'dots')     as Style
  const lifespan    = Math.min(120, Math.max(50, parseInt(searchParams.get('lifespan') ?? '90', 10)))

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

  const theme  = THEMES[themeName]  ?? THEMES.midnight
  const device = DEVICES[deviceName] ?? DEVICES['16promax']
  const now    = new Date()

  const canvas = createCanvas(device.w, device.h)
  const ctx    = canvas.getContext('2d')

  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, device.w, device.h)

  if (view === 'year') {
    drawYearView(ctx, device.w, device.h, getDayOfYear(now), theme, style, now.getFullYear())
  } else {
    drawLifeView(ctx, device.w, device.h, getWeeksLived(birthday, now), theme, style, lifespan)
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
