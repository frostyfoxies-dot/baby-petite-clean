# Contributing to Kids Petite

Thank you for your interest in contributing to Kids Petite! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members
- Accept constructive criticism gracefully

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

## Development Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 8+
- PostgreSQL 16+
- Git

### Initial Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kids-petite.git
   cd kids-petite
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Set up the database:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

Examples:
- `feature/add-product-reviews`
- `fix/cart-total-calculation`
- `docs/update-api-documentation`

### Creating a Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git fetch origin
git rebase origin/main
```

## Code Style Guide

### TypeScript

- Use TypeScript for all new files
- Define explicit types for function parameters and return values
- Avoid `any` type; use `unknown` when type is truly unknown
- Use interfaces for object shapes, types for unions/primitives

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### React

- Use functional components with hooks
- Use named exports for components
- Keep components small and focused
- Extract reusable logic into custom hooks

```typescript
// Good
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn('base-styles', variant === 'primary' && 'primary-styles')}
    >
      {children}
    </button>
  );
}
```

### File Organization

```
src/
├── components/
│   ├── feature-name/
│   │   ├── index.ts           # Barrel export
│   │   ├── feature-name.tsx   # Main component
│   │   ├── feature-name.test.tsx
│   │   └── types.ts           # Feature-specific types
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard` |
| Functions | camelCase | `formatPrice` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ITEMS` |
| Files (components) | kebab-case | `product-card.tsx` |
| Files (utilities) | kebab-case | `format-price.ts` |
| CSS classes | kebab-case | `product-card` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

### CSS/Tailwind

- Use Tailwind utility classes
- Use `cn()` for conditional class merging
- Extract repeated patterns to components

```typescript
// Good
<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-yellow',
  isDisabled && 'opacity-50'
)}>
```

### Imports Order

Organize imports in this order:

1. React/Next.js
2. Third-party libraries
3. Internal components
4. Internal utilities
5. Types
6. Styles

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party
import { z } from 'zod';
import { motion } from 'framer-motion';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';

// 4. Internal utilities
import { formatPrice } from '@/lib/utils';

// 5. Types
import type { Product } from '@/types';

// 6. Styles
import styles from './styles.module.css';
```

## Commit Guidelines

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |

### Examples

```
feat(cart): add discount code validation

fix(checkout): correct tax calculation for international orders

docs(readme): update installation instructions

test(product-card): add tests for sale price display
```

### Commit Best Practices

- Write clear, descriptive commit messages
- Keep commits atomic (one logical change per commit)
- Reference issues in commit messages: `fixes #123`

## Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git rebase origin/main
   ```

2. **Run tests**:
   ```bash
   pnpm test
   pnpm test:e2e
   ```

3. **Run linting**:
   ```bash
   pnpm lint
   ```

4. **Build the project**:
   ```bash
   pnpm build
   ```

### PR Title

Use the same format as commit messages:

```
feat(cart): add discount code validation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. At least one approval required
2. All CI checks must pass
3. No merge conflicts
4. Branch must be up to date with main

### After Approval

- Squash and merge is preferred
- Delete the branch after merge

## Testing Guidelines

### Unit Tests

- Write tests for all utility functions
- Write tests for complex component logic
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('formatPrice', () => {
  it('should format USD by default', () => {
    const result = formatPrice(99.99);
    expect(result).toContain('$99.99');
  });

  it('should handle zero amount', () => {
    const result = formatPrice(0);
    expect(result).toBe('$0.00');
  });
});
```

### Integration Tests

- Test component interactions
- Test user flows
- Mock external dependencies

### E2E Tests

- Test critical user journeys
- Test authentication flows
- Test checkout process

### Test Coverage

- Aim for 80%+ coverage on utilities
- Aim for 70%+ coverage on components
- Focus on meaningful coverage, not just numbers

## Documentation

### Code Comments

- Comment "why", not "what"
- Use JSDoc for public APIs
- Keep comments up to date

```typescript
/**
 * Calculates the recommended size based on baby's age and growth data
 * Uses WHO growth charts for reference
 * 
 * @param birthDate - Baby's birth date
 * @param currentWeight - Current weight in kg
 * @param currentHeight - Current height in cm
 * @returns Recommended size with confidence score
 */
function predictSize(birthDate: Date, currentWeight: number, currentHeight: number) {
  // ...
}
```

### Updating Documentation

- Update README.md for user-facing changes
- Update Docs/ for architectural changes
- Update inline comments for code changes

## Getting Help

- Open a discussion for questions
- Join our Discord community
- Email: dev@kidspetite.com

## Recognition

Contributors are recognized in:
- Our contributors page
- Release notes for significant contributions

Thank you for contributing! 🎉
