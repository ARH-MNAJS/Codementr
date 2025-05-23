import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

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
    const project = await projectsCollection.findOne({ _id: new ObjectId(params.id) });
    
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
      (m: any) => m.title === milestoneTitle
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
    const filesInfo = commitData.files.map((file: any) => ({
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
      
      // Extract JSON from response
      let analysis;
      try {
        // Find JSON between triple backticks if present
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                         responseText.match(/```\n([\s\S]*?)\n```/) ||
                         [null, responseText];
                         
        const jsonString = jsonMatch[1];
        analysis = JSON.parse(jsonString);
        
        console.log("Successfully parsed AI analysis");
        
        // Update milestone status and goals if AI suggests completion
        if (analysis.shouldComplete) {
          console.log("AI suggests completing the milestone");
          
          // Mark applicable goals as completed
          const completedGoals = [
            ...(milestone.completedGoals || [])
          ];
          
          // Add goals that AI identified as achieved
          analysis.goalsAchieved.forEach((goalResult: any) => {
            if (goalResult.achieved && !completedGoals.includes(goalResult.goal)) {
              completedGoals.push(goalResult.goal);
            }
          });
          
          // Calculate if all goals are completed
          const allGoalsCompleted = goals.length > 0 && 
            goals.every(g => completedGoals.includes(g));
            
          // Update the milestone in the database
          await projectsCollection.updateOne(
            { _id: new ObjectId(params.id) },
            { 
              $set: { 
                [`milestones.${milestoneIndex}.completed`]: allGoalsCompleted,
                [`milestones.${milestoneIndex}.completedGoals`]: completedGoals
              } 
            }
          );
          
          console.log(`Updated milestone: completed=${allGoalsCompleted}, completedGoals=[${completedGoals.join(', ')}]`);
        }
        
        // Store the analysis in the database
        const analysisCollection = await getCollection('commitAnalyses');
        await analysisCollection.insertOne({
          projectId: params.id,
          milestoneTitle,
          commitSha,
          analysis,
          createdAt: new Date()
        });
        
        console.log("Stored analysis in database");
        
        return NextResponse.json({ 
          analysis,
          commitDetails: {
            sha: commitSha,
            message: commitData.commit.message,
            author: commitData.commit.author.name,
            date: commitData.commit.author.date,
            filesChanged: filesInfo.length
          }
        });
        
      } catch (jsonError) {
        console.error("Failed to parse AI response as JSON:", jsonError);
        return NextResponse.json({ 
          error: "Failed to parse AI analysis",
          aiResponse: responseText 
        }, { status: 500 });
      }
      
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
      return NextResponse.json({ 
        error: "Failed to generate AI analysis", 
        details: aiError.message 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Error analyzing commit:", error);
    console.log("=== COMMIT ANALYSIS DEBUG END (ERROR) ===");
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 