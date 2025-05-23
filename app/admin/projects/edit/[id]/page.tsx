"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircleIcon, XCircleIcon } from "lucide-react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { DashboardLayout } from "../../../../components/layout";
import { College, Project, Milestone } from "@/types/db";
import { Textarea } from "@/components/ui/textarea";

// Update the Milestone interface to ensure goals is a string array
interface MilestoneWithArrayGoals extends Omit<Milestone, 'goals'> {
  goals: string[];
}

export default function EditProject({ params }: { params: { id: string } }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [milestones, setMilestones] = useState<MilestoneWithArrayGoals[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    repositoryName: "",
    collegeId: "",
    branch: "",
    structureImage: "",
    previewUrl: "",
    connectedRepo: "",
    context: ""  // Added context field for project
  });

  // Fetch project data
  useEffect(() => {
    async function fetchProjectData() {
      setIsLoading(true);
      try {
        // Fetch project
        const projectRes = await fetch(`/api/projects/${id}`);
        if (!projectRes.ok) throw new Error("Failed to fetch project");
        const project: Project = await projectRes.json();
        
        // Fetch colleges
        const collegesRes = await fetch('/api/colleges');
        if (!collegesRes.ok) throw new Error("Failed to fetch colleges");
        const collegesData: College[] = await collegesRes.json();
        
        setColleges(collegesData);
        
        // Set the selected college
        const college = collegesData.find(c => c._id === project.collegeId) || null;
        setSelectedCollege(college);
        
        // Set form data
        setFormData({
          title: project.title,
          description: project.description,
          repositoryName: project.repositoryName,
          collegeId: project.collegeId,
          branch: project.branch,
          structureImage: project.structureImage || "",
          previewUrl: project.previewUrl || "",
          connectedRepo: project.connectedRepo || "",
          context: project.context || ""  // Include project context
        });
        
        // Set milestones and ensure goals is always an array
        setMilestones(project.milestones.map(m => ({
          ...m,
          goals: Array.isArray(m.goals) ? m.goals : [m.goals],
          expectedFiles: Array.isArray(m.expectedFiles) ? m.expectedFiles : [],
          context: m.context || "",  // Ensure milestone context is included
          goalContexts: m.goalContexts || {}  // Ensure goal contexts are included
        })));
      } catch (error) {
        console.error("Error fetching project data:", error);
        alert("Error loading project data. Please try again.");
        router.push('/admin/projects');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProjectData();
  }, [id, router]);

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
        completed: false
      }
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneWithArrayGoals, value: any) => {
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
    setIsSubmitting(true);
    
    try {
      const projectData = {
        ...formData,
        milestones
      };
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }
      
      // Navigate back to the projects list
      router.push('/admin/projects');
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ad46ff] mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading project data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Project</h1>
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
              
              {formData.connectedRepo && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Connected Repository
                  </label>
                  <div className="px-3 py-2 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                    <span className="text-green-600">●</span>
                    <span className="text-green-600 dark:text-green-500 font-medium">{formData.connectedRepo}</span>
                  </div>
                </div>
              )}
              
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
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
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
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
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
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
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
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
              
              {/* Project Context Field */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Context
                </label>
                <Textarea
                  name="context"
                  value={formData.context}
                  onChange={handleInputChange}
                  placeholder="AI-generated context for this project"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-[#ad46ff] dark:focus:border-[#c65dff]"
                />
              </div>
            </div>
          </Card>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Milestones</h2>
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
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
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
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
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
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Milestone Context Field */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Milestone Context
                    </label>
                    <textarea
                      value={milestone.context || ""}
                      onChange={(e) => updateMilestone(index, 'context', e.target.value)}
                      placeholder="AI-generated context for this milestone"
                      rows={3}
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Goal Contexts Display and Edit */}
                  {milestone.goals.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Goal Contexts
                      </label>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {milestone.goals.map((goal, goalIndex) => (
                          <div key={goalIndex} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                            <p className="text-sm font-medium text-[#ad46ff] dark:text-[#d48aff] mb-2">{goal}</p>
                            <textarea
                              value={milestone.goalContexts?.[goal] || ""}
                              onChange={(e) => {
                                const updatedGoalContexts = {
                                  ...(milestone.goalContexts || {}),
                                  [goal]: e.target.value
                                };
                                updateMilestone(index, 'goalContexts', updatedGoalContexts);
                              }}
                              placeholder="Context for this goal"
                              rows={2}
                              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              disabled={isSubmitting}
              className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 