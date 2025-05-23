import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Helper function to parse goals string into array
const parseGoals = (goalsStr: any): string[] => {
  if (Array.isArray(goalsStr)) {
    return goalsStr.map(goal => goal.toString().trim()).filter(Boolean);
  }
  
  if (typeof goalsStr === 'string') {
    return goalsStr.split(',').map(goal => goal.trim()).filter(Boolean);
  }
  
  return [];
};

// PUT /api/projects/:id/milestone-goals - Update a milestone goal's completion status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { milestoneTitle, goal, completed } = await req.json();
    
    console.log('Received request:', { 
      projectId: params.id, 
      milestoneTitle, 
      goal, 
      completed 
    });
    
    if (!milestoneTitle || goal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: milestoneTitle and goal' },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    const projectsCollection = await getCollection('projects');
    
    // Find the project first to check if it exists
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(params.id) 
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    console.log('Found project:', project.title);
    
    // Find the milestone in the project
    const milestoneIndex = project.milestones.findIndex(
      (m: any) => m.title === milestoneTitle
    );
    
    if (milestoneIndex === -1) {
      return NextResponse.json(
        { error: `Milestone not found: ${milestoneTitle}` },
        { status: 404 }
      );
    }
    
    console.log('Found milestone at index:', milestoneIndex);
    
    // Initialize completedGoals array if it doesn't exist
    if (!project.milestones[milestoneIndex].completedGoals) {
      project.milestones[milestoneIndex].completedGoals = [];
    }
    
    // Update the completedGoals array
    let completedGoals = Array.isArray(project.milestones[milestoneIndex].completedGoals) 
      ? [...project.milestones[milestoneIndex].completedGoals] 
      : [];
    
    if (completed && !completedGoals.includes(goal)) {
      completedGoals.push(goal);
    } else if (!completed && completedGoals.includes(goal)) {
      completedGoals = completedGoals.filter(g => g !== goal);
    }
    
    console.log('Updated completedGoals:', completedGoals);
    
    // Parse goals string to array to check if all goals are completed
    let goalsArray: string[] = [];
    try {
      goalsArray = parseGoals(project.milestones[milestoneIndex].goals);
    } catch (error) {
      console.error('Error parsing goals:', error);
      console.log('Original goals value:', project.milestones[milestoneIndex].goals);
      goalsArray = [];
    }
    
    if (goalsArray.length === 0) {
      console.log('No goals found for milestone');
    }
    
    // Set milestone as completed if all goals are completed and maintain detected status
    const allGoalsCompleted = goalsArray.length > 0 && goalsArray.every(g => completedGoals.includes(g));
    
    // Check if the milestone was already detected
    const wasDetected = project.milestones[milestoneIndex].detected || false;
    
    console.log('Goal completion status:', { 
      totalGoals: goalsArray.length,
      completedGoals: completedGoals.length,
      allGoalsCompleted,
      wasDetected
    });
    
    try {
      // Update the project in the database, maintaining detected status
      const updateResult = await projectsCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $set: { 
            [`milestones.${milestoneIndex}.completedGoals`]: completedGoals,
            [`milestones.${milestoneIndex}.completed`]: allGoalsCompleted,
            // Keep detected status if it was already set
            ...(wasDetected && { [`milestones.${milestoneIndex}.detected`]: true })
          } 
        }
      );
      
      console.log('Database update result:', updateResult);
      
      if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Project not found for update' },
          { status: 404 }
        );
      }
      
      if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
        console.log('Project found but not modified. This might mean no actual changes were made.');
        // Continue anyway to return the current project state
      }
      
      // Get the updated project
      const updatedProject = await projectsCollection.findOne({ 
        _id: new ObjectId(params.id) 
      });
      
      if (!updatedProject) {
        return NextResponse.json(
          { error: 'Failed to retrieve updated project' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(updatedProject);
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { error: 'Database operation failed', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating milestone goals:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone goals', details: error.message },
      { status: 500 }
    );
  }
} 