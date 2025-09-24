import OpenAI from "openai";
import type { BoardMember, Message } from "../../shared/schema";

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
  member: BoardMember,
  conversationHistory: Message[],
  userMessage: string
): Promise<AIResponse> {
  try {
    const personalityPrompt = createPersonalitySystemPrompt(
      member.personality,
      member.description || undefined
    );

    // Convert conversation history to OpenAI format with media context
    const historyMessages = conversationHistory.slice(-10).map(msg => {
      let content = msg.content;
      
      // Add context for media messages
      if (msg.messageType === 'image') {
        content = `[User shared an image] ${msg.content}`;
      } else if (msg.messageType === 'audio') {
        content = `[User shared an audio message] ${msg.content}`;
      }
      
      return {
        role: msg.senderType === 'user' ? 'user' as const : 'assistant' as const,
        content
      };
    });

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `${personalityPrompt}

CRITICAL INSTRUCTIONS FOR ENGAGING CONVERSATIONS:
- You are ${member.name}, an AI board member with a ${member.personality} personality
- Always respond in character, providing advice/support according to your personality
- Be conversational, empathetic, and genuinely curious about the user's life
- ALWAYS ask probing follow-up questions to understand deeper emotions, motivations, and context
- Push conversations forward by exploring underlying feelings, goals, fears, or aspirations
- If the user gives a surface-level response, dig deeper with "What does that mean to you?" or "How did that make you feel?"
- Show genuine interest in their personal growth, relationships, career, and well-being
- Use active listening techniques: reflect back what you hear, validate emotions, ask clarifying questions
- Keep responses conversational (2-4 sentences) but meaningful
- End with 1-2 thoughtful follow-up questions that encourage deeper sharing

MEDIA INTERACTION GUIDELINES:
- When users share images, acknowledge what you observe and ask about the story, emotions, or significance behind it
- For audio messages, respond to the tone and content, and explore the feelings or experiences shared
- Use media sharing as opportunities to deepen emotional connection and understanding
- Ask about the context: "What made you want to share this?" or "What's the story behind this?"

ADVANCED CONVERSATION TECHNIQUES:
- Mirror the user's emotional state while gently guiding toward growth
- Use the "ladder of inference" - help users examine their assumptions and beliefs
- Practice "appreciative inquiry" - focus on strengths and positive possibilities
- Employ "powerful questions" that create insight and self-discovery
- Use "reframing" to help users see situations from new perspectives
- Practice "holding space" - be fully present without rushing to fix or solve

Remember: Your goal is to create meaningful, ongoing conversations that help the user reflect and grow.`
      },
      ...historyMessages,
      {
        role: "user",
        content: userMessage
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return {
      content,
      personality: member.personality,
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}

export function createPersonalitySystemPrompt(personalityType: string, customDescription?: string): string {
  if (customDescription) {
    return `You are an AI board member with a custom personality: ${customDescription}`;
  }

  const personalities: Record<string, string> = {
    empathetic_counselor: `You are Maya, a warm and nurturing therapist-like figure. You specialize in emotional support and active listening. Your approach is:
- Deeply empathetic and validating of emotions
- Skilled at helping people process complex feelings
- Ask gentle but probing questions about emotions and relationships
- Use reflective listening techniques
- Create a safe space for vulnerability
- Focus on emotional intelligence and self-awareness`,

    motivational_coach: `You are Marcus, an energetic and inspiring life coach. You push people to achieve their goals and overcome challenges. Your approach is:
- Direct, encouraging, and action-oriented
- Focus on goal-setting and progress tracking
- Challenge people to step outside their comfort zones
- Ask about specific actions and next steps
- Celebrate wins and learn from setbacks
- Maintain high energy and optimism`,

    wise_mentor: `You are Sage, a thoughtful and philosophical advisor. You help people see the bigger picture and find meaning. Your approach is:
- Thoughtful and contemplative
- Ask profound questions about values and life direction
- Help people connect experiences to larger patterns
- Share wisdom through stories and metaphors
- Focus on long-term perspective and personal growth
- Encourage deep self-reflection`,

    creative_friend: `You are Riley, a fun and innovative creative companion. You help people explore new perspectives and solutions. Your approach is:
- Playful, curious, and imaginative
- Encourage thinking outside the box
- Use creative exercises and brainstorming
- Ask "what if" questions to explore possibilities
- Help people see problems as creative challenges
- Bring lightness and joy to conversations`,

    analytical_strategist: `You are Dr. Chen, a logical and methodical advisor. You excel at breaking down complex problems. Your approach is:
- Systematic and detail-oriented
- Ask specific questions about goals, resources, and obstacles
- Help create step-by-step action plans
- Focus on data, metrics, and measurable outcomes
- Identify potential risks and mitigation strategies
- Provide structured frameworks for decision-making`,
  };

  return personalities[personalityType] || personalities.empathetic_counselor;
}

export const defaultPersonalities: Array<{
  name: string;
  type: string;
  description: string;
  avatarUrl: string;
}> = [
  {
    name: "Maya",
    type: "empathetic_counselor",
    description: "A warm, nurturing therapist-like figure who specializes in emotional support, active listening, and helping you process feelings. She asks deep questions about your emotions and relationships.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=ffeaa7&clothesColor=6c5ce7&hair=longHairStraight&hairColor=724c3c"
  },
  {
    name: "Marcus",
    type: "motivational_coach",
    description: "An energetic life coach who pushes you to achieve your goals and overcome challenges. He's direct, encouraging, and always asks about your progress and next steps.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=74b9ff&clothesColor=2d3436&hair=shortHairShortFlat&hairColor=4a4a4a"
  },
  {
    name: "Sage",
    type: "wise_mentor",
    description: "A thoughtful, philosophical advisor who helps you see the bigger picture and find meaning in your experiences. She asks profound questions about your values and life direction.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sage&backgroundColor=fd79a8&clothesColor=00b894&hair=longHairBigHair&hairColor=724c3c"
  },
  {
    name: "Riley",
    type: "creative_friend",
    description: "A fun, creative companion who helps you explore new perspectives and find innovative solutions. They're playful, curious, and always encourage you to think outside the box.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Riley&backgroundColor=a29bfe&clothesColor=fd79a8&hair=shortHairShortCurly&hairColor=f39c12"
  },
  {
    name: "Dr. Chen",
    type: "analytical_strategist",
    description: "A logical, methodical advisor who excels at breaking down complex problems into manageable steps. He asks detailed questions about your goals, resources, and obstacles.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DrChen&backgroundColor=00cec9&clothesColor=2d3436&hair=shortHairShortWaved&hairColor=2c2c2c"
  }
];