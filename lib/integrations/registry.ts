// ── Vynthen Integrations — Central Registry ───────────────────────────────

import { googleIntegration } from "./google";
import { githubIntegration } from "./github";
import { notionIntegration } from "./notion";
import type { Integration } from "./types";

export const integrationRegistry: Integration[] = [
    googleIntegration,
    githubIntegration,
    notionIntegration,
];

export function getIntegrationById(id: string): Integration | undefined {
    return integrationRegistry.find((i) => i.id === id);
}
