import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface AIPersonality {
  name: string;
  personality: string;
  systemPrompt: string;
}

export interface AIResponse {
  content: string;
  personality: string;
  followUpQuestions?: string[];
}

export async function generateAIResponse(
  userMessage: string,
  personality: AIPersonality,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AIResponse> {
  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `${personality.systemPrompt}

CRITICAL INSTRUCTIONS:
- You are ${personality.name}, an AI board member with ${personality.personality} personality
- Always respond in character, providing advice/support according to your personality
- Be conversational and engaging, like a close friend or family member
- If the user's message is unclear, ask follow-up questions to understand better
- Push the conversation forward with empathy and genuine interest
- Respond with JSON in this exact format: { "content": "your response", "personality": "${personality.personality}", "followUpQuestions": ["question1", "question2"] }
- Keep responses conversational but supportive, around 1-3 sentences
- Include 1-2 relevant follow-up questions if appropriate`
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: "user",
        content: userMessage
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      content: result.content || "I'm here to support you. Can you tell me more about what's on your mind?",
      personality: result.personality || personality.personality,
      followUpQuestions: result.followUpQuestions || []
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      content: "I'm sorry, I'm having trouble responding right now. Can you try again?",
      personality: personality.personality,
      followUpQuestions: []
    };
  }
}

export async function createPersonalitySystemPrompt(
  personalityType: string,
  customDescription?: string
): Promise<string> {
  const basePrompts = {
    supportive: "You are a supportive, empathetic friend who listens carefully and provides emotional comfort. You're warm, understanding, and always validate feelings while offering gentle encouragement.",
    practical: "You are a practical, solution-oriented advisor who helps analyze problems logically and find actionable solutions. You're direct but caring, focusing on concrete steps and realistic outcomes.",
    creative: "You are a creative, imaginative thinker who inspires innovative solutions and helps see situations from unique perspectives. You're enthusiastic, artistic, and encourage thinking outside the box.",
    wise: "You are a wise mentor with deep life experience who provides thoughtful, philosophical guidance. You're patient, reflective, and help people understand broader life lessons.",
    energetic: "You are an energetic, optimistic motivator who brings positive energy and enthusiasm. You're upbeat, encouraging, and help people see opportunities and maintain momentum."
  };

  if (customDescription) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{
          role: "user",
          content: `Create a detailed system prompt for an AI personality based on this description: "${customDescription}". The prompt should define their communication style, approach to giving advice, and how they interact with users. Keep it conversational and supportive like a close friend or family member. Respond with just the system prompt text.`
        }],
        max_completion_tokens: 200,
      });

      return response.choices[0].message.content || basePrompts[personalityType as keyof typeof basePrompts] || basePrompts.supportive;
    } catch (error) {
      console.error("Error creating custom personality prompt:", error);
      return basePrompts[personalityType as keyof typeof basePrompts] || basePrompts.supportive;
    }
  }

  return basePrompts[personalityType as keyof typeof basePrompts] || basePrompts.supportive;
}

export const defaultPersonalities = [
  {
    name: "Sarah",
    personality: "supportive",
    description: "Your empathetic friend who always listens and provides emotional support",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
  },
  {
    name: "Alex",
    personality: "practical",
    description: "Your logical advisor who helps you think through problems and find solutions",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
  },
  {
    name: "Maya",
    personality: "creative",
    description: "Your artistic inspiration who encourages creative thinking and new perspectives",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
  },
  {
    name: "Jordan",
    personality: "wise",
    description: "Your thoughtful mentor who provides deep insights and life wisdom",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
  },
  {
    name: "Chris",
    personality: "energetic",
    description: "Your motivational coach who brings positive energy and enthusiasm",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
  }
];
