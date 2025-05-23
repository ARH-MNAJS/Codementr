import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { Project } from '@/types/db';

// GET /api/projects/:id - Get a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const projectsCollection = await getCollection('projects');
    const project = await projectsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects/:id - Update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const body = await req.json();
    const { 
      title, 
      description, 
      repositoryName, 
      collegeId, 
      branch, 
      structureImage, 
      previewUrl, 
      milestones,
      connectedRepo,
      context
    } = body;
    
    // Validate required fields
    if (!title || !description || !repositoryName || !collegeId || !branch) {
      return NextResponse.json(
        { error: 'Required fields missing: title, description, repositoryName, collegeId, branch' },
        { status: 400 }
      );
    }
    
    // Validate collegeId format
    if (!ObjectId.isValid(collegeId)) {
      return NextResponse.json({ error: 'Invalid collegeId format' }, { status: 400 });
    }
    
    // Verify college exists
    const collegesCollection = await getCollection('colleges');
    const college = await collegesCollection.findOne({ _id: new ObjectId(collegeId) });
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 400 });
    }
    
    // Verify branch is valid for the college
    if (!college.branches.includes(branch)) {
      return NextResponse.json({ error: 'Branch is not valid for this college' }, { status: 400 });
    }
    
    const projectsCollection = await getCollection('projects');
    
    // Check if project exists
    const existingProject = await projectsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const updatedProject: Partial<Project> = {
      title,
      description,
      repositoryName,
      collegeId,
      branch,
      structureImage,
      previewUrl,
      milestones: Array.isArray(milestones) ? milestones : [],
      updatedAt: new Date(),
      context: context || existingProject.context || '' // Include context, keep existing if not provided
    };
    
    // Only add connectedRepo if it's provided
    if (connectedRepo !== undefined) {
      updatedProject.connectedRepo = connectedRepo;
    }
    
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedProject }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      _id: id,
      ...updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/:id - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const projectsCollection = await getCollection('projects');
    const result = await projectsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 