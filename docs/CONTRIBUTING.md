# Contributing

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Named exports for components
- Zustand stores with typed selectors
- React Query for server state
- Zod schemas for validation

## Architecture Guidelines

### Component Structure
```
src/components/{domain}/
  ComponentName.tsx
  ComponentName.types.ts  (if complex)
```

### Store Structure
- One file per store in `src/store/`
- Export typed selector hooks
- Use `useShallow` for multi-value selections

### API Routes
- Use `createRouteHandler` factory for consistency
- Zod schemas for request validation
- Standardized response format `{ success, data, error, code }`
- Auth guards: `withAuth`, `withAdmin`, `withCsrf`

### Database
- Prisma ORM with PostgreSQL
- HTML sanitization via store middleware
- Batch queries to prevent N+1
- Selective field loading

## Naming Conventions

- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Components**: PascalCase
- **Functions**: camelCase
- **Stores**: camelCase with `use` prefix
- **Types**: PascalCase, exported

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npx vitest run --coverage
```

## Pull Request Process

1. Ensure tests pass
2. Update relevant documentation
3. Add changes to CHANGELOG
4. Create PR with descriptive title
