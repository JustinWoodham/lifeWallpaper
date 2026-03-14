'use client'

import { useState, useEffect, useRef } from 'react'

const THEMES = ['midnight', 'bone', 'ocean', 'sage', 'ember', 'lavender']
const DEVICES = ['16promax', '16pro', '16', 'se']
const STYLES = ['dots', 'squares', 'rings']
const VIEWS = ['year', 'life']

const DEVICE_LABELS: Record<string, string> = {
  '16promax': 'iPhone 16 Pro Max',
  '16pro': 'iPhone 16 Pro',
  '16': 'iPhone 16',
  'se': 'iPhone SE',
}

const THEME_COLORS: Record<string, { bg: string; filled: string; text: string }> = {
  midnight: { bg: '#000000', filled: '#FFFFFF', text: '#555555' },
  bone:     { bg: '#f5f0eb', filled: '#1a1410', text: '#8a7e72' },
  ocean:    { bg: '#0b1628', filled: '#4a9eff', text: '#4a6a8a' },
  sage:     { bg: '#0f1a14', filled: '#6bcf8e', text: '#4a7a5a' },
  ember:    { bg: '#1a0f0b', filled: '#ff6f3c', text: '#8a5a3a' },
  lavender: { bg: '#12101a', filled: '#b088f9', text: '#6a5a8a' },
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Home() {
  const [birthday, setBirthday] = useState('1990-01-01')
  const [view, setView] = useState('year')
  const [theme, setTheme] = useState('midnight')
  const [device, setDevice] = useState('16promax')
  const [style, setStyle] = useState('dots')
  const [copied, setCopied] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const wallpaperUrl = origin
    ? `${origin}/api/wallpaper?birthday=${birthday}&view=${view}&theme=${theme}&device=${device}&style=${style}`
    : ''

  function refreshPreview() {
    setPreviewKey(k => k + 1)
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(wallpaperUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = wallpaperUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const colors = THEME_COLORS[theme]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 24px 80px',
      boxSizing: 'border-box',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 200,
          letterSpacing: '0.08em',
          margin: 0,
          color: '#fff',
        }}>
          life wallpaper
        </h1>
        <p style={{
          marginTop: 10,
          fontSize: 14,
          color: '#555',
          fontWeight: 300,
          letterSpacing: '0.05em',
        }}>
          minimalist dot grids for your iPhone lock screen
        </p>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'flex',
        gap: 48,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 900,
        width: '100%',
      }}>

        {/* Phone Mockup */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <PhoneMockup
            wallpaperUrl={wallpaperUrl}
            previewKey={previewKey}
            bgColor={colors.bg}
          />
          <button
            onClick={refreshPreview}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#888',
              padding: '8px 20px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: '0.06em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = '#666'
              ;(e.target as HTMLButtonElement).style.color = '#bbb'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = '#333'
              ;(e.target as HTMLButtonElement).style.color = '#888'
            }}
          >
            refresh preview
          </button>
        </div>

        {/* Controls */}
        <div style={{
          flex: 1,
          minWidth: 280,
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}>

          {/* Birthday */}
          <div>
            <Label>birthday</Label>
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #222',
                borderRadius: 8,
                color: '#e0e0e0',
                padding: '10px 14px',
                fontSize: 15,
                boxSizing: 'border-box',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* View */}
          <div>
            <Label>view</Label>
            <ToggleGroup
              options={VIEWS}
              value={view}
              onChange={setView}
              labels={{ year: 'Year Progress', life: 'Life Progress' }}
            />
          </div>

          {/* Theme */}
          <div>
            <Label>theme</Label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={cap(t)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: THEME_COLORS[t].bg,
                    border: theme === t
                      ? `3px solid ${THEME_COLORS[t].filled}`
                      : '3px solid transparent',
                    cursor: 'pointer',
                    boxShadow: theme === t ? `0 0 0 1px #fff2` : 'none',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <span style={{
                    display: 'block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: THEME_COLORS[t].filled,
                    margin: 'auto',
                  }} />
                </button>
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>{cap(theme)}</div>
          </div>

          {/* Style */}
          <div>
            <Label>dot style</Label>
            <ToggleGroup
              options={STYLES}
              value={style}
              onChange={setStyle}
              labels={{ dots: 'Dots', squares: 'Squares', rings: 'Rings' }}
            />
          </div>

          {/* Device */}
          <div>
            <Label>device</Label>
            <select
              value={device}
              onChange={e => setDevice(e.target.value)}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #222',
                borderRadius: 8,
                color: '#e0e0e0',
                padding: '10px 14px',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
                colorScheme: 'dark',
              }}
            >
              {DEVICES.map(d => (
                <option key={d} value={d}>{DEVICE_LABELS[d]}</option>
              ))}
            </select>
          </div>

          {/* URL + Copy */}
          <div>
            <Label>wallpaper url</Label>
            <div style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 11,
              color: '#444',
              wordBreak: 'break-all',
              lineHeight: 1.6,
              marginBottom: 10,
              fontFamily: 'monospace',
            }}>
              {wallpaperUrl || '…'}
            </div>
            <button
              onClick={copyUrl}
              style={{
                width: '100%',
                background: copied ? '#1a3a1a' : '#1a1a2e',
                border: copied ? '1px solid #2d6a2d' : '1px solid #2d2d5e',
                borderRadius: 8,
                color: copied ? '#6bcf8e' : '#b088f9',
                padding: '11px',
                fontSize: 13,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {copied ? '✓ copied!' : 'copy url'}
            </button>
          </div>

        </div>
      </div>

      {/* iOS Shortcut Instructions */}
      <div style={{
        marginTop: 64,
        maxWidth: 600,
        width: '100%',
        background: '#0d0d12',
        border: '1px solid #1a1a28',
        borderRadius: 16,
        padding: '32px 36px',
      }}>
        <h2 style={{
          fontSize: 16,
          fontWeight: 300,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#888',
          margin: '0 0 24px',
        }}>
          Auto-Update via iOS Shortcuts
        </h2>
        <ol style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {[
            <>Open the <Kbd>Shortcuts</Kbd> app on your iPhone</>,
            <>Go to the <Kbd>Automation</Kbd> tab</>,
            <>Tap <Kbd>+</Kbd> → <Kbd>Create Personal Automation</Kbd></>,
            <>Select <Kbd>Time of Day</Kbd> → set to <Kbd>6:00 AM</Kbd> → Repeat: <Kbd>Daily</Kbd> → select <Kbd>Run Immediately</Kbd></>,
            <>Add action: <Kbd>Get Contents of URL</Kbd> → paste your wallpaper URL above</>,
            <>Add action: <Kbd>Set Wallpaper</Kbd> → choose <Kbd>Lock Screen</Kbd> → turn <Kbd>OFF</Kbd> &ldquo;Show Preview&rdquo;</>,
            <>Tap <Kbd>Done</Kbd> — your wallpaper updates every morning automatically</>,
          ].map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{
                minWidth: 24,
                height: 24,
                borderRadius: '50%',
                background: '#1a1a28',
                border: '1px solid #2a2a44',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: '#666',
                fontWeight: 400,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: '#bbb', lineHeight: 1.6 }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 48,
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        letterSpacing: '0.05em',
      }}>
        free · self-hosted · open source
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#555',
      marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: '#1a1a28',
      border: '1px solid #2a2a44',
      borderRadius: 4,
      padding: '1px 6px',
      fontSize: 12,
      color: '#b088f9',
      fontFamily: 'inherit',
    }}>
      {children}
    </span>
  )
}

