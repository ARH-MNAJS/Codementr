import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your API key from environment variable
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
console.log("API Key configuration:", {
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  hasGoogleKey: !!process.env.GOOGLE_AI_API_KEY,
  usingFallback: !process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY
});

// Using fallback key if environment variables are not set
const genAI = new GoogleGenerativeAI(apiKey || 'AIzaSyAotNQr_AHgyrYGSBIgmZellnKBfJYTFnU');

// Helper function to add delay for retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate content with retry logic
async function generateContentWithRetry(prompt: string, maxRetries = 3) {
  // Start with gemini-1.5-flash (smaller, less capable model but has higher quota)
  let modelName = 'gemini-1.5-flash';
  let attempts = 0;
  let lastError: any = null;
  
  // Try different models with increasing backoff
  while (attempts < maxRetries) {
    try {
      console.log(`Attempt ${attempts + 1} using model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempts + 1} failed with model ${modelName}:`, error.message);
      
      // Check if it's a rate limit error (429)
      const isRateLimitError = error.message && error.message.includes('429 Too Many Requests');
      
      // If quota exceeded on first attempt with flash model, try the text model
      if (attempts === 0 && isRateLimitError && modelName === 'gemini-1.5-flash') {
        modelName = 'gemini-1.0-pro-latest';  // Try with text model
        await delay(1000); // Small delay before retry
      } else {
        // Otherwise use exponential backoff
        const backoffTime = Math.pow(2, attempts) * 1000; // 2^n seconds
        console.log(`Backing off for ${backoffTime}ms before retry ${attempts + 1}`);
        await delay(backoffTime);
        
        // If we've tried pro model and still hitting limits, try with a simpler model
        if (attempts > 0 && isRateLimitError && modelName !== 'gemini-1.0-pro-latest') {
          modelName = 'gemini-1.0-pro-latest';
        }
      }
      
      attempts++;
    }
  }
  
  // If all retries fail, throw the last error
  throw lastError || new Error("Failed to generate content after multiple attempts");
}

// GET endpoint to test API key and connectivity
export async function GET(req: NextRequest) {
  console.log("Testing API key connectivity");
  try {
    // Use the retry mechanism for testing
    const text = await generateContentWithRetry("Respond with 'API key is working correctly' if this request succeeds.", 2);
    
    return NextResponse.json({ 
      status: "success", 
      message: "API key is configured correctly", 
      response: text
    });
  } catch (error: any) {
    console.error("API key test failed:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "API key test failed", 
      error: error.message || "Unknown error" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("Received request to generate context");
  try {
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const {
      type, // 'project', 'milestone', or 'goal'
      projectTitle,
      projectDescription,
      repositoryName,
      milestoneTitle,
      milestoneCommitTitle,
      milestoneDescription,
      milestoneFiles,
      goal
    } = requestBody;

    // Validate required fields
    if (!type || !projectTitle) {
      console.error("Missing required fields:", { type, projectTitle });
      return NextResponse.json(
        { error: 'Missing required fields: type and projectTitle are required' },
        { status: 400 }
      );
    }

    let prompt: string;
    
    // Format the prompt based on the context type
    switch (type) {
      case 'project': 
        prompt = `
You are a code reviewer for the following project. Generate a concise context that will guide AI-based code review:

PROJECT TITLE: ${projectTitle}
PROJECT DESCRIPTION: ${projectDescription || "No description provided"}
REPOSITORY NAME: ${repositoryName || "No repository name provided"}

Create a brief, focused context that:
1. Explains exactly what this project is supposed to accomplish
2. Specifies what technical aspects should be evaluated during code review
3. Mentions key quality expectations (performance, readability, etc.)
4. Notes specific areas that need special attention

Be factual, precise, and limit your response to 2-3 sentences about each point. Avoid speculation or information not directly related to reviewing this codebase. Format as a single paragraph of 80-120 words.
`;
        break;
        
      case 'milestone':
        if (!milestoneTitle) {
          console.error("Missing required milestone title");
          return NextResponse.json(
            { error: 'Missing required field: milestoneTitle is required for milestone context' },
            { status: 400 }
          );
        }
        
        prompt = `
You are a code reviewer for the following project milestone. Generate a concise context for reviewing code at this stage:

PROJECT: ${projectTitle}
MILESTONE: ${milestoneTitle}
${milestoneCommitTitle ? `COMMIT: ${milestoneCommitTitle}` : ''}
${milestoneDescription ? `DETAILS: ${milestoneDescription}` : ''}
${milestoneFiles && milestoneFiles.length > 0 ? `FILES: ${milestoneFiles.join(', ')}` : ''}

Create a brief, focused review context (50-70 words) that:
1. Clarifies exactly what functionality should be working at this stage
2. Specifies technical requirements to verify
3. Lists potential issues to watch for

Be factual and precise. Avoid speculation. Focus only on what's directly relevant to reviewing this code. If the implementation is correct, the reviewer should state "All Good".
`;
        break;
        
      case 'goal':
        if (!goal) {
          console.error("Missing required goal");
          return NextResponse.json(
            { error: 'Missing required field: goal is required for goal context' },
            { status: 400 }
          );
        }
        
        prompt = `
You are a code reviewer examining a specific goal within a project. Generate a concise review context:

PROJECT: ${projectTitle}
MILESTONE: ${milestoneTitle || "Unknown milestone"}
GOAL: ${goal}

Create a brief, focused review guideline (30-50 words) that:
1. Explains precisely what this goal accomplishes
2. Lists specific implementation details to verify
3. Notes common issues to check for

Be factual and direct. Avoid speculation. Focus exclusively on reviewing code that implements this goal. If the code successfully implements the goal, the reviewer should state "All Good".
`;
        break;
        
      default:
        console.error("Invalid type provided:", type);
        return NextResponse.json(
          { error: 'Invalid type: type must be "project", "milestone", or "goal"' },
          { status: 400 }
        );
    }

    console.log("Generated prompt:", prompt);
    
    try {
      console.log("Generating content with retry mechanism");
      const text = await generateContentWithRetry(prompt, 3);
      console.log("Generated text length:", text.length);

      return NextResponse.json({ 
        context: text,
        type
      });
    } catch (aiError: any) {
      console.error("AI generation error after retries:", aiError);
      return NextResponse.json(
        { error: `AI model error: ${aiError.message || "Unknown AI error"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error generating context:', error);
    return NextResponse.json(
      { error: `Failed to generate context: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
} 