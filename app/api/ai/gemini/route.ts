import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyAotNQr_AHgyrYGSBIgmZellnKBfJYTFnU');

export async function POST(req: NextRequest) {
  try {
    const {
      projectTitle,
      projectDescription,
      repository,
      milestone,
      commitTitle,
      goals,
      files
    } = await req.json();

    // Validate required fields
    if (!projectTitle || !milestone) {
      return NextResponse.json(
        { error: 'Missing required fields: projectTitle and milestone are required' },
        { status: 400 }
      );
    }

    // Format the prompt for the AI model
    const prompt = `
As a coding mentor, please provide guidance for the following project milestone:

PROJECT: ${projectTitle}
${projectDescription ? `DESCRIPTION: ${projectDescription}` : ''}
${repository ? `REPOSITORY: ${repository}` : ''}

MILESTONE: ${milestone}
${commitTitle ? `EXPECTED COMMIT: ${commitTitle}` : ''}

${goals ? `GOALS TO ACHIEVE:
${goals.split(',').map(goal => `- ${goal.trim()}`).join('\n')}` : ''}

${files && files.length > 0 ? `FILES TO MODIFY:
${files.map((file: string) => `- ${file}`).join('\n')}` : ''}

Please provide:
1. A step-by-step approach to complete this milestone
2. Key coding concepts I should understand
3. Potential challenges I might face and how to overcome them
4. Tips for testing my implementation
`;

    // Call the Google Generative AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
} 