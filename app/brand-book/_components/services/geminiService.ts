
import { GoogleGenAI, Type } from "@google/genai";
import { Brand, StrategySectionType, BrandIdentity, AssetComplianceReport } from "../types";

// Initialize Gemini Client
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY || 'MISSING_KEY';
const ai = new GoogleGenAI({ apiKey });

const modelFlash = 'gemini-2.5-flash';
const modelImage = 'gemini-2.5-flash-image';

type InputSource = string | { mimeType: string; data: string };

// --- CREATIVE STUDIO AI ---

export const enhancePrompt = async (basePrompt: string, brand: Brand): Promise<string> => {
  // If we have an API key, we try to enhance it using the brand's tone.
  // For now, we simulate a robust enhancement to ensure reliability in the demo without burning tokens/latency.
  // But let's try a real call if simple.

  // Fallback/Simulated Logic for speed:
  const keywords = [brand.personality, brand.toneOfVoice, brand.niche].filter(Boolean).join(', ');
  return `${basePrompt}, professional photography, ${keywords || 'high-end, luxury'}, 8k resolution, cinematic lighting, photorealistic`;
};

export const mockImageGeneration = async (prompt: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return 4 placeholder images seeded by the prompt length to be deterministic-ish
      const seeds = [1, 2, 3, 4];
      resolve(seeds.map(s => `https://picsum.photos/seed/${prompt.length + s}/800/800`));
    }, 3000);
  });
};

// --- VIDEO AI ---