function ToggleGroup({
  options,
  value,
  onChange,
  labels,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  labels: Record<string, string>
}) {
  return (
    <div style={{
      display: 'flex',
      background: '#0d0d0d',
      border: '1px solid #1e1e1e',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            padding: '9px 8px',
            background: value === opt ? '#1e1e2e' : 'transparent',
            border: 'none',
            color: value === opt ? '#e0e0e0' : '#444',
            cursor: 'pointer',
            fontSize: 12,
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {labels[opt] ?? opt}
        </button>
      ))}
    </div>
  )
}

function PhoneMockup({
  wallpaperUrl,
  previewKey,
  bgColor,
}: {
  wallpaperUrl: string
  previewKey: number
  bgColor: string
}) {
  const PHONE_W = 180
  const PHONE_H = 380
  const SCREEN_W = 162
  const SCREEN_H = 350
  const BORDER_R = 36
  const SCREEN_R = 28

  return (
    <div style={{
      width: PHONE_W,
      height: PHONE_H,
      background: 'linear-gradient(145deg, #2a2a2a, #111)',
      borderRadius: BORDER_R,
      boxShadow: '0 0 0 1px #333, 0 24px 60px rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Side buttons */}
      <div style={{
        position: 'absolute',
        right: -3,
        top: 80,
        width: 3,
        height: 60,
        background: '#222',
        borderRadius: '0 3px 3px 0',
      }} />
      <div style={{
        position: 'absolute',
        left: -3,
        top: 70,
        width: 3,
        height: 28,
        background: '#222',
        borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        position: 'absolute',
        left: -3,
        top: 108,
        width: 3,
        height: 28,
        background: '#222',
        borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        position: 'absolute',
        left: -3,
        top: 146,
        width: 3,
        height: 28,
        background: '#222',
        borderRadius: '3px 0 0 3px',
      }} />

      {/* Screen */}
      <div style={{
        width: SCREEN_W,
        height: SCREEN_H,
        background: bgColor,
        borderRadius: SCREEN_R,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {wallpaperUrl ? (
          <img
            key={previewKey}
            src={`${wallpaperUrl}&t=${previewKey}`}
            alt="Wallpaper preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            fontSize: 11,
          }}>
            loading…
          </div>
        )}

        {/* Dynamic island */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 14,
          background: '#000',
          borderRadius: 10,
        }} />

        {/* Clock overlay */}
        <div style={{
          position: 'absolute',
          top: 36,
          width: '100%',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 28,
          fontWeight: 200,
          letterSpacing: '0.03em',
          textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
