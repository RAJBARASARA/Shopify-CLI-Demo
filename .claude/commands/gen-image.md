# /gen-image — Generate an image via the local Imagen Dashboard

You generate an image by POSTing to the **Imagen Dashboard** Express API running on
`localhost:3456`. The dashboard wraps OpenRouter (Gemini, GPT-5 Image, Flux) and
sources canon prompts + reference images from a colocated `image-workflow/` folder.

The dashboard always listens on `127.0.0.1:3456` wherever it is deployed. This
command is backend-agnostic about the host — it only talks to that local port. If
the service is down, surface that, don't fall back to anything.

## Input

- Feature / use-case: `$ARGUMENTS` (e.g. `<campaign>-hero`, `<product>-packshot`)
- The user will tell you the **prompt**, **target output path**, and any
  **reference images** (theme paths, URLs, or product slugs). If anything is
  missing, ask — don't guess.

## Preconditions

1. Service is up. Verify:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3456/api/models
   ```
   Expect `200`. If not, report that the imagen service is unreachable (and how it
   is run in this deployment, if known). **Do not try to start it yourself** —
   that's a deploy-user concern, surface it.

2. Output directory exists and is inside the repo. If the user named a path
   under `assets/`, `specs/`, or a campaign folder, create the directory if
   missing.

## Choosing a model

Default to `google/gemini-3-pro-image-preview` (Nano Banana Pro) for product +
mood photography — best photoreal output among current options. Get the live
list any time with:

```bash
curl -s http://127.0.0.1:3456/api/models | jq .
```

Other useful IDs:
- `google/gemini-2.5-flash-image` — fast drafts
- `google/gemini-3.1-flash-image-preview` — 4K-capable flash tier
- `openai/gpt-5-image` — best for **editing an existing photo** (place a real
  product into a new scene). Pass the original via `image` or `images`.

## Building the request

Canon prompts live under the imagen workflow root, at
`<IMAGEN_WORKFLOW_ROOT>/prompts/` (the dashboard knows its own root; ask the
deploy/per-shop config for the path if you need to read the files directly).
Read these before authoring a prompt from scratch — the master blocks for base
scene, product integration, color variation, angle variation, and standalone hero
are authoritative.

Per-product workflow assets (manifests, by_shot refs, color hex):
`<IMAGEN_WORKFLOW_ROOT>/products/<product-slug>/`. The set of `<product-slug>`
values is per-shop — discover them from the workflow root or the shop's
`THEME_PROFILE.md`, don't assume a fixed catalog.

## Request shape

`POST http://127.0.0.1:3456/api/generate`

```json
{
  "model": "google/gemini-3-pro-image-preview",
  "prompt": "<full prompt text>",
  "aspectRatio": "1:1",                   // optional — "1:1", "16:9", "4:5", "9:16", etc.
  "imageSize": "2K",                       // optional — "1K", "2K", "4K"
  "images": ["http://127.0.0.1:3456/workflow-by-shot/<shot>/<file>.jpg"],  // optional — reference images
  "shotId": "hero",                        // optional — used for filename
  "colorId": "warm-grey",                  // optional — used for filename
  "productSlug": "<product-slug>"          // optional — used for filename
}
```

Reference image URLs can be:
- `http://127.0.0.1:3456/workflow-by-shot/<shot>/<file>` — canon shot refs
- `http://127.0.0.1:3456/workflow-products/<slug>/by_shot/<shot>/<file>` — per-product refs
- `http://127.0.0.1:3456/brand/products/<file>` — uploaded real product photos (cache may be empty on VPS)
- A full `https://...` URL — anything publicly reachable
- A `data:image/...;base64,...` URI — inline

The server auto-inlines any localhost reference as base64 before forwarding to
OpenRouter (which can't fetch localhost).

## Response

```json
{
  "imageUrl": "/gallery/2026-05-26_<product>_<shot>_<color>_<hash>.png",
  "content": "...",
  "model": "google/gemini-3-pro-image-preview",
  "usage": { ... },
  "galleryId": "..."
}
```

`imageUrl` is a path under the dashboard's web root. Full URL:
`http://127.0.0.1:3456${imageUrl}`.

## Saving the image into the theme

```bash
curl -s -o "<TARGET_PATH>" "http://127.0.0.1:3456${imageUrl}"
```

The dashboard's `gallery/` directory keeps every generated image, so you can
re-fetch any past generation by its filename without regenerating.

## Worked example

User: "Generate a seasonal hero — warm morning light, the product in a muted accent color, 16:9, save to `assets/<feature>-hero.jpg`."

```bash
# 1. Compose payload (use the master_base_scene + master_color_variation blocks as a starting point)
read -r -d '' PROMPT <<'EOF'
<text from image-workflow/prompts/01_master_base_scene.md plus your customization>
EOF

# 2. Call the dashboard
curl -s -X POST http://127.0.0.1:3456/api/generate \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg p "$PROMPT" \
        '{model:"google/gemini-3-pro-image-preview", prompt:$p, aspectRatio:"16:9", imageSize:"2K", productSlug:"<product-slug>", shotId:"hero"}')" \
  | tee /tmp/gen-response.json

# 3. Pull the image into the repo
URL=$(jq -r '.imageUrl' /tmp/gen-response.json)
curl -s -o "assets/<feature>-hero.jpg" "http://127.0.0.1:3456${URL}"
```

## After generation

1. Show the user the saved path so they can open it.
2. Note the `galleryId` in case they want a re-render or variant — the dashboard
   keeps all metadata in `gallery.json` keyed by that ID.
3. If the user is unhappy with the result, iterate on the prompt **before**
   committing the file to the branch. Don't commit an "okay" image and fix
   later — costs less in agent loops to nail it first.

## Hard rules

- **Never hardcode hex colors.** Pull color hex values from
  `image-workflow/products/<slug>/manifest.json` or the `03_master_color_variation.md`
  prompt block.
- **Never regenerate when an existing gallery file fits.** Check `gallery.json`
  via `curl http://127.0.0.1:3456/api/gallery` first if the user describes
  something we may have made before.
- **Respect the forbidden-words block** at `image-workflow/prompts/00_forbidden_words.md`.
- **Don't push generated images to main until they're approved by the user.**
  Treat image generation outputs the same as any other visual change — they go
  through review before commit.
