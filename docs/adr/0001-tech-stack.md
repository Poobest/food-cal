# ADR 0001: Tech Stack

**Status:** Accepted  
**Date:** 2026-05-28

## Context

We are building a LINE LIFF app for daily meal logging and nutritional tracking. The app requires a database, authentication, AI-powered food image recognition, and deployment on a public HTTPS URL (required by LINE LIFF).

## Decision

- **Framework:** Next.js (App Router) — serves both frontend and API routes in a single deployment unit
- **Database:** Supabase (PostgreSQL) — managed, free tier, pairs well with Prisma
- **ORM:** Prisma — type-safe database access
- **Auth:** Custom email/password with JWT (stored in Supabase)
- **AI Vision:** OpenRouter.ai API — unified access to multiple vision-capable LLMs for Food Recognition
- **Food Data:** USDA FoodData Central API — free, comprehensive, no key required for basic usage
- **Deployment:** Vercel — native Next.js support, automatic HTTPS, free tier

## Alternatives Considered

- **Railway/Render:** More complex deploy for Next.js; Vercel is simpler
- **Anthropic Claude directly:** OpenRouter.ai gives flexibility to swap models without code changes
- **Neon:** Also good for PostgreSQL, but Supabase provides more managed services

## Consequences

- All API routes live inside Next.js `/app/api/` — no separate backend service
- LIFF URL will point to the Vercel deployment
- OpenRouter API key must be stored as a Vercel environment variable
