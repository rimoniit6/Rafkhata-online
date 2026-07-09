# Deployment

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Upstash Redis instance
- Supabase project
- UploadThing account
- Sentry account (optional)

## Environment Variables

See `.env.example` for all required variables.

### Required
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `CSRF_SECRET` | 32+ character random string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `SITE_URL` | Internal site URL |

### Optional
| Variable | Description |
|---|---|
| `UPLOADTHING_SECRET` | UploadThing secret |
| `UPLOADTHING_APP_ID` | UploadThing app ID |
| `UPLOADTHING_TOKEN` | UploadThing token |
| `SENTRY_DSN` | Sentry DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Public Sentry DSN |

## Build

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Build
npm run build
```

For standalone output (self-hosting):
```bash
STANDALONE_OUTPUT=true npm run build
```

## Deploy

### Vercel (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Build command: `npm run build`
4. Output directory: `.next`

### Docker / Self-Hosted

```bash
# Build standalone
STANDALONE_OUTPUT=true npm run build

# Run
NODE_ENV=production node .next/standalone/server.js
```

## Database Migrations

```bash
# Create migration
npm run db:migrate

# Reset database
npm run db:reset

# Seed data
npm run seed:content
npm run seed:missing
```

## Monitoring

- **Errors**: Sentry
- **Performance**: Sentry Performance
- **Rate Limiting**: Upstash Analytics
- **Database**: Prisma Studio (`npx prisma studio`)
