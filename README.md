# recf-api-client

A TypeScript REST client for the [RECF Manuals Public API](https://games.recf.org/api-docs) — a read-only, public JSON API for RECF program manuals and Q&A. No authentication is required; requests are rate limited by IP and responses are cacheable.

The client is generated from the upstream OpenAPI specification using [orval](https://orval.dev/) with the native `fetch` client, so it has no runtime HTTP dependencies.

## Features

- Fully typed request/response models generated from the OpenAPI spec
- Native `fetch`-based client (no axios or other HTTP runtime dependency)
- Endpoints split by API tag for tree-shakeable imports
- Reproducible code generation pipeline

---

## Usage

Many endpoints are scoped to a program, identified by its `slug`. The available RECF programs are:

| Slug | Program |
| --- | --- |
| `achieve` | Achieve |
| `inspire` | Inspire |
| `engage` | Engage |

You can also fetch the full list at runtime with `listPrograms()`.

### Installation

```bash
pnpm add recf-api-client
```

### Quick start

```ts
import { listPrograms } from "recf-api-client";

const { data, status } = await listPrograms();

if (status === 200) {
  for (const program of data) {
    console.log(program);
  }
}
```

### Fetching a manual

```ts
import { getManual, getLatestManual } from "recf-api-client";

// Resolve the latest manual version for a program (one of "achieve", "inspire", "engage")
const latest = await getLatestManual("achieve");

// Fetch a specific manual version
const { data: manual, status } = await getManual("achieve", "1.0");

if (status === 200) {
  console.log(manual);
}
```

### Searching rules

```ts
import { searchManual } from "recf-api-client";

const { data: results } = await searchManual("inspire", "1.0", {
  q: "robot size",
});

console.log(results);
```

### Listing Q&A for a program

```ts
import { listQa, getQa } from "recf-api-client";

const { data: questions } = await listQa("engage");

// Fetch a single Q&A entry by its number
const { data: entry } = await getQa("engage", "1234");

console.log(entry);
```

### Response shape

Every endpoint resolves to an object containing the parsed body, HTTP status, and response headers:

```ts
const { data, status, headers } = await getManual("achieve", "1.0");
```

The `data` type is narrowed by `status`, so checking the status code gives you the correct success or error payload type.

> **Note:** the generated functions request relative paths (e.g. `/programs/{slug}/manual`). In a non-browser environment you may need to supply a base URL via a global `fetch` configuration or a custom `RequestInit`.

### Caching with ETags

The API is read-only and cacheable, so most responses include an `ETag` header that uniquely identifies the current version of a resource. By sending that value back on a later request via the `If-None-Match` header, the server can respond with `304 Not Modified` (and an empty body) instead of re-sending unchanged data — saving bandwidth and helping you stay within the per-IP rate limits.

Because every endpoint accepts a standard `RequestInit` and returns the response `headers`, you can drive this flow yourself:

```ts
import { getManual } from "recf-api-client";

// 1. First request — capture the ETag from the response headers.
const first = await getManual("achieve", "1.0");
const etag = first.headers.get("etag");

// ... later, revalidate using the stored ETag.
const next = await getManual("achieve", "1.0", {
  headers: etag ? { "If-None-Match": etag } : {},
});

if (next.status === 304) {
  // Nothing changed — keep using the previously fetched data.
  console.log("Manual unchanged, using cached copy.");
} else if (next.status === 200) {
  // Updated content — refresh your cache and the stored ETag.
  console.log(next.data);
}
```

A small reusable helper makes this convenient across calls:

```ts
const etagCache = new Map<string, { etag: string; data: unknown }>();

async function cachedGetManual(slug: string, version: string) {
  const key = `${slug}/${version}`;
  const cached = etagCache.get(key);

  const res = await getManual(slug, version, {
    headers: cached ? { "If-None-Match": cached.etag } : {},
  });

  if (res.status === 304 && cached) {
    return cached.data;
  }

  if (res.status === 200) {
    const etag = res.headers.get("etag");
    if (etag) {
      etagCache.set(key, { etag, data: res.data });
    }
    return res.data;
  }

  throw new Error(`Request failed with status ${res.status}`);
}
```

For sustained usage, it might be more ideal for you to store the E-Tag in a database/persistent cache.

> **Note:** when the client receives a `304` response it returns a `null` body, so always fall back to your stored copy for that case. In the browser, the native `fetch` cache may already perform ETag revalidation for you — manual handling is most useful in Node.js or when you maintain your own cache.

---

## Development

### Requirements

- [Node.js](https://nodejs.org/) `26.4.0` (pinned via [Volta](https://volta.sh/))
- [pnpm](https://pnpm.io/) `11.9.0`

### Setup

```bash
pnpm install
```

### Project structure

```
generator.config.ts          # Spec URL + local output filename
orval.config.ts              # orval generation settings
openapi.json                 # Downloaded OpenAPI spec (generated)
scripts/
  fetch-openapi.ts           # Downloads the OpenAPI spec
src/
  recf-manuals-public-api.schemas.ts   # Shared generated types
  index.ts                   # Barrel re-exporting all endpoints + types
  manual/                    # Generated endpoints (by API tag)
  meta/
  programs/
  q-a/
tsconfig.json                # Build config (emits src/ to dist/)
tsconfig.scripts.json        # Type-checks scripts/ without emitting
```

### Scripts

| Command | Description |
| --- | --- |
| `pnpm download_spec` | Download the OpenAPI spec to `openapi.json`. |
| `pnpm generate` | Download the spec and regenerate the client with orval. |
| `pnpm generate:clean` | Remove the existing generated client, then regenerate from scratch. |
| `pnpm build` | Type-check and compile `src/` to `dist/`. |
| `pnpm clean` | Remove `dist/` and the downloaded `openapi.json`. |
| `pnpm build:clean` | Clean, then build from scratch. |

### Regenerating the client

The generation pipeline downloads the latest spec and rebuilds the typed client:

```bash
pnpm generate
```

This runs `pnpm download_spec` (`scripts/fetch-openapi.ts`) to fetch the spec from the `spec_url` defined in [`generator.config.ts`](generator.config.ts), then runs orval (configured in [`orval.config.ts`](orval.config.ts)) to emit the client into `src/`. Use `pnpm generate:clean` to clear stale generated files before regenerating.

> A [GitHub Actions workflow](.github/workflows/verify-generate.yml) runs `pnpm generate` on every pull request and fails if it produces any new or modified files, ensuring the committed client stays in sync with the spec.

### Building

```bash
pnpm build
```

---

## License

[MIT](LICENSE)
