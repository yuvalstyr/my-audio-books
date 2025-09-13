# Contributing to Audiobook Wishlist Manager

Thank you for your interest in contributing to the Audiobook Wishlist Manager! This document provides detailed guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing Guidelines](#testing-guidelines)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project follows a simple code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions on-topic and professional

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)
- Git
- A GitHub account

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```sh
   git clone https://github.com/yourusername/audiobook-wishlist-manager.git
   cd audiobook-wishlist-manager
   ```
3. Add the upstream remote:
   ```sh
   git remote add upstream https://github.com/originalowner/audiobook-wishlist-manager.git
   ```

## Development Setup

1. **Install dependencies**:
   ```sh
   npm install
   ```

2. **Set up environment**:
   ```sh
   cp .env.example .env
   ```

3. **Initialize database**:
   ```sh
   npm run db:push
   npm run db:seed  # Optional: add sample data
   ```

4. **Start development server**:
   ```sh
   npm run dev
   ```

5. **Verify setup**:
   - Open http://localhost:5173
   - Run tests: `npm test`
   - Check types: `npm run check`

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-book-search`
- `fix/database-connection-error`
- `docs/update-readme`
- `refactor/simplify-book-store`

### Development Workflow

1. **Create a branch**:
   ```sh
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```sh
   npm test           # Run all tests
   npm run check      # Type checking
   npm run build      # Test build
   ```

4. **Commit your changes**:
   ```sh
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Keep your branch updated**:
   ```sh
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push and create PR**:
   ```sh
   git push origin feature/your-feature-name
   ```

## Testing Guidelines

### Test Types

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test API endpoints and database operations
3. **E2E Tests**: Test complete user workflows

### Writing Tests

- Place tests in `__tests__` directories next to the code they test
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies appropriately

### Test Commands

```sh
npm test                    # Run all tests in watch mode
npm run test:run           # Run all tests once
npm run test:coverage      # Run tests with coverage
npm run test:api           # Run API tests only
npm run test:integration   # Run integration tests
```

### Test Examples

**Component Test**:
```typescript
import { render, screen } from '@testing-library/svelte';
import BookCard from '../BookCard.svelte';

test('displays book title and author', () => {
    const book = { title: 'Test Book', author: 'Test Author' };
    render(BookCard, { book });
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
});
```

**API Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '../+server.ts';

describe('/api/books', () => {
    it('returns books list', async () => {
        const request = new Request('http://localhost/api/books');
        const response = await GET({ request });
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data.books)).toBe(true);
    });
});
```

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` type - use proper typing
- Use meaningful variable and function names

### Svelte Components

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Keep components focused and single-purpose
- Use proper prop typing with TypeScript
- Follow reactive patterns

### Database

- Use Drizzle ORM for all database operations
- Define proper schema with indexes
- Use transactions for multi-step operations
- Handle errors appropriately

### Styling

- Use Tailwind CSS utility classes
- Follow DaisyUI component patterns
- Ensure responsive design
- Maintain consistent spacing and colors

## Commit Guidelines

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(books): add search functionality to book list

fix(api): handle database connection errors properly

docs(readme): update installation instructions

test(components): add tests for BookCard component
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:
   ```sh
   npm run test:run
   npm run check
   npm run build
   ```

2. **Update documentation** if needed

3. **Rebase on latest main**:
   ```sh
   git fetch upstream
   git rebase upstream/main
   ```

### PR Description

Include in your PR description:

- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Technical approach used
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Screenshots
(If applicable)

## Related Issues
Fixes #123
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** promptly
4. **Squash and merge** when approved

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Try troubleshooting steps** in README

### Issue Types

**Bug Reports**:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)
- Screenshots or error messages

**Feature Requests**:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Alternatives considered

**Questions**:
- Clear question with context
- What you've already tried
- Relevant code or configuration

### Issue Templates

Use the provided issue templates when available, or follow this format:

```markdown
## Description
Clear description of the issue or request.

## Steps to Reproduce (for bugs)
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [e.g., macOS 12.0]
- Node.js: [e.g., 18.17.0]
- Browser: [e.g., Chrome 115]
- App Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information.
```

## Development Tips

### Database Development

```sh
# View database in GUI
npm run db:studio

# Generate migrations after schema changes
npm run db:generate

# Apply schema changes
npm run db:push

# Reset database
rm dev.db && npm run db:push
```

### Debugging

```sh
# Enable debug logging
DEBUG=true npm run dev

# Run specific tests
npm run test:run -- BookCard.test.ts

# Check bundle size
npm run build && ls -la build/
```

### Performance

- Test with large datasets using `npm run db:seed`
- Monitor bundle size and loading times
- Use browser dev tools for performance profiling
- Consider database query optimization

## Questions?

If you have questions about contributing:

1. Check this document and the README
2. Search existing issues and discussions
3. Create a new issue with the "question" label
4. Join community discussions (if available)

Thank you for contributing! 🎉