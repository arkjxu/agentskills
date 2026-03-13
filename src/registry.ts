import { exists, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Skill } from "./skill";
import { SkillLoadError } from "./errors";
import { SkillSecurity } from "./security";

export interface AvailableSkill {
  status: "loaded" | "error";
  error?: Error;
  name: string;
  location: string;
  description: string;
}

export class SkillRegistry {
  private readonly _discoveryDirs: string[];

  constructor(discoveryDirs: string[]) {
    this._discoveryDirs = discoveryDirs;
  }

  async discovery(): Promise<AvailableSkill[]> {
    const availableSkills: AvailableSkill[] = [];

    for (const dir of this._discoveryDirs) {
      const isDirectoryExist = await exists(dir);
      if (!isDirectoryExist) {
        continue;
      }

      const possibleSkillsInDirectory = await readdir(dir, {
        withFileTypes: true,
      });
      for (const skillRoot of possibleSkillsInDirectory) {
        if (!skillRoot.isDirectory) {
          continue;
        }

        const skillContentPath = join(
          dir,
          skillRoot.name,
          Skill.__CONTENT_FILE,
        );

        const hasSkillContent = await exists(skillContentPath);
        if (!hasSkillContent) {
          continue;
        }

        try {
          const skillContent = await Skill.load(skillContentPath);
          availableSkills.push({
            status: "loaded",
            name: skillContent.name,
            location: skillContent.location,
            description: skillContent.description,
          });
        } catch (e) {
          availableSkills.push({
            status: "error",
            error: SkillLoadError.wrapError(e),
            name: skillRoot.name,
            location: join(dir, skillRoot.name),
            description: "",
          });
        }
      }
    }

    return availableSkills;
  }

  async getSkill(skillName: string): Promise<Skill> {
    const isWithinDiscoveryDirs = this._discoveryDirs.some((dir) =>
      SkillSecurity.ensureResourceIsWithinSkillContext(skillName, dir),
    );

    if (!isWithinDiscoveryDirs) {
      throw SkillLoadError.wrapError(
        new Error(`${skillName} is not within skill discovery directories`),
      );
    }

    const foundSkill = await Skill.loadFromDirectory(skillName);
    return foundSkill;
  }
}
