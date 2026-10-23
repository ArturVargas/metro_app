type ChangeOrigin = "llm" | "manual" | "combined";

/** Section headings of `.github/pull_request_template.md`. Changing one is a contract change. */
export const PR_SECTIONS = {
  participant: "Participante y misión",
  prompt: "Prompt exacto",
  baseSha: "SHA base de `dev`",
  summary: "Qué cambia",
  tests: "Pruebas ejecutadas",
  limitations: "Limitaciones conocidas",
  origin: "Origen de los cambios",
  privacy: "Confirmación de privacidad",
} as const;

export const PROMPT_PLACEHOLDER = "PEGA AQUÍ TU PROMPT EXACTO";

export type ParsedPrBody = {
  participantId: string;
  missionId: string;
  prompt: string;
  baseSha: string;
  summary: string;
  tests: string;
  limitations: string;
  changeOrigin: ChangeOrigin;
  changeDeclaration: string;
};

export type PrBodyResult =
  | { ok: true; value: ParsedPrBody }
  | { ok: false; problems: string[] };

const ORIGIN_LABELS: Record<string, ChangeOrigin> = {
  llm: "llm",
  manual: "manual",
  combinado: "combined",
};

function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

// Headings inside fenced blocks belong to the pasted prompt, not to the template.
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let fence: string | null = null;
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (line.trim() === fence) fence = null;
    }
    const heading = !fence && !marker ? line.match(/^## +(.+?)\s*$/) : null;
    if (heading) {
      current = heading[1]!;
      sections.set(current, "");
    } else if (current !== null) {
      sections.set(current, `${sections.get(current)}${line}\n`);
    }
  }
  return sections;
}

// Template prompts such as "- `pnpm lint`:" or "Explicación:" left empty are not content.
function meaningful(text: string): string {
  return stripComments(text)
    .split("\n")
    .filter((line) => !/^\s*[-*]?\s*$/.test(line))
    .filter((line) => !/^\s*[-*]?\s*(`[^`]+`|Prueba manual|Explicaci[oó]n)\s*:\s*$/i.test(line))
    .join("\n")
    .trim();
}

function fencedBlock(text: string): string | null {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^\s*(`{3,}|~{3,})/.test(line));
  if (start === -1) return null;
  const fence = lines[start]!.trim().match(/^(`{3,}|~{3,})/)![1]!;
  const end = lines.findIndex((line, index) => index > start && line.trim() === fence);
  return end === -1 ? null : lines.slice(start + 1, end).join("\n");
}

export function parsePrBody(body: string | null | undefined): PrBodyResult {
  const problems: string[] = [];
  const sections = splitSections(body ?? "");
  const section = (title: string): string | null => {
    const value = sections.get(title);
    if (value === undefined) problems.push(`Falta la sección "## ${title}".`);
    return value ?? null;
  };

  const participantText = stripComments(section(PR_SECTIONS.participant) ?? "");
  const participantId = participantText.match(/Participante:\s*`?(p-\d{3}[b-z]?)`?/i)?.[1] ?? "";
  const missionId = participantText.match(/Misi[oó]n:\s*`?(mission-m\d+)`?/i)?.[1] ?? "";
  if (sections.has(PR_SECTIONS.participant)) {
    if (!participantId) problems.push("Indica tu identificador como `Participante: p-XXX`.");
    if (!missionId) problems.push("Indica la misión como `Misión: mission-mN`.");
  }

  const promptSection = section(PR_SECTIONS.prompt);
  const prompt = promptSection === null ? "" : (fencedBlock(promptSection) ?? "").trim();
  if (promptSection !== null && (!prompt || prompt.includes(PROMPT_PLACEHOLDER))) {
    problems.push("Pega el prompt exacto dentro del bloque de código de \"Prompt exacto\".");
  }

  const baseText = stripComments(section(PR_SECTIONS.baseSha) ?? "");
  const baseSha = baseText.match(/\b[0-9a-f]{40}\b/)?.[0] ?? "";
  if (sections.has(PR_SECTIONS.baseSha) && !baseSha) {
    problems.push("Escribe el SHA completo (40 caracteres) de `dev` del que partiste.");
  }

  const summary = meaningful(section(PR_SECTIONS.summary) ?? "");
  if (sections.has(PR_SECTIONS.summary) && !summary) problems.push("Describe qué cambia en \"Qué cambia\".");
  const tests = meaningful(section(PR_SECTIONS.tests) ?? "");
  if (sections.has(PR_SECTIONS.tests) && !tests) problems.push("Lista las pruebas que ejecutaste y su resultado.");
  const limitations = meaningful(section(PR_SECTIONS.limitations) ?? "");
  if (sections.has(PR_SECTIONS.limitations) && !limitations) {
    problems.push("Escribe las limitaciones conocidas, o \"Ninguna conocida\".");
  }

  const originText = stripComments(section(PR_SECTIONS.origin) ?? "");
  const checked = [...originText.matchAll(/^\s*[-*]\s*\[[xX]\]\s*(LLM|Manual|Combinado)\b/gim)].map(
    (match) => ORIGIN_LABELS[match[1]!.toLowerCase()]!,
  );
  const changeDeclaration = meaningful(
    originText.replace(/^\s*[-*]\s*\[[ xX]\]\s*(LLM|Manual|Combinado)\b.*$/gim, ""),
  );
  if (sections.has(PR_SECTIONS.origin)) {
    if (checked.length !== 1) problems.push("Marca exactamente una opción en \"Origen de los cambios\".");
    if (!changeDeclaration) problems.push("Explica brevemente qué partes hizo el LLM y cuáles cambiaste a mano.");
  }

  const privacy = stripComments(section(PR_SECTIONS.privacy) ?? "");
  if (sections.has(PR_SECTIONS.privacy) && !/^\s*[-*]\s*\[[xX]\]/m.test(privacy)) {
    problems.push("Marca la confirmación de privacidad.");
  }

  if (problems.length > 0) return { ok: false, problems };
  return {
    ok: true,
    value: {
      participantId,
      missionId,
      prompt,
      baseSha,
      summary,
      tests,
      limitations,
      changeOrigin: checked[0]!,
      changeDeclaration,
    },
  };
}
