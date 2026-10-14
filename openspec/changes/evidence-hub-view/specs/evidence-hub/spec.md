# evidence-hub (new capability)

## ADDED Requirements

### Requirement: Browse project evidence by category
The app SHALL provide an Evidence view listing categories of extracted data with counts.

#### Scenario: Open Evidence hub
- **WHEN** the user opens the Evidence view on an open project
- **THEN** they see cards for each supported evidence type with item counts

### Requirement: Inspect items in a category table
The user SHALL open a category to see a table of all items with source image linkage.

#### Scenario: Open license plate list
- **WHEN** the user selects the License plates card
- **THEN** they see a table row for each stored plate candidate with value, confidence, and source image
