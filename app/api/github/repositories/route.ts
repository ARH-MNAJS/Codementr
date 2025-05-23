import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/github/repositories - Get user's GitHub repositories
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 });
    }
    
    // Get user from session to ensure authentication
    const session = await getSession();
    if (!session || !session.user || session.user.username !== username) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }
    
    // For authenticated users, we can use their username directly
    const githubUsername = username;
    
    // In a full implementation, you would also get the GitHub token for the user
    // from your database here if needed
    const githubToken = null; // Replace with actual token retrieval if implemented
    
    // This check is now redundant since we're using the username directly, but kept for safety
    if (!githubUsername) {
      return NextResponse.json({ error: 'GitHub username not found for user' }, { status: 400 });
    }
    
    // If no token, use public API (rate limited)
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    
    // Add Authorization header if token exists
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }
    
    // Fetch latest 5 repositories
    const response = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=5`,
      { headers }
    );
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: 'Failed to fetch GitHub repositories', details: error }, { status: response.status });
    }
    
    const repos = await response.json();
    
    // Simplify the response to only include what we need
    const simplifiedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      updated_at: repo.updated_at
    }));
    
    return NextResponse.json(simplifiedRepos);
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub repositories' }, { status: 500 });
  }
} 