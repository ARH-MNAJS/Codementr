import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { User } from '@/types/db';

// POST /api/register - Register a new user and connect to GitHub
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, college, branch, githubUsername, githubToken } = body;
    
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
    
    // Generate a JWT token or session for the user
    // This is where you would normally create a session or JWT
    
    return NextResponse.json({ 
      _id: result.insertedId,
      ...newUser,
      success: true,
      message: "Registration successful"
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ 
      error: 'Failed to register user', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 