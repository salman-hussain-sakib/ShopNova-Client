# ShopNova - Client

> AI-Powered E-Commerce Frontend built with Next.js, React 19, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS 4
- **State:** React Context + TanStack Query
- **Auth:** Google OAuth + Facebook Login
- **Icons:** Lucide React
- **Charts:** Recharts

## Project Structure

```
client/
├── src/
│   ├── app/            # Next.js pages (App Router)
│   │   ├── auth/       # Login, Register, Facebook callback
│   │   ├── products/   # Product listing & detail pages
│   │   ├── checkout/   # Checkout flow
│   │   ├── profile/    # User profile
│   │   ├── admin/      # Admin dashboard
│   │   ├── about/      # About page
│   │   ├── contact/    # Contact page
│   │   └── privacy/    # Privacy policy
│   ├── components/     # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── AIAssistant.tsx      # AI chatbot with image generation
│   │   ├── FacebookLoginButton.tsx
│   │   └── ThreeExperience.tsx  # 3D background
│   ├── lib/            # Utilities (auth, API, image generator)
│   └── data/           # Fallback product data
├── public/             # Static assets (favicon, icons)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Features

- AI Shopping Assistant with real-time image generation
- Google & Facebook OAuth login
- Product search with AI-powered recommendations
- Responsive design with dark theme
- Admin dashboard with analytics
- Stripe payment integration

## Admin Panel

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@shopnova.com`|
| Password | `admin123456`       |

> Access the admin dashboard at `/admin` after logging in with the above credentials.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

### 3. Start the dev server

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "feat: ready for deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Root Directory: `client`
5. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-server-url.onrender.com/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `your-google-client-id` |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | `your-facebook-app-id` |

6. Click **Deploy**

### 3. Post-Deploy

- Update `CLIENT_URL` on server to your Vercel URL
- Add Vercel URL to Google OAuth redirect URIs
- Add Vercel URL to Facebook OAuth redirect URIs

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
