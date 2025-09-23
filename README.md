# 📚 Audiobook Wishlist Manager

A modern, responsive web application for managing your audiobook wishlist with cross-device synchronization. Built with SvelteKit, TypeScript, and Tailwind CSS.

## ✨ Features

- **📖 Book Management**: Add, edit, and delete audiobooks with detailed information
- **🏷️ Smart Tagging**: Organize books with customizable tags (genre, series, etc.)
- **🔍 Search & Filter**: Find books quickly with powerful search and filtering
- **⭐ Ratings**: Track narrator and story ratings
- **📱 PWA Support**: Install as a mobile app with offline functionality
- **🔄 Cross-Device Sync**: Sync your wishlist across devices with real-time database updates
- **💾 Backup & Restore**: Export/import your data as JSON files
- **🌙 Responsive Design**: Optimized for mobile, tablet, and desktop
- **🏠 Home Screen**: Dedicated view for "next to read" books
- **📊 Smart Sorting**: Default alphabetical sorting with customizable options

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm, pnpm, or yarn** (npm is used in examples)
- **Git** (for cloning and version control)

### Installation

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd audiobook-wishlist-manager
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables** (optional for development)
   ```sh
   cp .env.example .env
   # Edit .env if needed for custom configuration
   ```

4. **Initialize the database**
   ```sh
   npm run db:push
   ```

5. **Start development server**
   ```sh
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:5173`

### Production Deployment

