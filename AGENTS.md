<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## OpenSpec feature workflow

OpenSpec is required for all new feature work in this repository. Before changing application code for a new feature, agents must:

1. Create a new OpenSpec change from the repository root, for example:

   ```bash
   openspec new change <feature-name> --description "<what is being changed>"
   ```

2. Create the proposal, requirements, design, and other applicable artifacts in that change. The feature spec must be presented to the user for approval before implementation begins.
3. After the spec is approved, use OpenSpec to create the implementation tasks from the approved spec. Do not write feature code until those tasks exist.
4. Implement the generated tasks, keeping the change artifacts up to date, and run `openspec validate --all` before declaring the feature complete.
5. Archive the completed change with OpenSpec after implementation and validation are finished.

If a feature request does not have an approved spec, stop at the specification stage and ask for approval. Bug fixes, dependency/security updates, documentation-only changes, and routine maintenance may proceed without a new feature spec unless they expand into new feature behavior.
