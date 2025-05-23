import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth';

// POST /api/projects/:id/connect-repo - Connect a GitHub repository to a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    const body = await req.json();
    const { repoName } = body;
    
    if (!repoName) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }
    
    // Declare repoDetails here so it's in scope for the entire function
    let repoDetails;
    
    // Get repository details from GitHub API for future use
    try {
      // Get user's GitHub username from session
      const githubUsername = session.user.username;
      
      // Fetch detailed repository information from GitHub API
      const repoResponse = await fetch(
        `https://api.github.com/repos/${githubUsername}/${repoName}`,
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );
      
      if (!repoResponse.ok) {
        return NextResponse.json({ 
          error: 'Unable to verify repository details from GitHub',
          details: await repoResponse.json()
        }, { status: 400 });
      }
      
      // Extract detailed repository information
      repoDetails = await repoResponse.json();
      
    } catch (error) {
      console.error('Error fetching repository details from GitHub:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch repository details from GitHub',
        details: error.message 
      }, { status: 500 });
    }
    
    const projectsCollection = await getCollection('projects');
    
    // Verify the project exists
    const existingProject = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Update the project with the connected repository information and GitHub details
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          connectedRepo: repoName,
          connectedBy: session.user.username,
          connectedAt: new Date(),
          updatedAt: new Date(),
          github: {
            repoId: repoDetails.id,
            fullName: repoDetails.full_name,
            owner: repoDetails.owner.login,
            defaultBranch: repoDetails.default_branch,
            htmlUrl: repoDetails.html_url,
            apiUrl: repoDetails.url,
            forksCount: repoDetails.forks_count,
            stargazersCount: repoDetails.stargazers_count,
            watchersCount: repoDetails.watchers_count,
            openIssuesCount: repoDetails.open_issues_count,
            lastUpdated: repoDetails.updated_at
          }
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      projectId: id,
      repoName,
      repoDetails: {
        fullName: repoDetails.full_name,
        htmlUrl: repoDetails.html_url,
        defaultBranch: repoDetails.default_branch
      }
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    return NextResponse.json({ error: 'Failed to connect repository' }, { status: 500 });
  }
} 