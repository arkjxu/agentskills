import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { SkillLoadError } from "../src/errors";
import { SkillRegistry } from "../src/registry";

async function createSkill(
  root: string,
  name: string,
  options: {
    description?: string;
    allowedTools?: string;
    content?: Buffer;
  } = {},
): Promise<string> {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });
  const skillContent = options.content
    ? options.content.toString("utf-8")
    : "body";
  await writeFile(
    join(skillDir, "SKILL.md"),
    `---
name: ${name}
description: ${options.description || "test skill"}
allowed-tools: ${options.allowedTools || "test-tool"}
---

${skillContent}
`,
  );
  return skillDir;
}

describe("SkillRegistry", () => {
  let testRoot: string;
  const tempDirs: string[] = [];

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "agentskills-registry-"));
    tempDirs.push(testRoot);
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
    );
    tempDirs.length = 0;
  });

  describe("discovery", () => {
    test("returns empty array when discovery directory does not exist", async () => {
      const nonExistentDir = join(testRoot, "does-not-exist");
      const registry = new SkillRegistry([nonExistentDir]);

      const skills = await registry.discovery();

      expect(skills).toEqual([]);
    });

    test("returns empty array when discovery directory has no skills", async () => {
      const registry = new SkillRegistry([testRoot]);

      const skills = await registry.discovery();

      expect(skills).toEqual([]);
    });

    test("discovers a single skill", async () => {
      await createSkill(testRoot, "test-skill", {
        description: "A test skill",
      });
      const registry = new SkillRegistry([testRoot]);

      const skills = await registry.discovery();

      expect(skills).toHaveLength(1);
      const skill = skills[0];
      expect(skill).toBeDefined();
      expect(skill).toMatchObject({
        status: "loaded",
        name: "test-skill",
        description: "A test skill",
      });
      expect(skill?.location).toContain("test-skill");
    });

    test("discovers multiple skills from single directory", async () => {
      await createSkill(testRoot, "skill-one");
      await createSkill(testRoot, "skill-two");
      const registry = new SkillRegistry([testRoot]);

      const skills = await registry.discovery();

      expect(skills).toHaveLength(2);
      expect(skills.map((s) => s.name).sort()).toEqual([
        "skill-one",
        "skill-two",
      ]);
    });

    test("discovers skills from multiple directories", async () => {
      const testRoot2 = await mkdtemp(join(tmpdir(), "agentskills-registry2-"));
      tempDirs.push(testRoot2);
      await createSkill(testRoot, "skill-one");
      await createSkill(testRoot2, "skill-two");
      const registry = new SkillRegistry([testRoot, testRoot2]);

      const skills = await registry.discovery();

      expect(skills).toHaveLength(2);
      expect(skills.map((s) => s.name).sort()).toEqual([
        "skill-one",
        "skill-two",
      ]);
    });

    test("ignores non-directory entries", async () => {
      await createSkill(testRoot, "valid-skill");
      await writeFile(join(testRoot, "not-a-skill.txt"), "some content");
      const registry = new SkillRegistry([testRoot]);

      const skills = await registry.discovery();

      expect(skills).toHaveLength(1);
      expect(skills[0]?.name).toBe("valid-skill");
    });

    test("ignores directories without SKILL.md", async () => {
      await createSkill(testRoot, "valid-skill");
      await mkdir(join(testRoot, "invalid-skill"));
      const registry = new SkillRegistry([testRoot]);

      const skills = await registry.discovery();

      expect(skills).toHaveLength(1);
      expect(skills[0]?.name).toBe("valid-skill");
    });

    test("returns error status for invalid skill files", async () => {
      const skillDir = join(testRoot, "invalid-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, "SKILL.md"), "invalid content");
      const registry = new SkillRegistry([testRoot]);

      const skills = await registry.discovery();

      expect(skills).toHaveLength(1);
      const skill = skills[0];
      expect(skill).toBeDefined();
      expect(skill).toMatchObject({
        status: "error",
        name: "invalid-skill",
        description: "",
      });
      expect(skill?.error).toBeInstanceOf(Error);
    });
  });

  describe("getSkill", () => {
    test("throws SkillLoadError when path is outside discovery directories", async () => {
      const outsideRoot = await mkdtemp(join(tmpdir(), "agentskills-outside-"));
      tempDirs.push(outsideRoot);
      const outsideSkillDir = await createSkill(outsideRoot, "outside-skill");
      const registry = new SkillRegistry([testRoot]);

      return expect(registry.getSkill(outsideSkillDir)).rejects.toBeInstanceOf(
        SkillLoadError,
      );
    });

    test("loads skill when path is within discovery directory", async () => {
      const skillDir = await createSkill(testRoot, "valid-skill");
      const registry = new SkillRegistry([testRoot]);

      const skill = await registry.getSkill(skillDir);

      expect(skill.name).toBe("valid-skill");
      expect(skill.description).toBe("test skill");
    });

    test("loads skill from any discovery directory", async () => {
      const testRoot2 = await mkdtemp(join(tmpdir(), "agentskills-registry2-"));
      tempDirs.push(testRoot2);
      const skillDir = await createSkill(testRoot2, "skill-in-second-dir");
      const registry = new SkillRegistry([testRoot, testRoot2]);

      const skill = await registry.getSkill(skillDir);

      expect(skill.name).toBe("skill-in-second-dir");
    });

    test("loads different skills independently", async () => {
      const skill1Dir = await createSkill(testRoot, "skill-one");
      const skill2Dir = await createSkill(testRoot, "skill-two");
      const registry = new SkillRegistry([testRoot]);

      const skill1 = await registry.getSkill(skill1Dir);
      const skill2 = await registry.getSkill(skill2Dir);

      expect(skill1.name).toBe("skill-one");
      expect(skill2.name).toBe("skill-two");
    });
  });
});
