/**
 * Typed errors for the project store. The distinction that matters to
 * callers: "this folder is not a project" vs "this project's database is
 * from an incompatible schema" vs "a project with this name already exists".
 */

export class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

/** The folder is not a valid project (missing db, missing images dir, corrupt db). */
export class InvalidProjectError extends ProjectError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProjectError';
  }
}

/** The database exists but does not match the expected project schema. */
export class UnsupportedSchemaError extends ProjectError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedSchemaError';
  }
}

/** Creating a project whose folder already exists. */
export class ProjectExistsError extends ProjectError {
  constructor(path: string) {
    super(`A folder named for this project already exists: ${path}`);
    this.name = 'ProjectExistsError';
  }
}