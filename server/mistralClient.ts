export interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MistralResponse {
  choices: { message: { content: string } }[];
}

/**
 * Appelle l'API Mistral pour générer un exercice.
 * Retourne le contenu textuel de la réponse (JSON string à parser).
 */
export async function callMistral(
  messages: MistralMessage[],
  seed: number,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY non définie");

  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages,
      response_format: { type: "json_object" },
      random_seed: seed,
      temperature: 0.3,
      max_tokens: 2000,
    }),
    signal: signal ?? AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Mistral API ${resp.status}: ${text.slice(0, 300)}`);
  }

  const data = (await resp.json()) as MistralResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse Mistral vide");
  return content;
}
