import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Skill } from "./skill";

async function createSkill(
  root: string,
  name: string,
  options: {
    description?: string;
    license?: string;
    compatibility?: string;
    allowedTools?: string;
    metadata?: string;
    content?: string;
  } = {},
): Promise<string> {
  const skillDir = join(root, name);
  await mkdir(skillDir, { recursive: true });

  const frontmatter = [
    "---",
    `name: ${name}`,
    `description: ${options.description || "test skill"}`,
  ];

  if (options.license !== undefined) {
    frontmatter.push(`license: ${options.license}`);
  }
  if (options.compatibility !== undefined) {
    frontmatter.push(`compatibility: ${options.compatibility}`);
  }
  if (options.allowedTools !== undefined) {
    frontmatter.push(`allowed-tools: ${options.allowedTools}`);
  }
  if (options.metadata !== undefined) {
    frontmatter.push(`metadata: ${options.metadata}`);
  }

  frontmatter.push("---");
  frontmatter.push("");
  if (options.content !== undefined) {
    frontmatter.push(options.content);
  } else {
    frontmatter.push("skill content");
  }

  await writeFile(
    join(skillDir, "SKILL.md"),
    frontmatter.join("\n") + "\n",
  );

  return skillDir;
}

describe("Skill", () => {
  let testRoot: string;
  const tempDirs: string[] = [];

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "agentskills-skill-"));
    tempDirs.push(testRoot);
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
    );
    tempDirs.length = 0;
  });

  describe("load", () => {
    test("loads skill with valid frontmatter", async () => {
      const skillDir = await createSkill(testRoot, "test-skill", {
        description: "A test skill",
      });
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.name).toBe("test-skill");
      expect(skill.description).toBe("A test skill");
      expect(skill.location).toBe(skillDir);
    });

    test("loads skill with all optional fields", async () => {
      const skillDir = await createSkill(testRoot, "full-skill", {
        description: "Full skill",
        license: "MIT",
        compatibility: "Node.js >= 18",
        allowedTools: "Read Write",
        metadata: "{key: value}",
      });
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.name).toBe("full-skill");
      expect(skill.license).toBe("MIT");
      expect(skill.compatibility).toBe("Node.js >= 18");
      expect(skill.allowedTools).toEqual(["Read", "Write"]);
    });

    test("loads skill with only required fields", async () => {
      const skillDir = await createSkill(testRoot, "minimal-skill");
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.name).toBe("minimal-skill");
      expect(skill.description).toBe("test skill");
      expect(skill.license).toBeNull();
      expect(skill.compatibility).toBeNull();
      expect(skill.allowedTools).toBeNull();
      expect(skill.metadata).toBeNull();
    });

    test("parses allowedTools from space-delimited string", async () => {
      const skillDir = await createSkill(testRoot, "tools-skill", {
        allowedTools: "Read Write Edit",
      });
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.allowedTools).toEqual(["Read", "Write", "Edit"]);
    });

    test("parses allowedTools from comma-delimited string", async () => {
      const skillDir = await createSkill(testRoot, "tools-skill", {
        allowedTools: "Read,Write,Edit",
      });
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.allowedTools).toEqual(["Read", "Write", "Edit"]);
    });

    test("filters out empty strings from allowedTools", async () => {
      const skillDir = await createSkill(testRoot, "tools-skill", {
        allowedTools: "Read  Write   Edit",
      });
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.allowedTools).toEqual(["Read", "Write", "Edit"]);
    });

    test("throws error if file does not start with ---", async () => {
      const skillDir = join(testRoot, "invalid-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, "SKILL.md"), "invalid content");

      return expect(
        Skill.load(join(skillDir, "SKILL.md")),
      ).rejects.toThrow("file does not start with ---");
    });

    test("throws error if frontmatter is incomplete", async () => {
      const skillDir = join(testRoot, "incomplete-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, "SKILL.md"), "---\nname: test\n");

      return expect(
        Skill.load(join(skillDir, "SKILL.md")),
      ).rejects.toThrow("file does not contain valid frontmatter");
    });

    test("throws error if directory name does not match skill name", async () => {
      const skillDir = join(testRoot, "dir-name");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        "---\nname: different-name\ndescription: test\n---\n",
      );

      return expect(
        Skill.load(join(skillDir, "SKILL.md")),
      ).rejects.toThrow("does not match frontmatter name");
    });

    test("throws error for invalid frontmatter", async () => {
      const skillDir = join(testRoot, "invalid-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        "---\nname: invalid skill\ndescription: test\n---\n",
      );

      return expect(
        Skill.load(join(skillDir, "SKILL.md")),
      ).rejects.toThrow("does not match frontmatter name");
    });

    test("handles large frontmatter correctly", async () => {
      const longDescription = "x".repeat(1000);
      const skillDir = await createSkill(testRoot, "large-skill", {
        description: longDescription,
      });
      const skillPath = join(skillDir, "SKILL.md");

      const skill = await Skill.load(skillPath);

      expect(skill.description).toBe(longDescription);
    });
  });

  describe("loadFromDirectory", () => {
    test("loads skill from directory", async () => {
      const skillDir = await createSkill(testRoot, "dir-skill");

      const skill = await Skill.loadFromDirectory(skillDir);

      expect(skill.name).toBe("dir-skill");
      expect(skill.location).toBe(skillDir);
    });
  });

  describe("loadContent", () => {
    test("loads skill content after frontmatter", async () => {
      const skillDir = await createSkill(testRoot, "content-skill", {
        content: "This is the skill content",
      });

      const skill = await Skill.loadFromDirectory(skillDir);
      const content = await skill.loadContent();

      expect(Buffer.isBuffer(content)).toBe(true);
      expect(content.toString("utf-8").trim()).toBe(
        "This is the skill content",
      );
    });

    test("loads empty content", async () => {
      const skillDir = await createSkill(testRoot, "empty-content", {
        content: "",
      });

      const skill = await Skill.loadFromDirectory(skillDir);
      const content = await skill.loadContent();

      expect(Buffer.isBuffer(content)).toBe(true);
      expect(content.toString("utf-8").trim()).toBe("");
    });

    test("loads multiline content", async () => {
      const multilineContent = "Line 1\nLine 2\nLine 3";
      const skillDir = await createSkill(testRoot, "multiline-skill", {
        content: multilineContent,
      });

      const skill = await Skill.loadFromDirectory(skillDir);
      const content = await skill.loadContent();

      expect(content.toString("utf-8").trim()).toBe(multilineContent);
    });
  });

  describe("loadReference", () => {
    test("loads reference file within references directory", async () => {
      const skillDir = await createSkill(testRoot, "ref-skill");
      const referencesDir = join(skillDir, "references");
      await mkdir(referencesDir, { recursive: true });
      await writeFile(join(referencesDir, "ref.md"), "Reference content");

      const skill = await Skill.loadFromDirectory(skillDir);
      const ref = await skill.loadReference("ref.md");

      expect(Buffer.isBuffer(ref)).toBe(true);
      expect(ref.toString("utf-8").trim()).toBe("Reference content");
    });

    test("throws error for path traversal in reference", async () => {
      const skillDir = await createSkill(testRoot, "secure-skill");
      const skill = await Skill.loadFromDirectory(skillDir);

      return expect(
        skill.loadReference("../../../etc/passwd"),
      ).rejects.toThrow("invalid reference");
    });

    test("throws error for absolute path in reference", async () => {
      const skillDir = await createSkill(testRoot, "secure-skill");
      const skill = await Skill.loadFromDirectory(skillDir);

      // Absolute paths in join() reset the path, so this becomes just "/etc/passwd"
      // which should fail the security check
      await expect(skill.loadReference("/etc/passwd")).rejects.toThrow();
    });
  });

  describe("loadAsset", () => {
    test("loads asset file within assets directory", async () => {
      const skillDir = await createSkill(testRoot, "asset-skill");
      const assetsDir = join(skillDir, "assets");
      await mkdir(assetsDir, { recursive: true });
      await writeFile(join(assetsDir, "template.txt"), "Template content");

      const skill = await Skill.loadFromDirectory(skillDir);
      const asset = await skill.loadAsset("template.txt");

      expect(Buffer.isBuffer(asset)).toBe(true);
      expect(asset.toString("utf-8").trim()).toBe("Template content");
    });

    test("throws error for path traversal in asset", async () => {
      const skillDir = await createSkill(testRoot, "secure-skill");
      const skill = await Skill.loadFromDirectory(skillDir);

      return expect(
        skill.loadAsset("../../../etc/passwd"),
      ).rejects.toThrow("invalid asset");
    });

    test("throws error for absolute path in asset", async () => {
      const skillDir = await createSkill(testRoot, "secure-skill");
      const skill = await Skill.loadFromDirectory(skillDir);

      await expect(skill.loadAsset("/etc/passwd")).rejects.toThrow();
    });
  });

  describe("getScriptPath", () => {
    test("returns script path within scripts directory", async () => {
      const skillDir = await createSkill(testRoot, "script-skill");
      const skill = await Skill.loadFromDirectory(skillDir);

      const scriptPath = await skill.getScriptPath("script.sh");

      expect(scriptPath).toBe(join(skillDir, "scripts", "script.sh"));
    });

    test("throws error for path traversal in script", async () => {
      const skillDir = await createSkill(testRoot, "secure-skill");
      const skill = await Skill.loadFromDirectory(skillDir);

      await expect(
        skill.getScriptPath("../../outside.sh"),
      ).rejects.toThrow();
    });
  });

  describe("constructor", () => {
    test("creates skill with all parameters", () => {
      const skill = new Skill(
        "/path/to/skill",
        "test-skill",
        "Test description",
        "MIT",
        "Node.js >= 18",
        { key: "value" },
        ["Read", "Write"],
        100,
      );

      expect(skill.location).toBe("/path/to/skill");
      expect(skill.name).toBe("test-skill");
      expect(skill.description).toBe("Test description");
      expect(skill.license).toBe("MIT");
      expect(skill.compatibility).toBe("Node.js >= 18");
      expect(skill.metadata).toEqual({ key: "value" });
      expect(skill.allowedTools).toEqual(["Read", "Write"]);
    });

    test("creates skill with null optional parameters", () => {
      const skill = new Skill(
        "/path/to/skill",
        "test-skill",
        "Test description",
        null,
        null,
        null,
        null,
      );

      expect(skill.license).toBeNull();
      expect(skill.compatibility).toBeNull();
      expect(skill.metadata).toBeNull();
      expect(skill.allowedTools).toBeNull();
    });

    test("creates skill with undefined optional parameters", () => {
      const skill = new Skill(
        "/path/to/skill",
        "test-skill",
        "Test description",
      );

      expect(skill.license).toBeNull();
      expect(skill.compatibility).toBeNull();
      expect(skill.metadata).toBeNull();
      expect(skill.allowedTools).toBeNull();
    });
  });
});
