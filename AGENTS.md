# AGENTS.md

## Commands
- `npm run dev` - Start dev server (port 3000)
- `npm run build` - Production build
- `npm run test` - Run all tests (`vitest run`)
- `npm run test -- path/to/file.test.ts` - Run single test file
- `npm run deploy` - Build and deploy to Cloudflare Workers

## Tech Stack
TanStack Start (React 19), TanStack Router, Vite 7, Tailwind CSS v4, Vitest, Cloudflare Workers, TypeScript (strict)

## Code Style
- **Formatting**: Tabs for indentation, no semicolons, single quotes (double in JSX attributes)
- **Imports**: External packages first, blank line, then internal imports. Use `@/*` alias for `src/*`
- **Types**: Inline annotations preferred, strict mode with `noUnusedLocals`/`noUnusedParameters`
- **Components**: Function declarations (not arrow), `export default` for components, PascalCase filenames
- **Routes**: Named export `Route` via `createFileRoute()`, use `loader` for data fetching, private component functions
- **Files**: Routes use dot-separated names (`start.server-funcs.tsx`), components use PascalCase
- **Naming**: camelCase for variables/functions, PascalCase for components/types

## Notes
- `routeTree.gen.ts` is auto-generated - do not edit
- No ESLint/Prettier - follow existing patterns in the codebase
