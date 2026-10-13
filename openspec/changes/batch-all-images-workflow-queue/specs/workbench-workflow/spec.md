# workbench-workflow (delta)

## ADDED Requirements

### Requirement: Offer an All images input node
The Workbench catalog SHALL include an **All images** node under Inputs that outputs image data like the Image node but does not require choosing a single `imageId`.

#### Scenario: Add All images from catalog
- **WHEN** the user adds **All images** from the Inputs catalog
- **THEN** the canvas shows an input node that can connect to transform image ports

### Requirement: Control batch input with an Active toggle
The All images node SHALL expose an **Active** setting in the inspector defaulting to enabled.

#### Scenario: Inactive batch input blocks run
- **WHEN** the All images node is connected but Active is off
- **THEN** runnable validation fails with a clear message

### Requirement: Run the workflow once per project image serially
When an active All images node supplies the image root for a runnable workflow, Run SHALL enqueue one execution per project image and process jobs one at a time.

#### Scenario: Batch run creates per-image history
- **WHEN** the user runs a workflow with Active All images and the project has N eligible images
- **THEN** the app creates N workflow run records and completes or fails each sequentially

#### Scenario: Batch stops on first failure
- **WHEN** a batch job fails
- **THEN** remaining jobs are not started and the user is notified
