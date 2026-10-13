# Design: All images batch runs

## Node type `all-images`
- Same ports as `image`: outputs `image`, no inputs.
- Settings: `active: boolean` (default `true` when added from catalog).
- When `active` is false, runnable validation treats the node like an unset Image input.

## Execution
1. User clicks Run. Desktop collects eligible project image IDs (same filter as single-image runs).
2. `planSerialBatchRuns(graph, imageIds)` returns one job per image when an active `all-images` node is the image root for the pipeline; otherwise returns a single-job plan for the existing single-image path.
3. For each job, `materializeGraphForImage` clones the graph and rewrites each `all-images` node in the executable path to `image` with `{ imageId }`.
4. `WorkflowRunQueue` invokes the desktop processor sequentially; `WorkflowRunner` unchanged per job.

## Failure policy
- Fail-fast: first image run failure aborts the queue; toast shows image name and error.
- Incomplete runs may remain `running` in the DB if the app closes mid-batch (same as today).

## Validation
- At most one active `all-images` node may feed the runnable pipeline.
- Each transform still requires its typed output (Text / Evidence).
