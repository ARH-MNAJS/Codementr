import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Milestone, Project } from "@/types/db";

// Initialize Google Generative AI with your API key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

interface GithubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  raw_url: string;
  patch?: string;
}

interface CommitAnalysisResponse {
  overallAssessment: string;
  goalsAchieved: Array<{
    goal: string;
    achieved: boolean;
    explanation: string;
  }>;
  metrics: {
    goalAlignment: number;
    securityRisk: number;
    codeQuality: number;
    commitClarity: number;
  };
  suggestions: string[];
  shouldComplete: boolean;
  confidenceScore: number;
  description: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== COMMIT ANALYSIS DEBUG START ===");
    console.log("Project ID:", params.id);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get request parameters
    const { milestoneTitle, commitSha } = await req.json();
    
    if (!milestoneTitle || !commitSha) {
      console.log("Missing required parameters");
      return NextResponse.json({ error: "Missing required parameters: milestoneTitle and commitSha" }, { status: 400 });
    }
    
    // Check valid id
    if (!ObjectId.isValid(params.id)) {
      console.log("Invalid project ID format");
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }
    
    // Get the project
    const projectsCollection = await getCollection('projects');
    const project = await projectsCollection.findOne({ _id: new ObjectId(params.id) }) as Project | null;
    
    if (!project) {
      console.log("Project not found");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    // Get the user to access their GitHub info
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    
    // Get GitHub owner and repo
    const owner = user?.github?.owner || "ARH-MNAJS"; // Fallback to the correct owner name
    const repoName = project.connectedRepo;
    
    if (!owner || !repoName) {
      console.log("Missing GitHub owner or repository name");
      return NextResponse.json({ error: "Missing GitHub owner or repository information" }, { status: 400 });
    }
    
    // Find the milestone
    const milestoneIndex = project.milestones.findIndex(
      (m: Milestone) => m.title === milestoneTitle
    );
    
    if (milestoneIndex === -1) {
      console.log("Milestone not found");
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    
    const milestone = project.milestones[milestoneIndex];
    
    // Fetch commit details from GitHub API
    const commitUrl = `https://api.github.com/repos/${owner}/${repoName}/commits/${commitSha}`;
    console.log("Fetching commit details from:", commitUrl);
    
    const response = await fetch(commitUrl, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return NextResponse.json({ 
        error: "Failed to fetch commit details from GitHub", 
        details: errorText 
      }, { status: 500 });
    }
    
    const commitData = await response.json();
    
    // Extract files information
    const filesInfo = commitData.files.map((file: GithubFile) => ({
      filename: file.filename,
      status: file.status, // 'added', 'modified', or 'removed'
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      raw_url: file.raw_url,
      patch: file.patch, // shows the actual diff
    }));
    
    console.log(`Fetched details for ${filesInfo.length} files in commit`);
    
    // Parse milestone goals
    let goals: string[] = [];
    try {
      if (Array.isArray(milestone.goals)) {
        goals = milestone.goals;
      } else if (typeof milestone.goals === 'string') {
        goals = milestone.goals.split(',').map(g => g.trim()).filter(Boolean);
      }
    } catch (error) {
      console.error("Error parsing goals:", error);
    }
    
    // Generate AI analysis
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Build the analysis prompt
      const prompt = `
You are a code mentor analyzing a student's commit for a coding project milestone. Your task is to evaluate whether the commit
successfully implemented the requirements and meets the goals.

PROJECT MILESTONE INFORMATION:
- Milestone Title: ${milestone.title}
- Expected Commit: "${milestone.commitTitle}"
- Description: ${milestone.description || "N/A"}

GOALS TO ACHIEVE:
${goals.map(g => `- ${g}`).join('\n')}

FILES THAT SHOULD BE MODIFIED:
${milestone.expectedFiles?.map(f => `- ${f}`).join('\n') || "No specific files required"}

ACTUAL COMMIT DETAILS:
- Commit SHA: ${commitSha}
- Commit Message: "${commitData.commit.message}"
- Author: ${commitData.commit.author.name}
- Date: ${commitData.commit.author.date}

FILES MODIFIED IN THIS COMMIT:
${filesInfo.map(file => `
- Filename: ${file.filename}
- Status: ${file.status}
- Changes: ${file.additions} additions, ${file.deletions} deletions
${file.patch ? `- Diff:\n\`\`\`\n${file.patch}\n\`\`\`` : ""}
`).join('\n')}

ANALYSIS TASKS:
1. Evaluate if the commit successfully implements each goal listed above
2. For each goal, provide a YES or NO if it was achieved, followed by a brief explanation
3. Score the commit on the following metrics (0-100 scale):
   - Goal alignment: How well does the commit align with the milestone goals?
   - Security risk: How secure is the code? (0 = high risk, 100 = no risk)
   - Code quality: How well-structured and maintainable is the code?
   - Commit clarity: How clear is the commit message and changes?
4. Provide 1-2 specific suggestions for improvement if applicable
5. Give an overall assessment of whether the milestone should be marked as completed based on this commit
6. Provide a confidence score (0-100) for your assessment

FORMAT YOUR RESPONSE USING THE FOLLOWING JSON STRUCTURE:
\`\`\`json
{
  "overallAssessment": "Brief overall assessment of the commit (1-2 sentences)",
  "goalsAchieved": [
    {
      "goal": "Goal text here",
      "achieved": true/false,
      "explanation": "Brief explanation"
    }
  ],
  "metrics": {
    "goalAlignment": 85,
    "securityRisk": 70,
    "codeQuality": 80,
    "commitClarity": 75
  },
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "shouldComplete": true/false,
  "confidenceScore": 90,
  "description": "Detailed description of what the commit did and how it relates to the milestone goals (2-3 paragraphs)"
}
\`\`\`

IMPORTANT: Ensure your response is valid JSON and follows this exact structure.
`;
      
      console.log("Sending analysis request to AI");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse the AI response
      let aiAnalysis: CommitAnalysisResponse;
      try {
        // Extract the JSON content from the response
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          responseText.match(/```([\s\S]*?)```/) ||
                          [null, responseText];
                          
        const jsonStr = jsonMatch[1].trim();
        aiAnalysis = JSON.parse(jsonStr);
      } catch (error) {
        console.error("Failed to parse AI response:", error);
        console.log("Raw AI response:", responseText);
        
        // Return a default structure with error information
        aiAnalysis = {
          overallAssessment: "Error: Could not analyze commit properly.",
          goalsAchieved: goals.map(goal => ({
            goal,
            achieved: false,
            explanation: "Could not determine due to parsing error."
          })),
          metrics: {
            goalAlignment: 0,
            securityRisk: 50,
            codeQuality: 0,
            commitClarity: 0
          },
          suggestions: ["Try again with a more specific commit."],
          shouldComplete: false,
          confidenceScore: 0,
          description: "An error occurred while trying to analyze this commit. The AI response could not be parsed correctly."
        };
      }
      
      // Update the milestone based on the AI analysis
      const updatedMilestones = [...project.milestones];
      
      // If AI thinks the milestone is complete with high confidence, mark it as completed
      if (aiAnalysis.shouldComplete && aiAnalysis.confidenceScore >= 70) {
        updatedMilestones[milestoneIndex].completed = true;
        
        // Mark the achieved goals
        const completedGoals = aiAnalysis.goalsAchieved
          .filter(g => g.achieved)
          .map(g => g.goal);
          
        updatedMilestones[milestoneIndex].completedGoals = completedGoals;
      }
      
      // Save the update
      await projectsCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { milestones: updatedMilestones } }
      );
      
      // Return the analysis results
      return NextResponse.json({
        success: true,
        analysis: aiAnalysis,
        milestoneCompleted: updatedMilestones[milestoneIndex].completed
      });
      
    } catch (error) {
      console.error("AI analysis error:", error);
      if (error instanceof Error) {
        return NextResponse.json({ error: `AI analysis failed: ${error.message}` }, { status: 500 });
      } else {
        return NextResponse.json({ error: "AI analysis failed with unknown error" }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error("Commit analysis error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
} 