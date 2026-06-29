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

// Resolve the latest manual version for a program (e.g. "v5rc")
const latest = await getLatestManual("v5rc");

// Fetch a specific manual version
const { data: manual, status } = await getManual("v5rc", "1.0");

if (status === 200) {
  console.log(manual);
}
```

### Searching rules

```ts
import { searchManual } from "recf-api-client";

const { data: results } = await searchManual("v5rc", "1.0", {
  q: "robot size",
});

console.log(results);
```

### Listing Q&A for a program

```ts
import { listQa, getQa } from "recf-api-client";

const { data: questions } = await listQa("v5rc");

// Fetch a single Q&A entry by its number
const { data: entry } = await getQa("v5rc", "1234");

console.log(entry);
```

### Response shape

Every endpoint resolves to an object containing the parsed body, HTTP status, and response headers:

```ts
const { data, status, headers } = await getManual("v5rc", "1.0");
```

The `data` type is narrowed by `status`, so checking the status code gives you the correct success or error payload type.

> **Note:** the generated functions request relative paths (e.g. `/programs/{slug}/manual`). In a non-browser environment you may need to supply a base URL via a global `fetch` configuration or a custom `RequestInit`.

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
