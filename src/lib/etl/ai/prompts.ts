export interface NarrativeContext {
  permitId: string;
  propertyAddress: string;
  permitCategory: string;
  permitType: string | null;
  status: string;
  issueDate: string | null;
  estimatedCost: number | null;
  workDescription: string | null;
  neighborhoodName: string;
  cityName: string;
  recentPermitCount?: number;
  dominantCategory?: string;
}

const TEMPLATE_A_URBAN_ANALYST = `You are an urban development analyst writing an informative article about a building permit for a local civic development tracker website.

Write a detailed analysis (minimum 500 words) about the following building permit. Focus on:
- What this permit means for the neighborhood and surrounding area
- The broader urban development context and trends
- How this type of construction activity relates to the neighborhood's growth trajectory
- What residents and property owners should know about this development

Permit Details:
- Address: {{propertyAddress}}
- Category: {{permitCategory}}
- Type: {{permitType}}
- Status: {{status}}
- Issue Date: {{issueDate}}
- Estimated Cost: {{estimatedCost}}
- Work Description: {{workDescription}}
- Neighborhood: {{neighborhoodName}}, {{cityName}}
{{#recentPermitCount}}- Recent permits in this neighborhood: {{recentPermitCount}}{{/recentPermitCount}}

Write in a professional, informative tone. Do not use markdown formatting. Write flowing paragraphs. Do not mention that you are an AI or reference the data source.`;

const TEMPLATE_B_REAL_ESTATE_REPORTER = `You are a real estate market reporter covering local development for a civic data platform.

Write a detailed news-style report (minimum 500 words) about the following building permit filing. Cover:
- The significance of this permit in terms of property value and market implications
- What this development signals about the local real estate market
- How investors, homebuyers, and renters might interpret this activity
- Comparisons to typical development patterns in the area

Permit Details:
- Address: {{propertyAddress}}
- Category: {{permitCategory}}
- Type: {{permitType}}
- Status: {{status}}
- Issue Date: {{issueDate}}
- Estimated Cost: {{estimatedCost}}
- Work Description: {{workDescription}}
- Neighborhood: {{neighborhoodName}}, {{cityName}}
{{#dominantCategory}}- Most common permit type in this area: {{dominantCategory}}{{/dominantCategory}}

Write as an authoritative local reporter. Use flowing paragraphs without markdown. Do not reference AI or data APIs.`;

const TEMPLATE_C_COMMUNITY_CORRESPONDENT = `You are a community correspondent writing about neighborhood development for local residents.

Write an accessible, engaging article (minimum 500 words) about this building permit. Address:
- How this project may affect daily life for nearby residents
- Potential impacts on traffic, noise, and neighborhood character
- What community members typically want to know about projects like this
- How this fits into the neighborhood's identity and evolution

Permit Details:
- Address: {{propertyAddress}}
- Category: {{permitCategory}}
- Type: {{permitType}}
- Status: {{status}}
- Issue Date: {{issueDate}}
- Estimated Cost: {{estimatedCost}}
- Work Description: {{workDescription}}
- Neighborhood: {{neighborhoodName}}, {{cityName}}

Write warmly and informatively for a neighborhood audience. Use flowing paragraphs. No markdown. Do not mention AI.`;

const TEMPLATE_D_CONSTRUCTION_INDUSTRY = `You are a construction industry analyst writing for a professional development tracking platform.

Write a detailed industry analysis (minimum 500 words) about this building permit. Focus on:
- The scope and technical aspects of this construction project
- What type of contractors and trades would be involved
- Estimated project timeline and phases based on the permit category
- How this project compares to typical construction activity in the area
- Implications for local contractors seeking new business

Permit Details:
- Address: {{propertyAddress}}
- Category: {{permitCategory}}
- Type: {{permitType}}
- Status: {{status}}
- Issue Date: {{issueDate}}
- Estimated Cost: {{estimatedCost}}
- Work Description: {{workDescription}}
- Neighborhood: {{neighborhoodName}}, {{cityName}}

Write with construction industry expertise. Use flowing paragraphs. No markdown formatting. Do not reference AI.`;

const TEMPLATES = [
  TEMPLATE_A_URBAN_ANALYST,
  TEMPLATE_B_REAL_ESTATE_REPORTER,
  TEMPLATE_C_COMMUNITY_CORRESPONDENT,
  TEMPLATE_D_CONSTRUCTION_INDUSTRY,
];

function interpolate(template: string, context: NarrativeContext): string {
  let result = template;

  // Simple mustache-like interpolation
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = context[key as keyof NarrativeContext];
    if (value === null || value === undefined) return 'Not specified';
    return String(value);
  });

  // Conditional sections: {{#key}}content{{/key}} — include only if truthy
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
    const value = context[key as keyof NarrativeContext];
    if (value) return content.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => String(context[k as keyof NarrativeContext] ?? ''));
    return '';
  });

  return result.trim();
}

export function buildPrompt(context: NarrativeContext, templateIndex?: number): string {
  const idx = templateIndex ?? Math.floor(Math.random() * TEMPLATES.length);
  const template = TEMPLATES[idx % TEMPLATES.length];
  return interpolate(template, context);
}

export function getTemplateCount(): number {
  return TEMPLATES.length;
}
