import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

// GET /api/colleges/branches - Get branches for a college
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const collegeName = searchParams.get('college');
    
    if (!collegeName) {
      return NextResponse.json(
        { error: 'College name is required' },
        { status: 400 }
      );
    }
    
    const collegesCollection = await getCollection('colleges');
    const college = await collegesCollection.findOne({ name: collegeName });
    
    if (!college) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(college.branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
} 