See the [Deployment Guide](#-deployment) section for detailed deployment instructions.

## 📖 How to Use

### Adding Books

1. **Click "Add Book"** button in the top right
2. **Enter book details** manually or paste an Audible URL for auto-parsing
3. **Add tags** to categorize your book (genre, series, etc.)
4. **Rate narrator and story** (optional)
5. **Save** to add to your wishlist

### Managing Your Wishlist

- **Home Screen**: View only books marked as "next to read" for focused reading planning
- **Search**: Use the search bar to find books by title or author
- **Filter**: Filter by tags using the dropdown menu
- **Sort**: Sort by title (default), author, or date added
- **Edit**: Click the edit button on any book card
- **Delete**: Click the delete button (with confirmation)
- **Next Queue**: Click the "+" button to add books to your "next to read" queue
- **Navigation**: Switch between home screen (next books) and full wishlist view

### Backup & Sync

#### Local Backup
1. **Click "Backup"** in the top navigation
2. **Go to "Backup" tab**
3. **Click "Export Backup"** to download a JSON file
4. **To restore**: Go to "Import" tab and select your JSON file

#### Database Sync (Cross-Device)

**Automatic Syncing**:
- **Real-time Updates**: Changes are automatically saved to the database
- **Cross-Device Sync**: Your wishlist syncs instantly across all devices
- **Offline Support**: Changes made offline are synced when you reconnect

**On Other Devices**:
1. **Install the app** on your other device
2. **Your data will automatically sync** from the database

## 🔧 Development

### Development Setup

1. **Fork and clone the repository**
   ```sh
   git clone https://github.com/yourusername/audiobook-wishlist-manager.git
   cd audiobook-wishlist-manager
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up development environment**
   ```sh
   # Copy environment template
   cp .env.example .env
   
   # Initialize development database
   npm run db:push
   
   # Optional: Seed with sample data
   npm run db:seed
   ```

4. **Start development server**
   ```sh
   npm run dev
   ```

### Available Scripts

```sh
# Development
npm run dev                 # Start development server
npm run preview            # Preview production build locally

# Building
npm run build              # Build for production
npm run build:production   # Build with production optimizations

# Database
npm run db:generate        # Generate database migrations
npm run db:migrate         # Run database migrations
npm run db:push           # Push schema changes to database
npm run db:studio         # Open Drizzle Studio (database GUI)
npm run db:seed           # Seed database with sample data

# Testing
npm test                  # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage report
npm run test:api          # Run API tests only
npm run test:integration  # Run integration tests

# Quality Assurance
npm run check             # Type checking
npm run check:watch       # Type checking in watch mode

# Deployment
npm run railway:init      # Initialize Railway deployment
npm run verify:deployment # Verify deployment health
```

### Project Structure

```
audiobook-wishlist-manager/
├── src/
│   ├── lib/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── __tests__/       # Component tests
│   │   │   └── examples/        # Component usage examples
│   │   ├── server/              # Server-side code
│   │   │   ├── db/              # Database configuration and schema
│   │   │   ├── migration/       # Data migration utilities
│   │   │   └── utils/           # Server utilities
│   │   ├── services/            # Business logic and API services
│   │   │   ├── __tests__/       # Service tests
│   │   │   └── examples/        # Service usage examples
│   │   ├── stores/              # Svelte stores for state management
│   │   │   └── __tests__/       # Store tests
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Client-side utilities
│   ├── routes/
│   │   ├── api/                 # API endpoints
│   │   │   └── books/           # Book management API
│   │   ├── wishlist/            # Full wishlist page
│   │   ├── +page.svelte         # Home screen (next books)
│   │   └── +layout.svelte       # App layout
│   ├── __tests__/               # Integration and E2E tests
│   ├── app.css                  # Global styles
│   └── app.html                 # HTML template
├── static/                      # Static assets
├── drizzle/                     # Database migrations
├── scripts/                     # Build and deployment scripts
├── .kiro/                       # Kiro IDE specifications
└── Configuration files...
```

### Key Technologies

- **SvelteKit**: Full-stack web framework with SSR and API routes
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Component library for Tailwind CSS
- **Drizzle ORM**: Type-safe database ORM
- **SQLite**: Lightweight database with better-sqlite3
- **Vitest**: Fast unit testing framework
- **PWA**: Progressive Web App capabilities with Vite PWA plugin
- **Railway**: Cloud deployment platform

## 🌍 Environment Variables

### Development Environment

For local development, copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |
| `DATABASE_PATH` | Custom database file path | `./dev.db` (dev), `./prod.db` (prod) | No |
| `RAILWAY_VOLUME_MOUNT_PATH` | Railway volume mount path | Set by Railway | No |
| `PORT` | Server port | `3000` | No |
| `DEBUG` | Enable debug logging | `false` | No |

### Production Configuration

**Railway Deployment:**
- `NODE_ENV=production` (automatically set)
- `DATABASE_PATH=$RAILWAY_VOLUME_MOUNT_PATH/audiobook-wishlist.db` (configured in railway.json)
- `PORT` (automatically set by Railway)

**Custom Deployment:**
```sh
NODE_ENV=production
DATABASE_PATH=/path/to/your/database.db
PORT=3000
```

## 🚀 Deployment

### Railway Deployment (Recommended)

Railway provides the easiest deployment experience with automatic builds and database persistence.

#### Prerequisites
- Railway account (free tier available)
- GitHub repository with your code

#### Deployment Steps

1. **Prepare your repository**
   ```sh
   # Ensure all changes are committed
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Visit [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the configuration from `railway.json`

3. **Configure database persistence** (recommended)
   - In Railway dashboard, go to your project
   - Add a "Volume" service
   - Mount path: `/app/data`
   - The app will automatically use this for database storage

4. **Verify deployment**
   ```sh
   npm run verify:deployment
   ```

#### Railway Configuration

The project includes `railway.json` with optimized settings:

```json
{
    "build": {
        "builder": "NIXPACKS",
        "buildCommand": "npm ci && npm run build"
    },
    "deploy": {
        "startCommand": "npm run start",
        "healthcheckPath": "/api/health",
        "restartPolicyType": "ON_FAILURE"
    }
}
```

### Manual Deployment

For custom server deployment:

1. **Build the application**
   ```sh
   npm run build:production
   ```

2. **Set environment variables**
   ```sh
   export NODE_ENV=production
   export DATABASE_PATH=/path/to/database.db
   export PORT=3000
   ```

3. **Start the application**
   ```sh
   npm run start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Build and run:
```sh
docker build -t audiobook-wishlist .
docker run -p 3000:3000 -v /path/to/data:/app/data audiobook-wishlist
```

## 📱 PWA Installation

### On Mobile (iOS/Android)
1. **Open the app** in your mobile browser
2. **Look for "Add to Home Screen"** prompt or
3. **Use browser menu** → "Add to Home Screen"
4. **App will install** and work offline

### On Desktop
1. **Look for install icon** in the address bar
2. **Click to install** as a desktop app
3. **App will open** in its own window

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in your browser
- **Database**: Secure database storage with no third-party data sharing
- **No Analytics**: No tracking or data collection
- **Open Source**: Full source code available for review

## 🛠️ Customization

### Adding New Tags
Edit `src/lib/components/BookForm.svelte` to add new tag options:

```typescript
const availableTags = [
    { name: 'funny', label: 'Funny', color: 'badge-warning' },
    { name: 'action', label: 'Action', color: 'badge-error' },
    // Add your custom tags here
];
```

### Changing Themes
The app uses DaisyUI themes. Update `tailwind.config.js`:

```javascript
daisyui: {
    themes: ["light", "dark", "cupcake", "cyberpunk"], // Add themes
}
```

## 🐛 Troubleshooting

### Common Development Issues

**Database Issues**:
```sh
# Reset development database
rm dev.db dev.db-shm dev.db-wal
npm run db:push

# Check database schema
npm run db:studio
```

**Build Errors**:
```sh
# Clear build cache
rm -rf .svelte-kit build node_modules/.vite
npm install
npm run build
```

**Type Errors**:
```sh
# Regenerate types
npm run prepare
npm run check
```

**Test Failures**:
```sh
# Run tests with verbose output
npm run test:run -- --reporter=verbose

# Run specific test file
npm run test:run src/lib/components/__tests__/BookCard.test.ts
```

### Common Runtime Issues

**Books not saving**:
- Check browser console for API errors
- Verify database file permissions
- Check available disk space

**Sync not working**:
- Check network connectivity
- Verify API endpoints are responding
- Check browser console for errors
- Try refreshing the page

**App not loading**:
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check browser console for JavaScript errors
- Verify all static assets are loading

**PWA Installation Issues**:
- Ensure HTTPS is enabled (required for PWA)
- Check manifest.json is accessible
- Verify service worker registration
- Try different browsers

### Deployment Issues

**Railway Deployment Fails**:
```sh
# Test build locally
npm run build:production

# Verify health endpoint
curl https://your-app.railway.app/api/health
```

**Database Migration Issues**:
```sh
# Check migration status
npm run db:studio

# Reset and regenerate migrations
npm run db:generate
npm run db:push
```

**Performance Issues**:
- Check database indexes are created
- Monitor memory usage with large datasets
- Verify image optimization is working
- Check network requests in browser dev tools

### Getting Help

1. **Check the browser console** for error messages
2. **Review the logs** in your deployment platform
3. **Search existing issues** on GitHub
4. **Create a detailed issue** with:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Node version, browser)
   - Screenshots if applicable

### Debug Mode

Enable debug logging for detailed troubleshooting:

```sh
# Development
DEBUG=true npm run dev

# Production
DEBUG=true npm run start
```

## 📚 API Documentation

The application provides a RESTful API for book management.

### Base URL
- Development: `http://localhost:5173/api`
- Production: `https://your-app.railway.app/api`

### Endpoints

#### Books

**GET /api/books**
- Get all books with optional filtering
- Query parameters:
  - `search`: Filter by title or author
  - `tags`: Comma-separated tag names
  - `sortBy`: `title`, `author`, `dateAdded`
  - `sortOrder`: `asc`, `desc`

**POST /api/books**
- Create a new book
- Body: Book object with title, author, and optional fields

**PUT /api/books/:id**
- Update an existing book
- Body: Partial book object with fields to update

**DELETE /api/books/:id**
- Delete a book by ID

#### Health Check

**GET /api/health**
- Returns application health status
- Used by deployment platforms for health checks

### Data Models

#### Book
```typescript
interface Book {
    id: string;
    title: string;
    author: string;
    narratorRating?: number;
    performanceRating?: number;
    description?: string;
    coverImageUrl?: string;
    queuePosition?: number;
    dateAdded: string;
    dateUpdated: string;
    tags: Tag[];
}
```

#### Tag
```typescript
interface Tag {
    id: string;
    name: string;
    color: string;
}
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

See the [LICENSE](LICENSE) file for full details.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines to ensure a smooth collaboration process.

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```sh
   git clone https://github.com/yourusername/audiobook-wishlist-manager.git
   cd audiobook-wishlist-manager
   ```
3. **Set up the development environment** (see [Development Setup](#development-setup))

### Development Workflow

1. **Create a feature branch**
   ```sh
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Follow the existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```sh
   # Run all tests
   npm test
   
   # Run type checking
   npm run check
   
   # Test the build
   npm run build
   ```

4. **Commit your changes**
   ```sh
   git add .
   git commit -m "feat: add your feature description"
   # or
   git commit -m "fix: fix your bug description"
   ```

5. **Push and create a Pull Request**
   ```sh
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- **TypeScript**: Use strict TypeScript with proper type definitions
- **Components**: Follow Svelte 5 best practices with runes
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update README and code comments as needed
- **Database**: Use Drizzle ORM patterns for database operations

### Commit Message Format

Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `style:` for formatting changes

### Pull Request Guidelines

- **Clear description**: Explain what your PR does and why
- **Link issues**: Reference any related issues
- **Tests**: Ensure all tests pass
- **Documentation**: Update docs if needed
- **Small PRs**: Keep changes focused and manageable

### Reporting Issues

When reporting bugs or requesting features:

1. **Search existing issues** first
2. **Use issue templates** when available
3. **Provide clear reproduction steps** for bugs
4. **Include environment details** (OS, Node version, etc.)

### Development Tips

- **Database changes**: Run `npm run db:generate` after schema changes
- **Testing**: Use `npm run test:watch` for continuous testing
- **Debugging**: Enable debug logging with `DEBUG=true`
- **Performance**: Test with large datasets using `npm run db:seed`

### Code Review Process

1. All PRs require review before merging
2. Address review feedback promptly
3. Keep discussions constructive and focused
4. Maintainers will merge approved PRs

Thank you for contributing! 🎉

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📖 Additional Documentation

- **[Contributing Guidelines](CONTRIBUTING.md)**: Detailed guide for contributors
- **[Deployment Guide](DEPLOYMENT.md)**: Comprehensive deployment instructions
- **[API Documentation](#-api-documentation)**: REST API reference
- **[Environment Variables](#-environment-variables)**: Configuration reference

---

**Happy reading! 📚✨**
