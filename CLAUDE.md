# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an audiobook wishlist manager built with SvelteKit, TypeScript, and SQLite. It's a full-stack PWA that allows users to manage their audiobook wishlist with features like tagging, search, filtering, cross-device sync, and offline support.

## Key Technologies

- **SvelteKit**: Full-stack framework with SSR and API routes
- **TypeScript**: Strict typing enabled throughout
- **SQLite**: Database with Drizzle ORM for type-safe queries
- **Tailwind CSS + DaisyUI**: Styling with component library
- **Vitest**: Testing framework with jsdom environment
- **PWA**: Progressive web app with service worker

## Development Commands

```bash
# Development
npm run dev                    # Start development server on localhost:5173
npm run preview               # Preview production build

# Building
npm run build                 # Standard build
npm run build:production      # Production build with NODE_ENV=production

# Database Operations
npm run db:push              # Push schema changes to database (use this after schema changes)
npm run db:push:dev          # Push schema changes to dev database (./dev.db)
npm run db:generate          # Generate migrations from schema
npm run db:migrate           # Run migrations
npm run db:studio           # Open Drizzle Studio (database GUI)
npm run db:seed             # Seed database with sample data

# Reset Development Database
# To start fresh with a clean database:
rm -f ./dev.db              # Delete the existing dev database file
npm run db:push:dev         # Create tables from schema in dev database
npm run db:seed             # (Optional) Add sample data
# Then restart your dev server if it was running

# Testing
npm test                    # Run tests in watch mode
npm run test:run           # Run tests once
npm run test:coverage      # Run tests with coverage report
npm run test:api           # Run API tests only
npm run test:integration   # Run integration tests
npm run test:edge-cases    # Run edge case tests

# Type Checking
npm run check              # Run svelte-check for type checking
npm run check:watch        # Type checking in watch mode

# Production
npm run start              # Start production server (requires build first)
npm run railway:init       # Initialize Railway deployment
npm run verify:deployment  # Verify deployment health
```

## Project Architecture

### Database Schema (src/lib/server/db/schema.ts)

- **books**: Main table with title, author, ratings, queue position, dates
- **tags**: Reusable tags with name and color
- **book_tags**: Many-to-many relationship between books and tags
- Uses comprehensive indexing for performance optimization
- Relations defined with Drizzle ORM for type-safe joins

### API Routes (src/routes/api/)

- **GET/POST /api/books**: Book CRUD operations with filtering/sorting
- **GET/PUT/DELETE /api/books/[id]**: Individual book operations
- **GET/POST /api/tags**: Tag management
- **GET /api/health**: Health check endpoint for deployments
- **GET /api/ping**: Basic connectivity test
- All API routes include comprehensive error handling and validation

### Frontend Architecture

- **Home page** (`src/routes/+page.svelte`): Shows "next to read" books only
- **Wishlist page** (`src/routes/wishlist/+page.svelte`): Full book collection view
- **Svelte stores** (`src/lib/stores/`): State management for books and filters
- **Components** (`src/lib/components/`): Reusable UI components with comprehensive testing

### Key Services (src/lib/services/)

- **api-client.ts**: Centralized API communication with error handling
- **audible-parser.ts**: Parse Audible URLs to extract book metadata
- **import-export.ts**: Data backup/restore functionality
- **notification-service.ts**: User feedback and error notifications

## Important Development Notes

### Database Changes
Always run `npm run db:push` after modifying `src/lib/server/db/schema.ts`. The database uses SQLite with automatic migrations in development.

### Type Safety
The codebase uses strict TypeScript. Core types are defined in `src/lib/types/book.ts`. Database operations return properly typed results via Drizzle ORM.

### Testing Strategy
- Unit tests for components, services, and utilities
- Integration tests for API endpoints and database operations
- E2E tests for user workflows
- Coverage thresholds set at 70% for all metrics
- Use `npm run test:api` for backend testing, `npm test` for all tests

### PWA Features
- Service worker handles offline functionality
- Manifest configured for mobile app installation
- Vite PWA plugin manages service worker generation

### Environment Variables
- `NODE_ENV`: Set to 'production' for production builds
- `DATABASE_PATH`: Custom database file location
- `RAILWAY_VOLUME_MOUNT_PATH`: Railway deployment database path
- `PORT`: Server port (default: 3000)

### Performance Considerations
- Database schema includes strategic indexes for common queries
- Components use Svelte's reactivity system efficiently
- API responses include proper caching headers
- Images lazy-load and use optimized formats

### Deployment
Primary deployment target is Railway with Docker. The `railway.json` configures build and deployment settings. Health checks use `/api/health` endpoint.

## Common Patterns

### Adding New API Endpoints
1. Create route in `src/routes/api/`
2. Import database schema and connection
3. Use Drizzle ORM for database operations
4. Include proper error handling and validation
5. Add corresponding tests in `__tests__/` directory

### Adding New Components
1. Create `.svelte` file in `src/lib/components/`
2. Export from `src/lib/components/index.ts`
3. Add tests in `__tests__/` subdirectory
4. Follow existing patterns for props, events, and styling

### Database Operations
Always use Drizzle ORM with the connection from `src/lib/server/db/index.ts`. Prefer parameterized queries and leverage the type-safe query builder.