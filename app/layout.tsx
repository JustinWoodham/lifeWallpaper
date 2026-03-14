import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Life Wallpaper — Minimalist Dot Grid for iPhone',
  description: 'Generate a beautiful minimalist wallpaper showing your life or year progress as dots. Auto-updates daily via iOS Shortcuts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  )
}
