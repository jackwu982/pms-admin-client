# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Admin frontend for a PMS (project/management system). Vue 3 + TypeScript + Vite SPA, styled with Element Plus and Tailwind CSS 4, state via Pinia. Backend is a separate service; the frontend talks to it through a Vite dev proxy.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml` is committed; the README's `npm` commands are stale).

```sh
pnpm dev          # start dev server (port 5180, with /api proxy)
pnpm build        # type-check then build for production
pnpm type-check   # vue-tsc --build (type-check only)
pnpm lint         # oxlint + eslint (both with --fix)
pnpm format       # prettier over src/
```

No test framework is configured (no Vitest/Playwright/Cypress). `tsconfig.app.json` excludes `src/**/__tests__/*` but there is no runner wired up.

## Architecture

**Entry & bootstrap** — `src/main.ts` mounts the app, installs Pinia and the router, and imports Element Plus' full CSS plus `src/style/main.css`.

**Routing & layout** — `src/router/index.ts` uses a lazy-loaded `DefaultLayout` (`src/layouts/DefaultLayout.vue`) wrapping the authenticated pages (`homepage`, `department`); `login`, `logout`, and a catch-all `404` sit outside it. A `beforeEach` guard checks `localStore.get('user')` and redirects unauthenticated users to `login` (whitelisted route names: `404`, `login`; a TODO notes a future admin permission check).

**Sidebar menu** — `src/layouts/DefaultAside.vue` declares menus as a hardcoded `menus` ref array of `{ name, routerName, icon }` (icons are `shallowRef` to Element Plus / custom icon components). It supports a two-level `el-sub-menu` structure.

**API layer** — `src/api/module/api.ts` is a single shared Axios instance. Its response interceptor:
- unwraps `res.data` when `code` is absent or `200`,
- otherwise shows an `ElMessage.error` translated through `src/api/module/i18n.ts`,
- redirects to `/login` on `401`/`403`.

`src/api/module/i18n.ts` loads `locales/*.ts` via `import.meta.glob` (eager) and keys them by filename — currently only `zh.ts` exists, and the language is hardcoded to `'zh'` in `api.ts`.

Domain API modules (`src/api/user.ts`, `src/api/department.ts`) export plain object literals of methods that call this shared instance with `/api/...` paths. Follow this pattern for new resources.

**State** — `src/stores/` holds Pinia setup-style stores. `src/composables/store.ts` re-exports the `store` npm package as `localStore` (a localStorage wrapper used for auth persistence).

**Reusable components** — `src/components/base/` (`BasePagination`, `BaseSearchForm`, `BaseTableContainer`) are the page-building blocks; `src/components/icons/` are custom inline-SVG icon components. Both the Element Plus components and these `Base*`/`Icon*` components are **auto-imported** — no explicit `import` needed (see `components.d.ts`). Some views still import them explicitly; either works.

## Conventions

- **Path alias** `@` → `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- **API proxy** — Vite proxies `/api` → `http://127.0.0.1:8620` and rewrites the `/api` prefix away, so a client call to `/api/users/list` reaches `http://127.0.0.1:8620/users/list`. New endpoints go through the same `/api/*` paths.
- **Auto-imports** — `unplugin-vue-components` + `unplugin-auto-import` (Element Plus resolver) generate `components.d.ts` / `auto-imports.d.ts`; these are committed artifacts.
- **Styling** — Tailwind 4 via `@tailwindcss/vite` (see `src/style/tailwind.css` → `@import 'tailwindcss'`). `src/style/reset.css` overrides Element Plus' CSS variables to an Apple-style theme (primary `#0066cc`) and tweaks `el-dialog`/`el-card`/`el-table` padding. `src/style/main.css` imports `reset.css`, `base.css`, `tailwind.css`.
- **Formatting** — Prettier: no semicolons, single quotes, `printWidth: 100`.
- **Lint** — ESLint flat config (`eslint.config.ts`) delegates to an oxlint config (`.oxlintrc.json`) with `correctness` = error; `@typescript-eslint/no-explicit-any` and `vue/multi-word-component-names` are turned off.
- **Dates** — format via `useDayjs()` from `src/util/dayjs.ts` (already extended with utc/timezone/relativeTime/duration).
