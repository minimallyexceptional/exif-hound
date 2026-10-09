# Workbench workflow core

This package owns platform-neutral workflow graph types, connection validation, JSON serialization, and dependency-ordered execution. It has no React, Tauri, database, filesystem, or DOM dependencies.

## Node handler boundary

The desktop app supplies a handler for each node type and persistence callbacks to `WorkflowRunner`. Handlers receive a typed node record and values from connected inputs, then return a result. Presentation components only render state and dispatch actions; they do not execute handlers or write data.

## Adding a node type

1. Add its input/output port types and validation rules in `src/workflow.ts`.
2. Write package tests first for its graph shape, input/output behavior, progress, and failure cases.
3. Implement its handler in the owning tool package and adapt it at the desktop boundary.
4. Add a presentation component that consumes node state and actions without owning processing behavior.

Run `npm test --workspace=workbench-workflow`, `npm run typecheck --workspace=workbench-workflow`, and `npm run build --workspace=workbench-workflow`.
