# Life Wallpaper

A free, self-hosted wallpaper generator that creates minimalist dot-grid PNGs showing your year or life progress. Deploy to Vercel and point an iOS Shortcut at the URL for daily auto-updates.

## Deploy to Vercel (5 minutes)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → sign up free with GitHub
3. Click **Add New → Project** → import your repo
4. Vercel auto-detects Next.js → click **Deploy**
5. Your wallpaper URL: `https://your-app.vercel.app/api/wallpaper?birthday=YYYY-MM-DD`

## API

```
GET /api/wallpaper
```

| Parameter  | Default      | Options                                                        |
|------------|--------------|----------------------------------------------------------------|
| `birthday` | required     | `YYYY-MM-DD`                                                   |
| `view`     | `year`       | `year`, `life`                                                 |
| `theme`    | `midnight`   | `midnight`, `bone`, `ocean`, `sage`, `ember`, `lavender`       |
| `device`   | `16promax`   | `16promax`, `16pro`, `16`, `se`                                |
| `style`    | `dots`       | `dots`, `squares`, `rings`                                     |

### Example

```
/api/wallpaper?birthday=1990-06-15&view=year&theme=midnight&device=16promax&style=dots
```

## Local Development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## iOS Shortcut Setup

1. Open the **Shortcuts** app on iPhone
2. Go to the **Automation** tab
3. Tap **+** → **Create Personal Automation**
4. Select **Time of Day** → 6:00 AM → Daily → **Run Immediately**
5. Add action: **Get Contents of URL** → paste your wallpaper URL
6. Add action: **Set Wallpaper** → Lock Screen → turn OFF "Show Preview"
7. Tap Done

The wallpaper now updates every morning automatically.
