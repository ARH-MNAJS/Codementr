import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { College } from '@/types/db';

// GET /api/colleges - Get all colleges
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query: Record<string, any> = {};
    
    // Filter by name if provided
    const name = searchParams.get('name');
    if (name) {
      query.name = name;
    }
    
    const collegesCollection = await getCollection('colleges');
    const colleges = await collegesCollection.find(query).sort({ name: 1 }).toArray();
    
    return NextResponse.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json({ error: 'Failed to fetch colleges' }, { status: 500 });
  }
}

// POST /api/colleges - Create a new college
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, branches } = body;
    
    if (!name || !branches || !Array.isArray(branches)) {
      return NextResponse.json(
        { error: 'Name and branches array are required' },
        { status: 400 }
      );
    }
    
    const collegesCollection = await getCollection('colleges');
    
    // Check if college with the same name already exists
    const existingCollege = await collegesCollection.findOne({ name });
    if (existingCollege) {
      return NextResponse.json(
        { error: 'A college with this name already exists' },
        { status: 400 }
      );
    }
    
    const newCollege: College = {
      name,
      branches,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collegesCollection.insertOne(newCollege);
    
    return NextResponse.json({ 
      _id: result.insertedId,
      ...newCollege 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json({ error: 'Failed to create college' }, { status: 500 });
  }
} 