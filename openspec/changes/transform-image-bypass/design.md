# Design: Transform image bypass + data output

## Context
`PortType` is `image | text | evidence`. Transforms today output only a result port. `WorkflowRunner` stores one `NodeResult.data` per node and copies that blob onto every inbound edge, ignoring `sourcePort`.

## Decisions
- Keep typed data port IDs (`text` on OCR, `evidence` on forensic transforms). Do not rename them to `data`.
- Add `image` to every transform's outputs. Image-out is optional for a runnable graph.
- A transform's image input may come from an Image node or another transform's image-out. Validation walks that chain to an Image node with a numeric `imageId`.
- `NodeResult` gains optional `outputs: Record<string, unknown>`. Routing is `outputs[sourcePort] ?? data`. Persist still uses `data`.
- Handlers emit both the persist payload and the per-port map (image packet on `image`, analysis result on `text`/`evidence`).
- NodeFrame accepts multiple labeled source handles. Transform nodes pass Image + Data.

## Risks
- Forgetting per-port routing would send OCR text into the next transform as if it were an image. Package runner tests must cover the chain.
- Cycles on image-bypass edges: existing topological sort already rejects cycles.
