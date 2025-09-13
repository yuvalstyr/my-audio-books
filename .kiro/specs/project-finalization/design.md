# Design Document

## Overview

This design document outlines the implementation approach for finalizing the audiobook wishlist manager project. The solution addresses four key areas: Railway deployment configuration, GitHub repository setup, default book name sorting, and a new home screen focused on "next to read" books.

The design leverages the existing SvelteKit architecture and maintains consistency with current patterns while adding the requested functionality.

## Architecture

### Current System Architecture
- **Frontend**: SvelteKit with Svelte 5, TailwindCSS, and DaisyUI
- **Backend**: SvelteKit API routes with SQLite database via Drizzle ORM
- **Deployment**: Currently configured for Railway with Nixpacks
- **State Management**: Svelte stores for filtering and component state

### New Components Architecture
```
src/routes/
├── +page.svelte (new home screen)
├── +page.ts (redirect logic update)
├── +layout.svelte (navigation updates)
└── wishlist/
    └── +page.svelte (existing full list)

src/lib/stores/
└── filter-store.ts (updated default sorting)
```

## Components and Interfaces

### 1. Railway Deployment Enhancement

**Current State**: Basic Railway configuration exists with `railway.json`

**Design Approach**:
- Verify and enhance existing Railway configuration
- Ensure environment variables are properly configured
- Add deployment verification scripts
- Update build process for production optimization

**Key Files**:
- `railway.json` - Deployment configuration
- `package.json` - Build scripts optimization
- Environment variable documentation

### 2. GitHub Repository Setup

**Design Approach**:
- Initialize Git repository if not already done
- Create comprehensive README.md with setup instructions
- Add proper .gitignore for SvelteKit/Node.js
- Configure repository settings and documentation

**Documentation Structure**:
```
README.md
├── Project Description
├── Features
├── Installation Instructions
├── Development Setup
├── Deployment Guide
└── Contributing Guidelines
```

### 3. Default Book Name Sorting

**Current State**: Default sort is by `dateAdded` in descending order

**Design Changes**:
- Update `initialFilterState` in `filter-store.ts`
- Change default `sortBy` from `'dateAdded'` to `'title'`
- Change default `sortOrder` from `'desc'` to `'asc'`
- Maintain existing sorting functionality for user preferences

**Implementation**:
```typescript
const initialFilterState: FilterState = {
    searchQuery: '',
    selectedTags: [],
    sortBy: 'title',        // Changed from 'dateAdded'
    sortOrder: 'asc'        // Changed from 'desc'
};
```

### 4. Home Screen with Next Books

**Design Approach**:
- Create new home page at root route (`/`)
- Display only books tagged with "next"
- Provide navigation to full wishlist
- Optimize for performance with filtered data loading

**Component Structure**:
```svelte
<!-- src/routes/+page.svelte -->
<script>
  // Load only books with "next" tag
  // Simplified interface focused on reading queue
  // Quick actions for managing next books
</script>

<main>
  <header>Next Books to Read</header>
  <next-books-grid />
  <navigation-to-full-list />
</main>
```

**Data Flow**:
1. Home page loads with server-side filtering for "next" books
2. Displays simplified book cards optimized for quick scanning
3. Provides easy navigation to full wishlist management
4. Maintains real-time updates when books are marked/unmarked as "next"

## Data Models

### Existing Models (No Changes Required)
- `Book` interface remains unchanged
- `BookTag` interface supports the existing "next" tag functionality
- Database schema supports current filtering requirements

### New Route Data Structure
```typescript
// src/routes/+page.ts
export async function load({ fetch }) {
    // Load only books with "next" tag for performance
    const nextBooks = await apiClient.getBooks({
        tags: ['next']
    });
    
    return {
        nextBooks,
        totalCount: nextBooks.length
    };
}
```

## Error Handling

### Deployment Error Handling
- Railway deployment validation
- Environment variable verification
- Database migration checks
- Build process error reporting

### Home Screen Error Handling
- Graceful fallback when no "next" books exist
- Network error handling for book loading
- State synchronization between home and wishlist pages

### GitHub Setup Error Handling
- Git initialization error handling
- Remote repository connection validation
- Push operation error reporting

## Testing Strategy

### Deployment Testing
1. **Local Build Verification**
   - Test production build locally
   - Verify all assets are properly bundled
   - Check database migrations work correctly

2. **Railway Deployment Testing**
   - Deploy to Railway staging environment
   - Verify all functionality works in production
   - Test environment variable configuration

### Functionality Testing
1. **Sorting Behavior Testing**
   - Verify default alphabetical sorting
   - Test sort persistence across page reloads
   - Validate sorting with various book collections

2. **Home Screen Testing**
   - Test with no "next" books
   - Test with multiple "next" books
   - Verify navigation between home and wishlist
   - Test real-time updates when toggling "next" status

3. **Integration Testing**
   - Test complete user workflows
   - Verify data consistency between pages
   - Test performance with large book collections

### Repository Testing
1. **Git Operations Testing**
   - Verify repository initialization
   - Test commit and push operations
   - Validate repository structure and documentation

## Performance Considerations

### Home Screen Optimization
- Server-side filtering to reduce initial data load
- Lazy loading for book cover images
- Optimized rendering for smaller dataset
- Efficient state management for real-time updates

### Deployment Optimization
- Production build optimization
- Asset compression and caching
- Database connection pooling
- Environment-specific configurations

## Security Considerations

### Deployment Security
- Environment variable protection
- Database security configuration
- HTTPS enforcement
- Rate limiting considerations

### Repository Security
- Sensitive data exclusion from version control
- Environment variable documentation without values
- Security best practices documentation

## Migration Strategy

### Deployment Migration
1. Prepare Railway environment
2. Configure environment variables
3. Deploy and verify functionality
4. Update DNS/domain configuration if needed

### Code Migration
1. Update default sorting configuration
2. Create home screen components
3. Update navigation and routing
4. Test all functionality thoroughly

### Repository Migration
1. Initialize Git repository
2. Create comprehensive documentation
3. Push to GitHub with proper configuration
4. Set up repository settings and permissions

## Implementation Phases

### Phase 1: Core Functionality
- Update default sorting behavior
- Create basic home screen structure
- Implement "next books" filtering

### Phase 2: Enhancement and Polish
- Add navigation improvements
- Implement performance optimizations
- Create comprehensive documentation

### Phase 3: Deployment and Repository
- Configure Railway deployment
- Set up GitHub repository
- Verify all functionality in production

### Phase 4: Testing and Validation
- Comprehensive testing across all features
- Performance validation
- User experience verification