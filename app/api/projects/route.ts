import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { Project } from '@/types/db';
import { ObjectId } from 'mongodb';

// GET /api/projects - Get all projects, with optional query params
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query: Record<string, any> = {};
    
    // Filter by college if specified
    const collegeId = searchParams.get('collegeId');
    if (collegeId) {
      query.collegeId = collegeId;
    }
    
    // Filter by branch if specified
    const branch = searchParams.get('branch');
    if (branch) {
      query.branch = branch;
    }
    
    // Search by title or description
    const search = searchParams.get('search');
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }
    
    const projectsCollection = await getCollection('projects');
    const projects = await projectsCollection.find(query).toArray();
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
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
    
    // Create new project
    const newProject: Project = {
      title,
      description,
      repositoryName,
      collegeId,
      branch,
      structureImage: structureImage || '',
      previewUrl: previewUrl || '',
      milestones: Array.isArray(milestones) ? milestones : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context: context || ''
    };
    
    const projectsCollection = await getCollection('projects');
    const result = await projectsCollection.insertOne(newProject);
    
    return NextResponse.json({
      _id: result.insertedId,
      ...newProject
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 