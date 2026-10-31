# Repository Guidelines

## Project Structure & Module Organization

This PMS admin frontend uses Vue 3, TypeScript, Vite, Element Plus, Tailwind CSS 4, and Pinia.

- `src/views/` contains route pages; `src/layouts/` contains the application shell and sidebar.
- `src/components/` groups components by domain; `base/` contains shared page building blocks.
- `src/api/` contains domain API modules using the shared Axios client in `src/api/module/api.ts`.
- `src/types/`, `src/stores/`, and `src/composables/` hold domain types, Pinia stores, and composables.
- `src/util/` and `src/utils/` contain helpers; follow the existing location for related functionality.
- `src/style/` contains global styles, `public/` static assets, and `locales/` translations.
- `tests/` contains Node tests; `dist/` is generated build output.

## Build, Test, and Development Commands

Use pnpm with the committed `pnpm-lock.yaml`. Node must satisfy `^22.18.0 || >=24.12.0`.

- `pnpm install`: install dependencies.
- `pnpm dev`: start Vite on port 5180; open `/admin/`.
- `pnpm build`: run type checking and the production build in parallel.
- `pnpm type-check`: check Vue and TypeScript types.
- `pnpm preview`: preview the production build locally.
- `pnpm lint`: run Oxlint and ESLint, both with automatic fixes.
- `pnpm format`: format `src/` with Prettier and Tailwind class sorting.
- `node --test tests/*.test.mjs`: run the test suite.

## Coding Style & Naming Conventions

Use two-space indentation, LF endings, single quotes, no semicolons, and a 100-column formatting target. Follow the checked-in Prettier, EditorConfig, and ESLint configurations. Use Vue single-file components with TypeScript, PascalCase component names such as `TaskDialog.vue`, `*View.vue` for pages, and camelCase helpers. Use `@/` for imports from `src/`. Reuse base components and the shared Axios client. Let auto-import plugins generate `components.d.ts` and `auto-imports.d.ts`.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`; there is no `pnpm test` script or configured coverage threshold. Name tests `tests/*.test.mjs` and describe behavior in test names. Cover edge cases and input mutation for utility changes. Before submitting, run relevant tests and `pnpm build`; manually verify affected UI flows.

## Commit & Pull Request Guidelines

Recent commits use short `feat:` messages, often in Chinese. Follow the type-prefixed style with a specific summary. Keep commits focused. PRs should describe behavior changes, link relevant issues, list validation performed, and include screenshots for visible UI changes.

## Configuration Tips

Vite serves under `/admin` and proxies `/api` to `http://127.0.0.1:8620`, stripping the prefix. Run the backend separately. Keep credentials and tokens out of source control.
