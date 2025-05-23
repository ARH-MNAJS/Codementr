import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth';

// POST /api/projects/:id/disconnect-repo - Disconnect a GitHub repository from a project
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
    
    const projectsCollection = await getCollection('projects');
    
    // Verify the project exists
    const existingProject = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (!existingProject.connectedRepo) {
      return NextResponse.json({ error: 'No repository connected to this project' }, { status: 400 });
    }
    
    // Reset all milestones to incomplete when disconnecting repository
    const updatedMilestones = existingProject.milestones.map(milestone => ({
      ...milestone,
      completed: false
    }));
    
    console.log(`Resetting ${updatedMilestones.length} milestones to incomplete for project ${id}`);
    
    // Update the project by removing repository connection information and resetting milestones
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $unset: { 
          connectedRepo: "",
          connectedBy: "",
          connectedAt: "",
          github: ""
        },
        $set: {
          updatedAt: new Date(),
          milestones: updatedMilestones
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      projectId: id,
      message: 'Repository disconnected and milestones reset successfully',
      milestonesReset: updatedMilestones.length
    });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    return NextResponse.json({ error: 'Failed to disconnect repository' }, { status: 500 });
  }
} 