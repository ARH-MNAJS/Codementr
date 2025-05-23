"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircleIcon, XCircleIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { DashboardLayout } from "../../../components/layout";
import { College } from "@/types/db";
import { Textarea } from "@/components/ui/textarea";

interface Milestone {
  title: string;
  commitTitle: string;
  goals: string[];
  description: string;
  expectedFiles: string[];
  context?: string;
  goalContexts?: Record<string, string>;
}

export default function CreateProject() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contextGenerated, setContextGenerated] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    repositoryName: "",
    collegeId: "",
    branch: "",
    structureImage: "",
    previewUrl: "",
    context: ""
  });

  // Fetch colleges for the dropdown
  useEffect(() => {
    async function fetchColleges() {
      try {
        const response = await fetch('/api/colleges');
        if (!response.ok) throw new Error("Failed to fetch colleges");
        
        const data = await response.json();
        setColleges(data);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      }
    }
    
    fetchColleges();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update selected college when collegeId changes
    if (name === 'collegeId') {
      const college = colleges.find(c => c._id === value) || null;
      setSelectedCollege(college);
      
      // Reset branch if college changes
      if (formData.collegeId !== value) {
        setFormData(prev => ({
          ...prev,
          branch: ""
        }));
      }
    }
  };

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      {
        title: "",
        commitTitle: "",
        goals: [],
        description: "",
        expectedFiles: [],
        context: "",
        goalContexts: {}
      }
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if context has been generated
    if (!contextGenerated) {
      alert("Please generate context before creating the project");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const projectData = {
        ...formData,
        milestones
      };
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }
      
      // Navigate back to the projects list
      router.push('/admin/projects');
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const generateContext = async () => {
    if (!formData.title) {
      alert("Please enter a project title before generating context");
      return;
    }
    
    setIsGeneratingContext(true);
    console.log("Starting context generation for project:", formData.title);
    
    try {
      // Step 1: Generate project context
      const projectContextPayload = {
        type: 'project',
        projectTitle: formData.title,
        projectDescription: formData.description,
        repositoryName: formData.repositoryName
      };
      console.log("Sending request to generate project context:", projectContextPayload);
      
      const projectContextResponse = await fetch('/api/ai/generate-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectContextPayload)
      });
      
      if (!projectContextResponse.ok) {
        const errorData = await projectContextResponse.text();
        console.error("Project context generation failed with status:", projectContextResponse.status);
        console.error("Response body:", errorData);
        throw new Error(`Failed to generate project context: ${projectContextResponse.status} - ${errorData || "Unknown error"}`);
      }
      
      const projectContextData = await projectContextResponse.json();
      console.log("Received project context:", projectContextData);
      
      // Update project context
      setFormData(prev => ({
        ...prev,
        context: projectContextData.context
      }));
      
      // Step 2: Generate context for each milestone
      const updatedMilestones = [...milestones];
      
      // Process milestones sequentially with delay to avoid rate limiting
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        
        // Skip milestones with empty titles
        if (!milestone.title) {
          console.log(`Skipping milestone at index ${i} due to empty title`);
          continue;
        }
        
        // Add delay between milestone requests to avoid rate limiting
        if (i > 0) {
          const delayTime = 1500; // 1.5 seconds delay between milestone requests
          console.log(`Adding delay of ${delayTime}ms before processing milestone ${i+1}`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
        
        try {
          // Generate milestone context
          const milestonePayload = {
            type: 'milestone',
            projectTitle: formData.title,
            projectDescription: formData.description,
            milestoneTitle: milestone.title,
            milestoneCommitTitle: milestone.commitTitle,
            milestoneDescription: milestone.description,
            milestoneFiles: milestone.expectedFiles
          };
          console.log(`Sending request to generate context for milestone ${i+1}:`, milestonePayload);
          
          const milestoneContextResponse = await fetch('/api/ai/generate-context', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(milestonePayload)
          });
          
          if (!milestoneContextResponse.ok) {
            const errorData = await milestoneContextResponse.text();
            console.error(`Milestone ${i+1} context generation failed with status:`, milestoneContextResponse.status);
            console.error("Response body:", errorData);
            
            // Don't throw error, continue with next milestone
            console.warn(`Skipping context generation for milestone ${i+1} due to error`);
            continue;
          }
          
          const milestoneContextData = await milestoneContextResponse.json();
          console.log(`Received context for milestone ${i+1}:`, milestoneContextData);
          updatedMilestones[i].context = milestoneContextData.context;
          
          // Step 3: Generate context for each goal in the milestone
          const goalContexts: Record<string, string> = {};
          
          // Process goals sequentially with delay
          for (let j = 0; j < milestone.goals.length; j++) {
            const goal = milestone.goals[j];
            // Skip empty goals
            if (!goal) {
              console.log(`Skipping goal ${j+1} in milestone ${i+1} due to empty content`);
              continue;
            }
            
            // Add delay between goal requests to avoid rate limiting
            if (j > 0) {
              const goalDelayTime = 1000; // 1 second delay between goal requests
              console.log(`Adding delay of ${goalDelayTime}ms before processing goal ${j+1}`);
              await new Promise(resolve => setTimeout(resolve, goalDelayTime));
            }
            
            try {
              const goalPayload = {
                type: 'goal',
                projectTitle: formData.title,
                milestoneTitle: milestone.title,
                goal
              };
              console.log(`Sending request to generate context for goal ${j+1} in milestone ${i+1}:`, goalPayload);
              
              const goalContextResponse = await fetch('/api/ai/generate-context', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(goalPayload)
              });
              
              if (!goalContextResponse.ok) {
                const errorData = await goalContextResponse.text();
                console.error(`Goal ${j+1} in milestone ${i+1} context generation failed with status:`, goalContextResponse.status);
                console.error("Response body:", errorData);
                
                // Don't throw error, continue with next goal
                console.warn(`Skipping context generation for goal ${j+1} due to error`);
                continue;
              }
              
              const goalContextData = await goalContextResponse.json();
              console.log(`Received context for goal ${j+1} in milestone ${i+1}:`, goalContextData);
              goalContexts[goal] = goalContextData.context;
            } catch (goalError) {
              console.error(`Error generating context for goal ${j+1} in milestone ${i+1}:`, goalError);
              // Continue with next goal
            }
          }
          
          updatedMilestones[i].goalContexts = goalContexts;
        } catch (milestoneError) {
          console.error(`Error generating context for milestone ${i+1}:`, milestoneError);
          // Continue with next milestone
        }
      }
      
      // Update milestones with whatever context we were able to generate
      setMilestones(updatedMilestones);
      setContextGenerated(true);
      console.log("Context generation completed successfully");
      
    } catch (error) {
      console.error("Error generating context:", error);
      alert("Failed to generate context: " + (error as Error).message);
    } finally {
      setIsGeneratingContext(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/projects')}
            className="border-gray-300 dark:border-gray-700"
          >
            Cancel
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-6 space-y-6 border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter project title"
                  className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repository Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="repositoryName"
                  value={formData.repositoryName}
                  onChange={handleInputChange}
                  placeholder="e.g., react-todo-app"
                  className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter project description"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  College <span className="text-red-500">*</span>
                </label>
                <select
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                  required
                >
                  <option value="" className="text-gray-500">Select a college</option>
                  {colleges.map(college => (
                    <option key={college._id} value={college._id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                  disabled={!selectedCollege}
                  required
                >
                  <option value="" className="text-gray-500">Select a branch</option>
                  {selectedCollege?.branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Structure Image URL
                </label>
                <Input
                  name="structureImage"
                  value={formData.structureImage}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.png"
                  className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview URL
                </label>
                <Input
                  name="previewUrl"
                  value={formData.previewUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                />
              </div>

              {/* Project Context Field */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Context
                    {contextGenerated && <span className="ml-2 text-green-500 text-xs">(Generated)</span>}
                  </label>
                </div>
                <Textarea
                  name="context"
                  value={formData.context}
                  onChange={handleInputChange}
                  placeholder="AI-generated context will appear here..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                />
              </div>
            </div>
          </Card>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Milestones</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={generateContext}
                  className="gap-2 bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                  disabled={isGeneratingContext || !formData.title || milestones.length === 0}
                >
                  <SparklesIcon className="w-4 h-4" />
                  {isGeneratingContext ? 'Generating...' : 'Generate Context'}
                </Button>
                <Button
                  type="button"
                  onClick={addMilestone}
                  className="gap-2 border-[#ad46ff] text-[#ad46ff] hover:bg-[#ad46ff1a] dark:hover:bg-[#ad46ff33] hover:text-[#9b3be3]"
                  variant="outline"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Add Milestone
                </Button>
              </div>
            </div>
            
            {milestones.length === 0 && (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400">No milestones added yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Projects with zero milestones are not buildable
                </p>
              </div>
            )}
            
            {milestones.map((milestone, index) => (
              <Card key={index} className="p-6 relative border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => removeMilestone(index)}
                >
                  <XCircleIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Milestone Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      placeholder="e.g., Setup Project Structure"
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Commit Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={milestone.commitTitle}
                      onChange={(e) => updateMilestone(index, 'commitTitle', e.target.value)}
                      placeholder="e.g., Initial setup"
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expected Goals <span className="text-red-500">*</span>
                    </label>
                    <TagInput
                      value={milestone.goals}
                      onChange={(value) => updateMilestone(index, 'goals', value)}
                      placeholder="Type a goal and press Enter"
                    />
                    {milestone.goals.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Add at least one goal
                      </p>
                    )}
                    
                    {/* Goal Contexts Display */}
                    {milestone.goalContexts && Object.keys(milestone.goalContexts).length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Generated Goal Contexts:
                        </p>
                        <div className="max-h-40 overflow-y-auto">
                          {Object.entries(milestone.goalContexts).map(([goal, context], idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 mb-2">
                              <p className="text-xs font-medium text-[#ad46ff] dark:text-[#d48aff] mb-1">{goal}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{context}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expected Files to Modify
                    </label>
                    <TagInput
                      value={milestone.expectedFiles}
                      onChange={(value) => updateMilestone(index, 'expectedFiles', value)}
                      placeholder="Type a file path and press Enter"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Goal Description
                    </label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      placeholder="Detailed description of this milestone"
                      rows={2}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                    />
                  </div>
                  
                  {/* Milestone Context Field */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Milestone Context
                      {milestone.context && <span className="ml-2 text-green-500 text-xs">(Generated)</span>}
                    </label>
                    <textarea
                      value={milestone.context || ""}
                      onChange={(e) => updateMilestone(index, 'context', e.target.value)}
                      placeholder="AI-generated context will appear here..."
                      rows={3}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/projects')}
              className="border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !contextGenerated}
              className={`${contextGenerated ? 'bg-[#ad46ff] hover:bg-[#9b3be3]' : 'bg-gray-400 cursor-not-allowed'} text-white`}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 