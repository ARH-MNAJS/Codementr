import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { Milestone } from '@/types/db';

// Initialize Google Generative AI with your API key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, message, messageHistory } = body;
    
    // Debug logging
    console.log("API Request Body:", { 
      projectId, 
      messageLength: message?.length, 
      historyLength: messageHistory?.length 
    });

    // Validate required fields
    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and message are required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    try {
      // Fetch project data from the database
      const projectsCollection = await getCollection('projects');
      const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Fetch the user data if possible
      const usersCollection = await getCollection('users');
      let userData = null;
      if (project.userId) {
        userData = await usersCollection.findOne({ _id: new ObjectId(project.userId) });
      }

      // Fetch commit data if available
      const commitsCollection = await getCollection('commits');
      const commitData = await commitsCollection.find({ projectId: project._id.toString() }).toArray();

      // Call the Gemini model - simplified approach without history
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      console.log("Using Gemini directly without chat history...");
      
      // Extract comprehensive milestone information including technical details
      let milestonesInfo = "";
      const technicalTerms = new Set<string>();
      const fileTypes = new Set<string>();
      
      if (project.milestones && Array.isArray(project.milestones)) {
        milestonesInfo = project.milestones.map((m: Milestone, index: number) => {
          // Check if this milestone is completed
          const isCompleted = m.completed || false;
          const milestoneStatus = isCompleted ? "COMPLETED" : (index === 0 || (index > 0 && project.milestones[index-1].completed) ? "ACTIVE" : "PENDING");
          
          // Extract file extensions to understand technical stack
          if (m.expectedFiles && Array.isArray(m.expectedFiles)) {
            m.expectedFiles.forEach((file: string) => {
              const fileExt = file.split('.').pop()?.toLowerCase();
              if (fileExt) {
                fileTypes.add(fileExt);
                // Map file extensions to technologies
                if (fileExt === 'html') technicalTerms.add('HTML');
                if (fileExt === 'css') technicalTerms.add('CSS');
                if (fileExt === 'js') technicalTerms.add('JavaScript');
                if (fileExt === 'jsx' || fileExt === 'tsx') technicalTerms.add('React');
                if (fileExt === 'ts' || fileExt === 'tsx') technicalTerms.add('TypeScript');
                if (fileExt === 'py') technicalTerms.add('Python');
                if (fileExt === 'java') technicalTerms.add('Java');
              }
            });
          }
          
          // Extract goals
          let goalsList = "";
          if (m.goals) {
            if (Array.isArray(m.goals)) {
              goalsList = m.goals.join(", ");
            } else if (typeof m.goals === 'string') {
              goalsList = m.goals;
            }
          }

          // Get completed goals
          const completedGoals = m.completedGoals || [];
          const completedGoalsInfo = completedGoals.length > 0 
            ? `Completed Goals: ${completedGoals.join(", ")}` 
            : "No goals completed yet";
          
          // Build milestone info with all available details
          return `- ${m.title || "Untitled milestone"}: ${m.description || "No description"}
  Status: ${milestoneStatus}
  Commit Title: ${m.commitTitle || "No commit title"}
  ${goalsList ? `Goals: ${goalsList}` : ""}
  ${completedGoals.length > 0 ? completedGoalsInfo : ""}
  ${m.expectedFiles && m.expectedFiles.length > 0 ? `Files to Modify: ${m.expectedFiles.join(", ")}` : ""}`;
        }).join("\n\n");
      }
      
      // Determine project's technology stack
      const techStack = Array.from(technicalTerms).join(", ");
      const fileExtensions = Array.from(fileTypes).join(", ");
      
      // Create a comprehensive project context
      const projectStatusInfo = `
Project Title: ${project.title}
Description: ${project.description || "No description available"}
${project.context ? `Additional Context: ${project.context}` : ""}

Project Status: ${project.status || "Not specified"}
Overall Progress: ${project.progress ? `${project.progress}%` : "Not tracked"}
${project.startDate ? `Start Date: ${new Date(project.startDate).toLocaleDateString()}` : ""}
${project.dueDate ? `Due Date: ${new Date(project.dueDate).toLocaleDateString()}` : ""}

${techStack ? `Technologies: ${techStack}` : ""}
${fileExtensions ? `File Types: ${fileExtensions}` : ""}
${project.connectedRepo ? `Connected Repository: ${project.connectedRepo}` : "No repository connected"}

Latest Commit: ${commitData && commitData.length > 0 ? commitData[0].title : "No commits yet"}
Total Commits: ${commitData ? commitData.length : 0}

User: ${userData ? userData.name || userData.email : "Unknown"}
${userData && userData.github ? `GitHub Username: ${userData.github.username}` : ""}
`;

      // First, let's use a more technically-aware relevance check that includes this extended context
      const relevanceCheckPrompt = `
You are an assistant that determines if questions are relevant to this specific coding project.

PROJECT INFORMATION:
${projectStatusInfo}

${milestonesInfo ? `MILESTONES:\n${milestonesInfo}` : ""}

User Question: "${message}"

IMPORTANT GUIDELINES FOR RELEVANCE:
1. Questions about programming languages, technologies, or file types used in this project ARE relevant
2. Questions about general coding concepts that apply to this project ARE relevant
3. Questions about web development basics (like HTML, CSS, JavaScript) ARE relevant if this is a web project
4. Questions about development tools likely to be used in this project ARE relevant
5. Questions about the project status, progress, milestones, or deadlines ARE relevant
6. Only questions completely unrelated to software development or this project are NOT relevant

Based on these criteria, is this question clearly relevant to this specific project? Answer with ONLY "yes" or "no".
`;

      // Make a quick relevance check
      const relevanceCheck = await model.generateContent(relevanceCheckPrompt);
      const relevanceResponse = relevanceCheck.response.text().toLowerCase().trim();
      console.log("Relevance check result:", relevanceResponse);
      
      // If the question is not relevant, respond accordingly
      if (relevanceResponse === "no") {
        return NextResponse.json({
          response: "I'm sorry, but I can only answer questions related to this specific project. Please ask me about something directly related to the project's features, requirements, or implementation details."
        });
      }
      
      // If relevant, create a full prompt with the project context
      const prompt = `
You are an AI assistant for a specific coding project with complete knowledge of all project details.

PROJECT DETAILS:
${projectStatusInfo}

${milestonesInfo ? `DETAILED MILESTONES:\n${milestonesInfo}` : ""}

USER QUESTION: ${message}

CRITICAL RESPONSE GUIDELINES:
1. Keep responses BRIEF and CONCISE (1-3 paragraphs maximum)
2. You should reference specific details from the project when answering status-related questions
3. Mention milestone names, completion status, and due dates when relevant
4. You SHOULD explain HTML, CSS, JavaScript and other project-related technologies 
5. When discussing code:
   - DO provide property names, values, attributes, or tags that would help
   - DO provide 1-2 lines of example code if absolutely necessary
   - DO NOT provide complete solutions (more than 5 lines of code)
6. For questions about project status, be accurate and specific about which milestones are completed
7. For any question completely unrelated to this project, respond with: "I'm sorry, but I can only answer questions related to this project."

Provide a helpful response based on the specific project details available.
`;
      
      console.log("Sending message to Gemini...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      console.log("Received response from Gemini", { length: responseText.length });
      
      // Limit the length of the response
      const maxResponseLength = 800; // About 4-5 short paragraphs
      let finalResponse = responseText;
      
      if (finalResponse.length > maxResponseLength) {
        const sentences = finalResponse.split(/(?<=[.!?])\s+/);
        let shortenedResponse = "";
        for (const sentence of sentences) {
          if ((shortenedResponse + sentence).length <= maxResponseLength) {
            shortenedResponse += sentence + " ";
          } else {
            break;
          }
        }
        finalResponse = shortenedResponse.trim();
      }
      
      // Check if response contains extensive code snippets
      if (finalResponse.includes('```') && finalResponse.split('```').length > 3) {
        // If multiple code blocks detected, simplify
        const parts = finalResponse.split('```');
        // Keep only the first code example and surrounding text
        finalResponse = parts[0] + '```' + parts[1] + '```' + " (I've provided just one example for clarity.)";
      }
  
      return NextResponse.json({ response: finalResponse });
    } catch (error) {
      console.error("Error from Gemini API:", error);
      return NextResponse.json(
        { 
          error: 'Error from AI provider',
          message: error instanceof Error ? error.message : "Unknown error from Gemini API"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating chat response:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to generate chat response',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 