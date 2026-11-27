# Agree2Met Client

The frontend application for **Agree2Met** — a digital agreement management SaaS platform.

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Routing & SSR/SSG**: TanStack Start + TanStack Router (file-based routing in `src/routes/`)
- **State & Data Fetching**: TanStack React Query + Context API
- **Styling**: Tailwind CSS v4 + Plain CSS Modules (`src/pages/pages.module.css`, `src/styles.css`)
- **UI Components**: shadcn/ui + Radix UI primitives + Lucide React
- **Icons**: Lucide React
- **Fonts**: Self-hosted `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`, `@fontsource/source-serif-4`
- **Build & Dev Tool**: Vite 8

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x

### Running the Frontend

```bash
# From workspace root:
npm run dev:client

# Or from client/ directory:
npm run dev
```

The application starts on `http://localhost:5173`.

### Environment Configuration

Configuration variables (`.env` or Vite environment):

- `VITE_USE_MOCK`: Defaults to `true`. When `true`, runs entirely against the local in-browser mock store (`src/services/mock/`). When set to `false`, connects to the backend Express API via `httpAdapter`.
- `VITE_API_URL`: Points to the backend API base URL (default: `http://localhost:5000/api/v1`).

### Demo Login Credentials

- **Email**: `alex@agree2met.com`
- **Password**: `Demo@1234`
- **Role**: `Owner` (switchable in demo workspace to `Admin`, `Member`, `Viewer`)

### Scripts

- `npm run dev`: Start Vite development server on port 5173
- `npm run build`: Build production assets
- `npm run preview`: Preview production build on port 5173
- `npm run lint`: Run ESLint static analysis
- `npm run test`: Run Vitest unit and route smoke tests