export const generateVideoScript = async (topic: string, format: string, brand: Brand): Promise<string> => {
  // Simulated Script Generation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`
[SCENE 1]
Visual: Wide shot of a luxury hotel lobby, golden hour lighting.
Audio: (Upbeat, elegant lo-fi beat starts)
Voiceover: "Discover a stay that's as unique as you are."

[SCENE 2]
Visual: Close up of a hand placing a keycard on a marble table.
Audio: (Sound of card tap)
Voiceover: "Welcome to ${brand.name}, where every detail matters."

[SCENE 3]
Visual: Fast montage of pool, spa, and gourmet food.
Audio: (Music swells)
Voiceover: "Relax. Indulge. Repeat."

[SCENE 4]
Visual: Text overlay "Book Now" with logo.
Audio: (Music fades out)
Voiceover: "Your escape awaits."
            `.trim());
    }, 2000);
  });
};

// --- BRAND AUDIT AI ---
export const assessAssetCompliance = async (assetUrl: string, identity: BrandIdentity): Promise<AssetComplianceReport> => {
  // In a real implementation, we would send the image base64 to Gemini Pro Vision.
  // For this prototype, we will simulate the check based on the identity provided to demonstrate the UI flow.

  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock logic: randomly pass/fail to show different states, weighted towards pass
      const passColors = Math.random() > 0.2;
      const passLogo = Math.random() > 0.1;
      const passFonts = Math.random() > 0.3;
      const passStyle = Math.random() > 0.1;

      const score = [passColors, passLogo, passFonts, passStyle].filter(Boolean).length * 25;

      resolve({
        score: score,
        status: score === 100 ? 'PASS' : (score > 50 ? 'WARN' : 'FAIL'),
        last_run: new Date().toISOString(),
        checks: {
          colors: {
            passed: passColors,
            message: passColors
              ? "Dominant colors match brand palette."
              : `Detected unexpected colors. Ensure primary (${identity.color_primary_hex}) is dominant.`
          },
          typography: {
            passed: passFonts,
            message: passFonts
              ? "Font style consistent with guidelines."
              : `Text detected does not match ${identity.font_heading} or ${identity.font_body}.`
          },
          logo_usage: {
            passed: passLogo,
            message: passLogo
              ? "Logo clear space respected."
              : "Logo appears crowded or too close to edges."
          },
          visual_style: {
            passed: passStyle,
            message: passStyle
              ? "Visuals align with brand mood."
              : `Image style deviates from "${identity.image_style?.substring(0, 20)}..."`
          }
        },
        ai_feedback: score === 100
          ? "Excellent work! This asset is perfectly on-brand and ready for publishing."
          : "This asset needs a few tweaks to fully align with the brand guidelines. Check the specific warnings above."
      });
    }, 2000); // Simulate network delay
  });
};

export const generateBrandStrategy = async (brand: Brand, inputs: InputSource[]): Promise<Record<string, string>> => {

  // 1. Define the System/Task Instruction
  let taskInstruction = "";

  if (inputs.length > 0) {
    // EXTRACTION MODE
    taskInstruction = `
        You are a precise data extractor. Your goal is to extract specific sections from the provided "Brand Book" sources (texts and files) and map them to the JSON keys requested.
        
        INSTRUCTIONS:
        1. Analyze ALL provided sources combined as one knowledge base.
        2. Extract the content EXACTLY as it appears in the source where possible.
        3. If a section is missing in the source, you may infer it based on the brand's "${brand.name}" profile, but prefer extraction.
        4. Map specific headers to these keys:
           - "Purpose, Mission & Vision" -> purpose, mission, vision
           - "Positioning & Unique Value Proposition" -> positioning, uvp
           - "Brand Promise & Story" -> brand_promise, brand_story
           - "Tone of Voice & Manifesto" -> tone_of_voice, brand_manifesto
           - "Campaign Framework" -> campaign_framework
           - "Message & Content Pillars" -> messaging_pillars, content_pillars
           - "Creative Direction & Visual Identity" -> creative_direction
           - "Brand Architecture & Integration" -> brand_architecture
           - "Rule of the Five Pillars" -> five_pillars
           - "Ethics & Sustainability" -> ethics
           - "Competitive Benchmark" -> competitive_benchmark
           - "Guest Experience Mapping" -> guest_experience
           
        Return a JSON object with the following keys (values must be strings):
        - purpose, mission, vision, positioning, uvp, brand_promise, brand_archetype, tone_of_voice, brand_story, brand_manifesto, campaign_framework, messaging_pillars, content_pillars, creative_direction, ethics, brand_architecture, five_pillars, competitive_benchmark, guest_experience.
      `;
  } else {
    // GENERATION MODE
    taskInstruction = `
        Act as a world-class brand strategist. Based on the following brand details, generate the core strategic elements.
        
        Brand Name: ${brand.name}
        Niche: ${brand.niche}
        What they sell: ${brand.what_you_sell}
        Who they help: ${brand.who_you_help}
        Transformation: ${brand.transformation}
        Key Differentiator: ${brand.difference}
        Desired Emotions: ${brand.emotions}
        Values: ${brand.values}
        Personality: ${brand.personality}

        Return a JSON object with the following keys (values must be strings):
        - purpose, mission, vision, positioning, uvp, brand_promise, brand_archetype, tone_of_voice, brand_story, brand_manifesto, campaign_framework, messaging_pillars, content_pillars, creative_direction, ethics, brand_architecture, five_pillars, competitive_benchmark, guest_experience.
      `;
  }

  // 2. Construct Contents
  const contents = [
    { text: taskInstruction },
    ...inputs.map(input => {
      if (typeof input === 'string') {
        return { text: `SOURCE TEXT:\n${input}` };
      } else {
        return { inlineData: input };
      }
    })
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purpose: { type: Type.STRING },
            mission: { type: Type.STRING },
            vision: { type: Type.STRING },
            positioning: { type: Type.STRING },
            uvp: { type: Type.STRING },
            brand_promise: { type: Type.STRING },
            brand_archetype: { type: Type.STRING },
            tone_of_voice: { type: Type.STRING },
            brand_story: { type: Type.STRING },
            brand_manifesto: { type: Type.STRING },
            campaign_framework: { type: Type.STRING },
            messaging_pillars: { type: Type.STRING },
            content_pillars: { type: Type.STRING },
            creative_direction: { type: Type.STRING },
            ethics: { type: Type.STRING },
            brand_architecture: { type: Type.STRING },
            five_pillars: { type: Type.STRING },
            competitive_benchmark: { type: Type.STRING },
            guest_experience: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Error generating strategy:", error);
    throw error;
  }
};

export const analyzeBrandText = async (inputs: InputSource[]): Promise<{
  brand: Omit<Brand, 'id'>;
  identity: {
    image_style: string;
    video_style: string;
    do_nots: string;
    color_primary_hex?: string;
    color_secondary_hex?: string;
    color_accent_hex?: string;
    font_heading?: string;
    font_body?: string;
    logo_rules?: string;
  };
}> => {
  const instructions = `
    Analyze the following brand document(s) and extract the core brand attributes AND visual identity details into a structured format.
    
    IMPORTANT INSTRUCTIONS:
    1. **Brand Extraction**:
       - Name: Extract the brand name.
       - Tagline: Extract "Essence" or "Tagline".
       - Niche: Infer the industry/category.
       - What You Sell: Summarize products/services.
       - Values: Extract "Brand Values" list.
       - Personality: Extract "Archetype" or personality adjectives.
    
    2. **Identity Extraction**:
       - Look specifically for **Hex Codes** (e.g., #F4EDE5). If found:
         - Assign the most neutral/background color to 'color_primary_hex'.
         - Assign secondary/earthy colors to 'color_secondary_hex'.
         - Assign vibrant/accent colors to 'color_accent_hex'.
       - Look for **Font Names** (e.g., Cormorant Garamond, Inter).
       - Extract visual rules.
    
    Return a JSON object containing a "brand" object and an "identity" object.
  `;

  const contents = [
    { text: instructions },
    ...inputs.map(input => {
      if (typeof input === 'string') {
        return { text: `BRAND DOCUMENT CONTENT:\n${input}` };
      } else {
        return { inlineData: input };
      }
    })
  ];

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          brand: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              tagline: { type: Type.STRING },
              niche: { type: Type.STRING },
              what_you_sell: { type: Type.STRING },
              who_you_help: { type: Type.STRING },
              transformation: { type: Type.STRING },
              difference: { type: Type.STRING },
              emotions: { type: Type.STRING },
              values: { type: Type.STRING },
              personality: { type: Type.STRING },
            }
          },
          identity: {
            type: Type.OBJECT,
            properties: {
              image_style: { type: Type.STRING },
              video_style: { type: Type.STRING },
              do_nots: { type: Type.STRING },
              color_primary_hex: { type: Type.STRING },
              color_secondary_hex: { type: Type.STRING },
              color_accent_hex: { type: Type.STRING },
              font_heading: { type: Type.STRING },
              font_body: { type: Type.STRING },
              logo_rules: { type: Type.STRING },
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const regenerateStrategySection = async (
  brand: Brand,
  sectionType: StrategySectionType,
  currentContent: string,
  instruction: string = "Improve and refine this."
): Promise<string> => {
  const prompt = `
    Context: You are a brand strategist for "${brand.name}".
    Brand Personality: ${brand.personality}.
    
    Task: Rewrite the "${sectionType}" section.
    Current Content: "${currentContent}"
    
    Instruction: ${instruction}
    
    Return ONLY the new content text.
  `;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
  });

  return response.text || "";
};

export const generateMoodboardPrompts = async (brand: Brand, identityDescription: string): Promise<string[]> => {
  const prompt = `
    Create 5 distinct, high-quality AI image generation prompts for a brand moodboard.
    Brand: ${brand.name}
    Style: ${identityDescription}
    Return JSON: { "prompts": ["string", ...] }
  `;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const data = JSON.parse(response.text || "{\"prompts\": []}");
  return data.prompts;
};

export const generateVisualRules = async (brand: Brand): Promise<{ dos: string, donts: string }> => {
  const prompt = `
      Based on the brand "${brand.name}" (Personality: ${brand.personality}), generate Visual Do's and Don'ts.
      Return JSON: { "dos": "string (bullet points)", "donts": "string (bullet points)" }
    `;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
}

export const generateContentIdeas = async (
  brand: Brand,
  pillarName: string,
  platform: string,
  count: number = 5
): Promise<Array<{ hook: string; outline: string }>> => {
  const prompt = `
    Generate ${count} content ideas for "${brand.name}" about "${pillarName}" for ${platform}.
    Return JSON: { "ideas": [{ "hook": "string", "outline": "string" }] }
  `;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const data = JSON.parse(response.text || "{\"ideas\": []}");
  return data.ideas;
};

export const generateCreativeCopy = async (
  brand: Brand,
  platform: string,
  format: string,
  brief: { objective: string; target_audience: string; key_message: string; visual_tone: string }
): Promise<string> => {
  const prompt = `
    Act as a social media copywriter for the brand "${brand.name}".
    Brand Voice: ${brand.personality}.
    
    Task: Write a single caption/script for ${platform} ${format}.
    
    Brief:
    - Objective: ${brief.objective}
    - Target Audience: ${brief.target_audience}
    - Key Message: ${brief.key_message}
    - Visual Context: ${brief.visual_tone}
    
    Return ONLY the raw text of the caption/script (no "Here is the caption" preamble). Include relevant hashtags.
  `;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
  });

  return response.text || "";
};

// --- MARKETING PLAN ENGINE ---

export const analyzeMarketingPlan = async (text: string): Promise<{ goal: string, budget: string, duration: string, focus: string }> => {
  const prompt = `
      You are a Marketing Strategy Expert. Analyze the following text (which might be a rough plan, notes, or a ChatGPT export).
      
      Extract the following 4 parameters. If specific details are missing, INFER them based on the context or standard industry practices for the described business type.
      
      TEXT TO ANALYZE:
      "${text.substring(0, 15000)}"
      
      Return ONLY a raw JSON object (no markdown formatting, no code blocks) with the following keys:
      { 
        "goal": "string (The primary objective e.g. Brand Awareness, Sales)",
        "budget": "string (Monetary value e.g. $5000, or 'TBD')",
        "duration": "string (Timeframe e.g. 90 Days, Q1)",
        "focus": "string (Main channel or tactic e.g. Social Media, SEO)"
      }
    `;

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Extraction failed", e);
    // Fallback to prevent UI crash
    return { goal: "Growth", budget: "TBD", duration: "90 Days", focus: "General" };
  }
};

export const generateMarketingPlan = async (brand: Brand, inputs: { goal: string, budget: string, duration: string, focus: string }): Promise<string> => {
  const prompt = `
      Act as a CMO. Create a detailed, actionable marketing plan for the brand "${brand.name}".
      
      Brand Context:
      - Niche: ${brand.niche}
      - Value Prop: ${brand.transformation}
      - Personality: ${brand.personality}
      
      Campaign Parameters:
      - Goal: ${inputs.goal}
      - Budget: ${inputs.budget}
      - Duration: ${inputs.duration}
      - Primary Focus: ${inputs.focus}
      
      Output Format: Markdown.
      Structure:
      # [Campaign Title]
      ## Executive Summary
      ## Phase 1: Activation (Weeks 1-4)
      - Key Actions
      - Content Strategy
      ## Phase 2: Engagement (Weeks 5-8)
      - Key Actions
      - Community Building
      ## Phase 3: Conversion (Weeks 9-12)
      - Sales Push
      - Retargeting
      ## Channel Strategy: ${inputs.focus}
      ## Budget Allocation
      ## KPIs to Track
      
      Keep it professional, strategic, and specific to the brand's niche.
    `;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt
  });

  return response.text || "Failed to generate plan.";
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'root' | 'phase' | 'task';
  time?: string;
  parentId?: string;
  x?: number; // Optional for manual adjustment
  y?: number;
}

export const generateMindMapFromText = async (text: string): Promise<MindMapNode[]> => {
  const prompt = `
        Analyze the following Marketing Strategy Text and convert it into a hierarchical mind map structure.
        
        TEXT:
        ${text.substring(0, 10000)}
        
        INSTRUCTIONS:
        1. Identify the Main Goal as the 'root' node.
        2. Identify specific Phases (e.g. Phase 1, Week 1) as 'phase' nodes connected to root.
        3. Identify specific Actions/Tasks within phases as 'task' nodes.
        4. If a task has a specific time mentioned (e.g. "Week 1", "Day 5"), extract it into the 'time' field.
        
        Return JSON format:
        {
            "nodes": [
                { "id": "1", "label": "Main Campaign Goal", "type": "root" },
                { "id": "2", "label": "Phase 1: Awareness", "type": "phase", "parentId": "1", "time": "Weeks 1-2" },
                { "id": "3", "label": "Post on Instagram", "type": "task", "parentId": "2", "time": "Daily" }
            ]
        }
    `;

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{\"nodes\": []}");
    return data.nodes;
  } catch (e) {
    console.error("Mind map generation failed", e);
    return [];
  }
};

export interface ActionItem {
  id: string;
  task: string;
  role: 'Manager' | 'Copywriter' | 'Designer' | 'Developer' | 'Analyst';
  phase: string;
  timeline: string;
  status: 'Pending' | 'In Progress' | 'Done';
}

export const generateActionPlan = async (strategyText: string): Promise<ActionItem[]> => {
  const prompt = `
        Analyze this marketing strategy and break it down into a list of specific, actionable tasks for a team.
        
        STRATEGY TEXT:
        ${strategyText.substring(0, 10000)}
        
        INSTRUCTIONS:
        1. Extract clear tasks (e.g., "Draft email sequence", "Design social ads").
        2. Assign a role (Manager, Copywriter, Designer, Developer, Analyst).
        3. Identify the phase or timeline based on the text.
        
        Return JSON:
        {
            "tasks": [
                { "task": "Task description", "role": "Role", "phase": "Phase 1", "timeline": "Week 1" }
            ]
        }
    `;

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{\"tasks\": []}");
    return data.tasks.map((t: any) => ({
      id: crypto.randomUUID(),
      task: t.task,
      role: t.role,
      phase: t.phase,
      timeline: t.timeline,
      status: 'Pending'
    }));
  } catch (e) {
    return [];
  }
};

// --- NEW: CAMPAIGN VISUAL GENERATOR ---
export const generateCampaignVisual = async (brand: Brand, planContext: string, phase: string): Promise<string> => {
  // 1. Generate Prompt first
  const promptGen = `
      Based on the brand "${brand.name}" (Style: ${brand.emotions}) and the following marketing plan context, create a high-quality AI image prompt for the "${phase}".
      
      PLAN CONTEXT: ${planContext.substring(0, 500)}...
      
      Return ONLY the image prompt string describing the visual.
    `;

  const promptResponse = await ai.models.generateContent({
    model: modelFlash,
    contents: promptGen
  });

  const imagePrompt = promptResponse.text || `High quality marketing image for ${brand.name}`;

  // 2. Generate Image
  // 2. Generate Image
  try {
    const response = await ai.models.generateContent({
      model: modelImage,
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    const firstCandidate = response.candidates?.[0];
    if (firstCandidate?.content?.parts) {
      for (const part of firstCandidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return "";
  } catch (error) {
    console.error("Image generation failed", error);
    return "";
  }
};

/**
 * MOCK: Search for Instagram users
 */
export async function searchInstagramUsers(query: string) {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));
  const q = query.toLowerCase();

  // Mock database
  const mockUsers = [
    { handle: 'nike', name: 'Nike', bio: 'Just Do It', avatar: 'https://ui-avatars.com/api/?name=Nike&background=000&color=fff' },
    { handle: 'adidas', name: 'adidas', bio: 'Impossible is Nothing', avatar: 'https://ui-avatars.com/api/?name=Adidas&background=000&color=fff' },
    { handle: 'chanel', name: 'CHANEL', bio: 'House of Chanel', avatar: 'https://ui-avatars.com/api/?name=Chanel&background=000&color=fff' },
    { handle: 'gucci', name: 'GUCCI', bio: 'The House of Gucci', avatar: 'https://ui-avatars.com/api/?name=Gucci&background=000&color=fff' },
    { handle: 'fourseasons', name: 'Four Seasons', bio: 'Luxury Hospitality', avatar: 'https://ui-avatars.com/api/?name=FS&background=000&color=fff' },
    { handle: 'ritzcarlton', name: 'The Ritz-Carlton', bio: 'Gold Standards', avatar: 'https://ui-avatars.com/api/?name=RC&background=000&color=fff' },
    { handle: 'aman', name: 'Aman', bio: 'Peace & Restoration', avatar: 'https://ui-avatars.com/api/?name=Aman&background=000&color=fff' },
    { handle: 'competitor_a', name: 'Competitor A', bio: 'Generic Competitor', avatar: 'https://ui-avatars.com/api/?name=CA&background=000&color=fff' },

  ];

  return mockUsers.filter(u => u.handle.includes(q) || u.name.toLowerCase().includes(q));
}
