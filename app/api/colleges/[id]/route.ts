import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET /api/colleges/:id - Get a specific college
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const collegesCollection = await getCollection('colleges');
    const college = await collegesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }
    
    return NextResponse.json(college);
  } catch (error) {
    console.error('Error fetching college:', error);
    return NextResponse.json({ error: 'Failed to fetch college' }, { status: 500 });
  }
}

// PUT /api/colleges/:id - Update a college
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
    const { name, branches } = body;
    
    if (!name || !branches || !Array.isArray(branches)) {
      return NextResponse.json(
        { error: 'Name and branches array are required' },
        { status: 400 }
      );
    }
    
    const collegesCollection = await getCollection('colleges');
    
    // Check if another college with the same name exists (excluding this one)
    const existingCollege = await collegesCollection.findOne({ 
      name, 
      _id: { $ne: new ObjectId(id) } 
    });
    
    if (existingCollege) {
      return NextResponse.json(
        { error: 'Another college with this name already exists' },
        { status: 400 }
      );
    }
    
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          name, 
          branches,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }
    
    const updatedCollege = await collegesCollection.findOne({ _id: new ObjectId(id) });
    return NextResponse.json(updatedCollege);
  } catch (error) {
    console.error('Error updating college:', error);
    return NextResponse.json({ error: 'Failed to update college' }, { status: 500 });
  }
}

// DELETE /api/colleges/:id - Delete a college
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const collegesCollection = await getCollection('colleges');
    
    // Check if college exists
    const college = await collegesCollection.findOne({ _id: new ObjectId(id) });
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }
    
    // Check if there are users associated with this college
    const usersCollection = await getCollection('users');
    const usersWithCollege = await usersCollection.countDocuments({ college: college.name });
    
    if (usersWithCollege > 0) {
      return NextResponse.json(
        { error: 'Cannot delete college because it has associated users' },
        { status: 400 }
      );
    }
    
    await collegesCollection.deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting college:', error);
    return NextResponse.json({ error: 'Failed to delete college' }, { status: 500 });
  }
} 