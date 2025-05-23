import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { User } from '@/types/db';

// GET /api/users - Get all users
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query: Record<string, any> = {};
    
    // Filter by college if provided
    const college = searchParams.get('college');
    if (college) {
      query.college = college;
    }
    
    // Filter by branch if provided
    const branch = searchParams.get('branch');
    if (branch) {
      query.branch = branch;
    }
    
    // Search by name or email
    const search = searchParams.get('search');
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { githubUsername: { $regex: search, $options: 'i' } }
      ];
    }
    
    const usersCollection = await getCollection('users');
    const users = await usersCollection
      .find(query)
      .sort({ name: 1 })
      .toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, college, branch, githubUsername } = body;
    
    // Validate required fields
    if (!name || !email || !college || !branch || !githubUsername) {
      return NextResponse.json(
        { error: 'All fields are required: name, email, college, branch, githubUsername' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const usersCollection = await getCollection('users');
    
    // Check if user with the same email already exists
    const existingUserByEmail = await usersCollection.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
    // Check if user with the same GitHub username already exists
    const existingUserByGithub = await usersCollection.findOne({ githubUsername });
    if (existingUserByGithub) {
      return NextResponse.json(
        { error: 'A user with this GitHub username already exists' },
        { status: 400 }
      );
    }
    
    // Verify college exists
    const collegesCollection = await getCollection('colleges');
    const collegeRecord = await collegesCollection.findOne({ name: college });
    if (!collegeRecord) {
      return NextResponse.json(
        { error: 'The specified college does not exist' },
        { status: 400 }
      );
    }
    
    // Verify branch is valid for the college
    if (!collegeRecord.branches.includes(branch)) {
      return NextResponse.json(
        { error: 'The specified branch is not valid for this college' },
        { status: 400 }
      );
    }
    
    const newUser: User = {
      name,
      email,
      college,
      branch,
      githubUsername,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    return NextResponse.json({ 
      _id: result.insertedId,
      ...newUser 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 