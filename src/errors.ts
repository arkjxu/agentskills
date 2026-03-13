export class SkillLoadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SkillLoadError";
  }

  static wrapError(error: unknown): SkillLoadError {
    if (error instanceof SkillLoadError) {
      return error;
    }
    return new SkillLoadError(
      error instanceof Error ? error.message : String(error),
      { cause: error },
    );
  }
}
