import { resolve, sep } from "node:path";

export class SkillSecurity {
  static ensureResourceIsWithinSkillContext(
    resourcePath: string,
    skillRootDir: string,
  ): boolean {
    const resolvedPath = resolve(resourcePath);
    const resolvedRootDir = resolve(skillRootDir);

    return (
      resolvedPath === resolvedRootDir ||
      resolvedPath.startsWith(`${resolvedRootDir}${sep}`)
    );
  }
}
