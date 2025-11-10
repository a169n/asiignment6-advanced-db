# Advanced DB Commerce

A full-stack commerce prototype demonstrating an Express + MongoDB backend with a Next.js App Router frontend. It showcases full-text search, collaborative filtering recommendations, ShadCN UI components, and TanStack Query powered data fetching.

## Project structure

```
.
├── backend/      # Express API + MongoDB integration
└── frontend/     # Next.js app-router client implemented with TypeScript
```

## Requirements

- Node.js 18+
- pnpm, npm, or yarn
- MongoDB instance (local or hosted)

## Environment setup

Copy `.env.example` to `.env` in the backend and provide your MongoDB connection string.

```
cd backend
cp .env.example .env
```

Update the `MONGODB_URI` as needed. The frontend expects an environment variable named `NEXT_PUBLIC_API_BASE_URL` pointing to the backend URL (defaults to `http://localhost:4000`).

Create a `.env.local` file in `frontend/` if you need to override the default value:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Installing dependencies

Install packages for both projects (order agnostic):

```
cd backend
npm install

cd ../frontend
npm install
```

## Running the development servers

Start MongoDB, then run the backend and frontend in separate terminals.

```
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

The frontend is served at `http://localhost:3000` by default and will communicate with the Express API at `http://localhost:4000`.

## Available API endpoints

- `POST /api/register` – create a new user account with hashed passwords.
- `POST /api/login` – authenticate an existing user and receive a JWT token.
- `GET /api/products` – paginates/searches the product catalog using text search and filters.
- `GET /api/products/search` – dedicated search endpoint mirroring `/api/products`.
- `POST /api/interactions` – record product views, likes, and purchases (updates user profile arrays).
- `GET /api/recommendations` – return personalized recommendations using collaborative filtering and trending fallbacks.
- `GET /api/users` & `PUT /api/users/:id` – lightweight user administration endpoints used by the demo UI.

## Testing and linting

- `npm run build` (frontend/backend) – type checks and builds the respective project.
- `npm run lint` (frontend) – runs Next.js lint.

## Formatting

The repository uses Prettier (see `.prettierrc`) and ShadCN UI primitives for consistent styling across the application.
