import { resolve } from "node:path";
import { SkillRegistry } from "../build/main.mjs";

const agentSkillsRoots = [resolve(import.meta.dirname, ".")];
const skillRegistry = new SkillRegistry(agentSkillsRoots);

const discoveredSkills = await skillRegistry.discovery();

for (const skill of discoveredSkills) {
  if (skill.status === "error") {
    console.error(`Error loading ${skill.name}: ${skill.error?.message}`);
  }
}

for (const availableSkill of discoveredSkills) {
  if (availableSkill.status === "loaded") {
    const skill = await skillRegistry.getSkill(availableSkill.location);
    const skillContent = await skill.loadContent();
    console.info(skillContent.toString());
  }
}
