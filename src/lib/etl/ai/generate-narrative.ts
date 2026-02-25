import OpenAI from 'openai';
import { buildPrompt, type NarrativeContext } from './prompts';
import { checkNarrativeQuality } from './quality-gate';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export interface GenerateResult {
  narrative: string;
  wordCount: number;
  templateIndex: number;
  tokensUsed: { input: number; output: number };
  passed: boolean;
  failureReasons: string[];
}

export async function generateNarrative(
  context: NarrativeContext,
  templateIndex?: number
): Promise<GenerateResult> {
  const idx = templateIndex ?? Math.floor(Math.random() * 4);
  const prompt = buildPrompt(context, idx);

  const openai = getOpenAI();

  let response;
  try {
    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional writer for a civic development tracking platform. Write detailed, informative content about building permits and urban development. Never use markdown formatting. Write in flowing paragraphs only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ai] OpenAI API error for permit ${context.permitId}: ${msg}`);
    return {
      narrative: '',
      wordCount: 0,
      templateIndex: idx,
      tokensUsed: { input: 0, output: 0 },
      passed: false,
      failureReasons: [`OpenAI API error: ${msg}`],
    };
  }

  const narrative = response.choices[0]?.message?.content?.trim() || '';
  const quality = checkNarrativeQuality(narrative);

  return {
    narrative,
    wordCount: quality.wordCount,
    templateIndex: idx,
    tokensUsed: {
      input: response.usage?.prompt_tokens || 0,
      output: response.usage?.completion_tokens || 0,
    },
    passed: quality.passed,
    failureReasons: quality.reasons,
  };
}

export async function generateWithRetry(
  context: NarrativeContext,
  maxAttempts: number = 2
): Promise<GenerateResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await generateNarrative(context, attempt);
    if (result.passed) return result;

    // On retry, try a different template
    console.warn(
      `Narrative quality check failed for ${context.permitId} (attempt ${attempt + 1}):`,
      result.failureReasons
    );
  }

  // Return last attempt even if it didn't pass
  return generateNarrative(context, maxAttempts);
}
