import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { SkillSecurity } from "./security";
import { SkillValidator } from "./validator";

import matter from "gray-matter";

const FRONT_MATTER_DELIMITER = "---";
const CHUNK_SIZE = 64 * 1024;

export class Skill {
  private readonly _contentSeekAt: number;

  /* Location: the directory where the skill is defined */
  public readonly location: string;

  /* Name: must be 1-64 chars, may contain lowercase alphanumeric characters (a-z, 0-9) and hyphens (-)
   * Must not start or end with a hyphen
   * Must not contain consecutive hyphens --
   * Must match the parent directory name
   */
  public readonly name: string;

  /* Description: must be 1-1024 characters
   * Should describe both what the skill does and when to use it
   * Should include specific keywords that help agents identify relevant tasks
   */
  public readonly description: string;

  /*
   * License: Optional field, recommend keeping it short.
   */
  public readonly license: string | null;

  /*
   * Compatibility: must be 1-500 characters if provided
   * should only be included if your skill have specific environment requirements
   * Can indicate intended product, required system packages, network access needs, etc.
   */
  public readonly compatibility: string | null;

  /*
   * Metadata: optional field.
   * A map from string keys to string values
   * Clients can use this to store additional properties not defined by the agent skills spec
   * recommend making your key names reasonably unique to avoid accidental conflicts
   */
  public readonly metadata: Record<string, string> | null;

  /*
   * Allowed-Tools: optional field
   * A space-delimited list of tools that are pre-approved to run
   * Experimental support for this field may vary
   */
  public readonly allowedTools: string[] | null;

  static readonly __REFERENCES_DIR = "references";
  static readonly __ASSETS_DIR = "assets";
  static readonly __SCRIPTS_DIR = "scripts";
  static readonly __CONTENT_FILE = "SKILL.md";

  constructor(
    location: string,
    name: string,
    description: string,
    license?: string | null,
    compatibility?: string | null,
    metadata?: Record<string, string> | null,
    allowedTools?: string[] | null,
    contentSeekAt?: number,
  ) {
    this.location = location;
    this.name = name;
    this.description = description;
    this.license = license ?? null;
    this.compatibility = compatibility ?? null;
    this.metadata = metadata ?? null;
    this.allowedTools = allowedTools ?? null;
    this._contentSeekAt = contentSeekAt ?? 0;
  }

  static async load(filename: string): Promise<Skill> {
    const rootDir = dirname(filename);

    await using fileHandle = await open(filename, "r");

    const delim = Buffer.from(FRONT_MATTER_DELIMITER, "utf8");

    const head = Buffer.alloc(delim.length);
    const { bytesRead: headBytesRead } = await fileHandle.read(
      head,
      0,
      delim.length,
      0,
    );
    if (headBytesRead !== delim.length || !head.equals(delim)) {
      throw new Error("file does not start with ---");
    }

    const parts = [head];

    let position = delim.length;
    let carry = Buffer.alloc(0);

    let frontMatter: string = "";

    while (!frontMatter) {
      const buf = Buffer.allocUnsafe(CHUNK_SIZE);
      const { bytesRead } = await fileHandle.read(buf, 0, CHUNK_SIZE, position);
      if (bytesRead === 0) {
        throw new Error("file does not contain valid frontmatter");
      }

      position += bytesRead;
      const chunk = buf.subarray(0, bytesRead);
      const scanBuf = carry.length ? Buffer.concat([carry, chunk]) : chunk;

      const found = scanBuf.indexOf(delim);

      if (found === -1) {
        const overlap = delim.length - 1;
        const flushUpTo = Math.max(0, scanBuf.length - overlap);

        if (flushUpTo > 0) {
          parts.push(scanBuf.subarray(0, flushUpTo));
        }

        carry = scanBuf.subarray(flushUpTo);
        continue;
      }

      parts.push(scanBuf.subarray(0, found + delim.length));

      const frontMatterParts = Buffer.concat(parts);

      position = frontMatterParts.length;
      frontMatter = frontMatterParts.toString("utf8");
    }

    const { data } = matter(frontMatter);

    if (basename(rootDir) !== data.name) {
      throw new Error(
        `Skill directory name (${rootDir}) does not match frontmatter name (${data.name})`,
      );
    }

    const allowedTools = (
      !data["allowed-tools"] || Array.isArray(data["allowed-tools"])
        ? data["allowed-tools"]
        : data["allowed-tools"].split(/[\s,]+/)
    )?.filter(Boolean);

    SkillValidator.validate(data);

    return new Skill(
      rootDir,
      data.name,
      data.description,
      data.license,
      data.compatibility,
      data.metadata ? data.metadata : null,
      allowedTools,
      position,
    );
  }

  static async loadFromDirectory(dir: string): Promise<Skill> {
    const contentFilePath = join(dir, Skill.__CONTENT_FILE);
    return Skill.load(contentFilePath);
  }

  /*
   * The Markdown body after the frontmatter contains the skill instructions. There are no format restrictions. Write whatever helps agents perform the task effectively.
   */
  async loadContent(): Promise<Buffer> {
    const contentFilePath = join(this.location, Skill.__CONTENT_FILE);
    await using stream = createReadStream(contentFilePath, {
      start: this._contentSeekAt,
    });

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /*
   *  Contains additional documentation that agents can read when needed:
   */
  async loadReference(referenceFileName: string): Promise<Buffer> {
    const referenceFilePath = join(
      this.location,
      Skill.__REFERENCES_DIR,
      referenceFileName,
    );

    if (
      !SkillSecurity.ensureResourceIsWithinSkillContext(
        referenceFilePath,
        this.location,
      )
    ) {
      throw new Error(
        `invalid reference ${referenceFileName} for skill ${this.name}`,
      );
    }

    await using stream = createReadStream(referenceFilePath);

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /*
   *  Contains static resources:
   *  Templates (document templates, configuration templates)
   *  Images (diagrams, examples)
   *  Data files (lookup tables, schemas)
   */
  async loadAsset(assetFileName: string): Promise<Buffer> {
    const assetFilePath = join(
      this.location,
      Skill.__ASSETS_DIR,
      assetFileName,
    );

    if (
      !SkillSecurity.ensureResourceIsWithinSkillContext(
        assetFilePath,
        this.location,
      )
    ) {
      throw new Error(`invalid asset ${assetFileName} for skill ${this.name}`);
    }

    await using stream = createReadStream(assetFilePath);

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /*
   * Contains executable code that agents can run. Scripts should:
   * Be self-contained or clearly document dependencies
   * Include helpful error messages
   * Handle edge cases gracefully
   * Supported languages depend on the agent implementation. Common options include Python, Bash, and JavaScript.
   */
  async getScriptPath(scriptName: string): Promise<string> {
    const scriptPath = join(this.location, Skill.__SCRIPTS_DIR, scriptName);

    if (
      !SkillSecurity.ensureResourceIsWithinSkillContext(
        scriptPath,
        this.location,
      )
    ) {
      throw new Error(`invalid script ${scriptName} for skill ${this.name}`);
    }

    return scriptPath;
  }
}
