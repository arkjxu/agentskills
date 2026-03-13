export interface ValidatedSkillFrontmatter {
  name: string;
  description: string;
  license?: string | null;
  compatibility?: string | null;
  "allowed-tools"?: string | string[] | null;
  metadata?: Record<string, string> | null;
}

export abstract class SkillValidator {
  static readonly MAX_NAME_LENGTH = 64;
  static readonly MAX_DESCRIPTION_LENGTH = 1024;
  static readonly MAX_COMPATIBILITY_LENGTH = 500;

  static validateName(name: unknown): asserts name is string {
    if (
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > SkillValidator.MAX_NAME_LENGTH
    ) {
      throw new Error(
        `Name must be a string with a maximum length of ${SkillValidator.MAX_NAME_LENGTH} characters.`,
      );
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error(
        "Name must contain only lowercase alphanumeric characters and hyphens",
      );
    }

    if (name.startsWith("-") || name.endsWith("-")) {
      throw new Error("Name must not start or end with a hyphen");
    }

    if (name.includes("--")) {
      throw new Error("Name must not contain consecutive hyphens");
    }
  }

  static validateDescription(
    description: unknown,
  ): asserts description is string {
    if (
      typeof description !== "string" ||
      description.length < 1 ||
      description.length > SkillValidator.MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `Description must be a string with a maximum length of ${SkillValidator.MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }
  }

  static validateLicense(
    license: unknown,
  ): asserts license is string | null | undefined {
    if (license === null || license === undefined) {
      return;
    }

    if (typeof license !== "string") {
      throw new Error("License must be a string");
    }
  }

  static validateCompatibility(
    compatibility: unknown,
  ): asserts compatibility is string | null | undefined {
    if (compatibility === null || compatibility === undefined) {
      return;
    }

    if (
      typeof compatibility !== "string" ||
      compatibility.length < 1 ||
      compatibility.length > SkillValidator.MAX_COMPATIBILITY_LENGTH
    ) {
      throw new Error(
        `Compatibility must be a string with a length of 1-${SkillValidator.MAX_COMPATIBILITY_LENGTH} characters.`,
      );
    }
  }

  static validateAllowedTools(
    allowedTools: unknown,
  ): asserts allowedTools is string | string[] | null | undefined {
    if (allowedTools === null || allowedTools === undefined) {
      return;
    }

    if (Array.isArray(allowedTools)) {
      for (const tool of allowedTools) {
        if (typeof tool !== "string") {
          throw new Error("Allowed tools must be an array of strings");
        }
      }
      return;
    }

    if (typeof allowedTools !== "string") {
      throw new Error("Allowed tools must be a string or an array of strings");
    }
  }

  static validateMetaData(
    metadata: unknown,
  ): asserts metadata is Record<string, string> | null | undefined {
    if (metadata === null || metadata === undefined) {
      return;
    }

    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new Error("Metadata must be an object");
    }

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof key !== "string" || typeof value !== "string") {
        throw new Error(
          "Metadata must be an object with string keys and values",
        );
      }
    }
  }

  static validate(
    frontmatter: unknown,
  ): asserts frontmatter is ValidatedSkillFrontmatter {
    if (
      !frontmatter ||
      typeof frontmatter !== "object" ||
      Array.isArray(frontmatter)
    ) {
      throw new Error("Frontmatter must be an object");
    }

    const data = frontmatter as Record<string, unknown>;

    SkillValidator.validateName(data.name);
    SkillValidator.validateDescription(data.description);
    SkillValidator.validateLicense(data.license);
    SkillValidator.validateCompatibility(data.compatibility);
    SkillValidator.validateAllowedTools(data["allowed-tools"]);
    SkillValidator.validateMetaData(data.metadata);
  }
}
