import { test, expect, describe } from "bun:test";
import { SkillSecurity } from "./security";

describe("SkillSecurity", () => {
  describe("ensureResourceIsWithinSkillContext", () => {
    const skillRoot = "/skills/my-skill";

    test("accepts path equal to root", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill",
          skillRoot,
        ),
      ).toBe(true);
    });

    test("accepts absolute path within root", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/config.json",
          skillRoot,
        ),
      ).toBe(true);
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/assets/logo.png",
          skillRoot,
        ),
      ).toBe(true);
    });

    test("accepts deeply nested paths within root", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/very/deep/nested/file.txt",
          skillRoot,
        ),
      ).toBe(true);
    });

    test("rejects absolute path outside root", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/etc/passwd",
          skillRoot,
        ),
      ).toBe(false);
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/other-skill/config.json",
          skillRoot,
        ),
      ).toBe(false);
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/tmp/file.txt",
          skillRoot,
        ),
      ).toBe(false);
    });

    test("rejects sibling directory access", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/other-skill",
          skillRoot,
        ),
      ).toBe(false);
    });

    test("rejects parent directory", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext("/skills", skillRoot),
      ).toBe(false);
    });

    test("rejects path that starts with root but is not within it", () => {
      // /skills/my-skill-other is not within /skills/my-skill
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill-other",
          skillRoot,
        ),
      ).toBe(false);
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill-other/config.json",
          skillRoot,
        ),
      ).toBe(false);
    });

    test("works with current working directory and relative paths", () => {
      const cwd = process.cwd();
      // Relative path from CWD
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext("relative.txt", cwd),
      ).toBe(true);
      // Absolute path within CWD
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          `${cwd}/file.txt`,
          cwd,
        ),
      ).toBe(true);
    });

    test("handles normalized paths", () => {
      // Path with .. that resolves within root
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/assets/../config.json",
          skillRoot,
        ),
      ).toBe(true);
    });

    test("rejects path with .. that escapes root", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/../other-skill/config.json",
          skillRoot,
        ),
      ).toBe(false);
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/../../etc/passwd",
          skillRoot,
        ),
      ).toBe(false);
    });

    test("rejects complex path traversal attempts", () => {
      expect(
        SkillSecurity.ensureResourceIsWithinSkillContext(
          "/skills/my-skill/a/b/c/../../../../../../../../etc/passwd",
          skillRoot,
        ),
      ).toBe(false);
    });
  });
});
