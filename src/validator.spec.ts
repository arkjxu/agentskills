import { test, expect, describe } from "bun:test";
import { SkillValidator } from "./validator";

describe("SkillValidator", () => {
  describe("validateName", () => {
    test("accepts valid names", () => {
      expect(() => SkillValidator.validateName("valid-name")).not.toThrow();
      expect(() => SkillValidator.validateName("skill-123")).not.toThrow();
      expect(() => SkillValidator.validateName("a")).not.toThrow();
      expect(() => SkillValidator.validateName("a".repeat(64))).not.toThrow();
    });

    test("rejects invalid name lengths", () => {
      expect(() => SkillValidator.validateName("")).toThrow(
        /maximum length of 64/,
      );
      expect(() => SkillValidator.validateName("a".repeat(65))).toThrow(
        /maximum length of 64/,
      );
    });

    test("rejects names with invalid characters", () => {
      const invalidNames = [
        "skill name",
        "skill_123",
        "TEST-SKILL",
        "skill@name",
        "skill.name",
        "skill/name",
      ];
      invalidNames.forEach((name) => {
        expect(() => SkillValidator.validateName(name)).toThrow(
          /only lowercase alphanumeric characters and hyphens/,
        );
      });
    });

    test("rejects names with invalid hyphen placement", () => {
      expect(() => SkillValidator.validateName("-skill")).toThrow(
        /must not start or end with a hyphen/,
      );
      expect(() => SkillValidator.validateName("skill-")).toThrow(
        /must not start or end with a hyphen/,
      );
      expect(() => SkillValidator.validateName("skill--name")).toThrow(
        /must not contain consecutive hyphens/,
      );
    });

    test("rejects non-string names", () => {
      expect(() => SkillValidator.validateName(123 as any)).toThrow(
        /must be a string/,
      );
      expect(() => SkillValidator.validateName(null as any)).toThrow(
        /must be a string/,
      );
    });
  });

  describe("validateDescription", () => {
    test("accepts valid descriptions", () => {
      expect(() =>
        SkillValidator.validateDescription("A valid description"),
      ).not.toThrow();
      expect(() => SkillValidator.validateDescription("x")).not.toThrow();
      expect(() =>
        SkillValidator.validateDescription("x".repeat(1024)),
      ).not.toThrow();
    });

    test("rejects invalid description lengths", () => {
      expect(() => SkillValidator.validateDescription("")).toThrow(
        /maximum length of 1024/,
      );
      expect(() =>
        SkillValidator.validateDescription("x".repeat(1025)),
      ).toThrow(/maximum length of 1024/);
    });

    test("rejects non-string descriptions", () => {
      expect(() => SkillValidator.validateDescription(123 as any)).toThrow(
        /must be a string/,
      );
      expect(() => SkillValidator.validateDescription(null as any)).toThrow(
        /must be a string/,
      );
    });
  });

  describe("validateLicense", () => {
    test("accepts valid licenses and null/undefined", () => {
      expect(() => SkillValidator.validateLicense("MIT")).not.toThrow();
      expect(() => SkillValidator.validateLicense("Apache-2.0")).not.toThrow();
      expect(() => SkillValidator.validateLicense("")).not.toThrow();
      expect(() => SkillValidator.validateLicense(null)).not.toThrow();
      expect(() => SkillValidator.validateLicense(undefined)).not.toThrow();
    });

    test("rejects non-string licenses", () => {
      expect(() => SkillValidator.validateLicense(123 as any)).toThrow(
        /must be a string/,
      );
    });
  });

  describe("validateCompatibility", () => {
    test("accepts valid compatibility strings and null/undefined", () => {
      expect(() =>
        SkillValidator.validateCompatibility("Node.js >= 18"),
      ).not.toThrow();
      expect(() => SkillValidator.validateCompatibility("x")).not.toThrow();
      expect(() =>
        SkillValidator.validateCompatibility("x".repeat(500)),
      ).not.toThrow();
      expect(() => SkillValidator.validateCompatibility(null)).not.toThrow();
      expect(() =>
        SkillValidator.validateCompatibility(undefined),
      ).not.toThrow();
    });

    test("rejects invalid compatibility lengths", () => {
      expect(() => SkillValidator.validateCompatibility("")).toThrow(
        /length of 1-500/,
      );
      expect(() =>
        SkillValidator.validateCompatibility("x".repeat(501)),
      ).toThrow(/length of 1-500/);
    });

    test("rejects non-string compatibility", () => {
      expect(() => SkillValidator.validateCompatibility(123 as any)).toThrow(
        /must be a string/,
      );
    });
  });

  describe("validateAllowedTools", () => {
    test("accepts valid formats", () => {
      expect(() =>
        SkillValidator.validateAllowedTools(["tool1", "tool2"]),
      ).not.toThrow();
      expect(() => SkillValidator.validateAllowedTools([])).not.toThrow();
      expect(() =>
        SkillValidator.validateAllowedTools("tool1 tool2"),
      ).not.toThrow();
      expect(() => SkillValidator.validateAllowedTools(null)).not.toThrow();
      expect(() =>
        SkillValidator.validateAllowedTools(undefined),
      ).not.toThrow();
    });

    test("rejects invalid types", () => {
      expect(() => SkillValidator.validateAllowedTools({} as any)).toThrow(
        /must be a string or an array of strings/,
      );
      expect(() => SkillValidator.validateAllowedTools(123 as any)).toThrow(
        /must be a string or an array of strings/,
      );
    });

    test("rejects arrays with non-string elements", () => {
      expect(() =>
        SkillValidator.validateAllowedTools(["tool1", 123] as any),
      ).toThrow(/array of strings/);
    });
  });

  describe("validateMetaData", () => {
    test("accepts valid metadata and null/undefined", () => {
      expect(() =>
        SkillValidator.validateMetaData({ key: "value" }),
      ).not.toThrow();
      expect(() => SkillValidator.validateMetaData({})).not.toThrow();
      expect(() =>
        SkillValidator.validateMetaData({ key1: "value1", key2: "value2" }),
      ).not.toThrow();
      expect(() => SkillValidator.validateMetaData(null)).not.toThrow();
      expect(() => SkillValidator.validateMetaData(undefined)).not.toThrow();
    });

    test("rejects non-objects including arrays", () => {
      expect(() => SkillValidator.validateMetaData("string" as any)).toThrow(
        /must be an object/,
      );
      expect(() => SkillValidator.validateMetaData(123 as any)).toThrow(
        /must be an object/,
      );
      expect(() => SkillValidator.validateMetaData([] as any)).toThrow(
        /must be an object/,
      );
    });

    test("rejects objects with non-string values", () => {
      expect(() =>
        SkillValidator.validateMetaData({ key: 123 } as any),
      ).toThrow(/string keys and values/);
      expect(() =>
        SkillValidator.validateMetaData({ key: null } as any),
      ).toThrow(/string keys and values/);
    });
  });

  describe("validate", () => {
    test("accepts valid frontmatter", () => {
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: "A test skill",
          license: "MIT",
          compatibility: "Node.js >= 18",
          "allowed-tools": ["Read", "Write"],
          metadata: { key: "value" },
        }),
      ).not.toThrow();
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: "A test skill",
        }),
      ).not.toThrow();
    });

    test("rejects non-object frontmatter", () => {
      expect(() => SkillValidator.validate(null)).toThrow(
        /Frontmatter must be an object/,
      );
      expect(() => SkillValidator.validate("string")).toThrow(
        /Frontmatter must be an object/,
      );
      expect(() => SkillValidator.validate([])).toThrow(
        /Frontmatter must be an object/,
      );
    });

    test("rejects missing required fields", () => {
      expect(() =>
        SkillValidator.validate({
          description: "A test skill",
        }),
      ).toThrow(/Name must be a string/);
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
        }),
      ).toThrow(/Description must be a string/);
    });

    test("rejects invalid field types", () => {
      expect(() =>
        SkillValidator.validate({
          name: 123,
          description: "A test skill",
        }),
      ).toThrow(/Name must be a string/);
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: 123,
        }),
      ).toThrow(/Description must be a string/);
    });

    test("rejects invalid field values", () => {
      expect(() =>
        SkillValidator.validate({
          name: "test skill",
          description: "A test skill",
        }),
      ).toThrow(/only lowercase alphanumeric characters and hyphens/);
      expect(() =>
        SkillValidator.validate({
          name: "a".repeat(65),
          description: "A test skill",
        }),
      ).toThrow(/maximum length of 64/);
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: "x".repeat(1025),
        }),
      ).toThrow(/maximum length of 1024/);
    });

    test("validates optional fields when present", () => {
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: "A test skill",
          license: 123,
        }),
      ).toThrow(/License must be a string/);
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: "A test skill",
          "allowed-tools": 123,
        }),
      ).toThrow(/must be a string or an array of strings/);
      expect(() =>
        SkillValidator.validate({
          name: "test-skill",
          description: "A test skill",
          metadata: "not-an-object",
        }),
      ).toThrow(/must be an object/);
    });
  });
});
