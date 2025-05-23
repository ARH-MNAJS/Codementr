"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/layout";
import AIChatButton from "@/app/components/ai-chat-button";
import { 
  ExternalLinkIcon, 
  GitBranchIcon, 
  LayoutIcon, 
  ImageIcon, 
  FileIcon, 
  CheckIcon, 
  FileTextIcon, 
  FileCodeIcon, 
  FileJsonIcon,
  FileCogIcon,
  FileSearchIcon,
  GithubIcon
} from "lucide-react";
import { Project, Milestone } from "@/types/db";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

// File extension to icon mapping
const fileIconMap: Record<string, React.ReactNode> = {
  'js': <FileCodeIcon className="w-4 h-4 text-yellow-500" />,
  'ts': <FileCodeIcon className="w-4 h-4 text-blue-500" />,
  'jsx': <FileCodeIcon className="w-4 h-4 text-cyan-500" />,
  'tsx': <FileCodeIcon className="w-4 h-4 text-cyan-600" />,
  'css': <FileCodeIcon className="w-4 h-4 text-pink-500" />,
  'scss': <FileCodeIcon className="w-4 h-4 text-pink-600" />,
  'html': <FileCodeIcon className="w-4 h-4 text-orange-500" />,
  'json': <FileJsonIcon className="w-4 h-4 text-green-500" />,
  'md': <FileTextIcon className="w-4 h-4 text-gray-500" />,
  'txt': <FileTextIcon className="w-4 h-4 text-gray-400" />,
  'config': <FileCogIcon className="w-4 h-4 text-gray-600" />,
  'default': <FileIcon className="w-4 h-4 text-gray-500" />
};

// Helper function to get file icon based on extension
const getFileIcon = (filename: string) => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    const extension = parts[parts.length - 1].toLowerCase();
    return fileIconMap[extension] || fileIconMap.default;
  }
  return fileIconMap.default;
};

// Define milestone card colors
const milestoneColors = [
  {
    bg: "bg-[#ad46ff]/10 dark:bg-[#ad46ff]/20",
    border: "border-[#ad46ff]/30 dark:border-[#ad46ff]/30",
    accent: "bg-[#ad46ff] text-white"
  },
  {
    bg: "bg-[#46adff]/10 dark:bg-[#46adff]/20",
    border: "border-[#46adff]/30 dark:border-[#46adff]/30",
    accent: "bg-[#46adff] text-white"
  },
  {
    bg: "bg-[#ff7846]/10 dark:bg-[#ff7846]/20",
    border: "border-[#ff7846]/30 dark:border-[#ff7846]/30",
    accent: "bg-[#ff7846] text-white"
  },
  {
    bg: "bg-[#46ff78]/10 dark:bg-[#46ff78]/20",
    border: "border-[#46ff78]/30 dark:border-[#46ff78]/30",
    accent: "bg-[#46ff78] text-white"
  },
  {
    bg: "bg-[#ff4696]/10 dark:bg-[#ff4696]/20",
    border: "border-[#ff4696]/30 dark:border-[#ff4696]/30",
    accent: "bg-[#ff4696] text-white"
  }
];

// Define standard and active milestone colors
const standardMilestoneColor = {
  bg: "bg-gray-100/80 dark:bg-gray-800/50",
  border: "border-gray-200 dark:border-gray-700",
  accent: "bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-800"
};

const activeMilestoneColor = {
  bg: "bg-[#ad46ff]/10 dark:bg-[#ad46ff]/20",
  border: "border-[#ad46ff]/30 dark:border-[#ad46ff]/30",
  accent: "bg-[#ad46ff] text-white"
};

// Add a new color for detected milestones
const detectedMilestoneColor = {
  bg: "bg-yellow-100/80 dark:bg-yellow-800/30",
  border: "border-yellow-300/50 dark:border-yellow-600/50",
  accent: "bg-yellow-500 text-white"
};

// Types for commit analysis
interface CommitAnalysis {
  overallAssessment: string;
  goalsAchieved: Array<{
    goal: string;
    achieved: boolean;
    explanation: string;
  }>;
  metrics: {
    goalAlignment: number;
    securityRisk: number;
    codeQuality: number;
    commitClarity: number;
  };
  suggestions: string[];
  shouldComplete: boolean;
  confidenceScore: number;
  description: string;
}

interface CommitDetails {
  sha: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
}

interface CommitReport {
  analysis: CommitAnalysis;
  commitDetails: CommitDetails;
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [completedGoals, setCompletedGoals] = useState<Record<string, string[]>>({});
  const [checkingProgress, setCheckingProgress] = useState(false);
  const { user } = useUser();
  const [commitReportSheet, setCommitReportSheet] = useState<string | null>(null);
  
  // Commit report state 
  const [commitReportOpen, setCommitReportOpen] = useState(false);
  const [commitReport, setCommitReport] = useState<CommitReport | null>(null);
  const [loadingCommitReport, setLoadingCommitReport] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch project details");
        
        const data = await response.json();
        setProject(data);
        
        // Initialize completed goals from project data
        if (data.milestones && data.milestones.length > 0) {
          const initialCompletedGoals: Record<string, string[]> = {};
          data.milestones.forEach((milestone: Milestone) => {
            initialCompletedGoals[milestone.title] = milestone.completedGoals || [];
          });
          setCompletedGoals(initialCompletedGoals);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id, toast]);

  const toggleMilestone = (title: string) => {
    if (expandedMilestone === title) {
      setExpandedMilestone(null);
    } else {
      setExpandedMilestone(title);
    }
  };

  const calculateProgress = () => {
    if (!project || !project.milestones || project.milestones.length === 0) return 0;
    
    const completedMilestones = project.milestones.filter(m => m.completed).length;
    return (completedMilestones / project.milestones.length) * 100;
  };

  const handleGoalToggle = async (milestoneTitle: string, goal: string, checked: boolean) => {
    if (!project) return;
    
    console.log(`Toggling goal: ${goal} to ${checked ? 'completed' : 'not completed'}`);
    
    // Update local state immediately for responsive UI
    setCompletedGoals(prev => {
      const currentGoals = [...(prev[milestoneTitle] || [])];
      
      if (checked && !currentGoals.includes(goal)) {
        return { ...prev, [milestoneTitle]: [...currentGoals, goal] };
      } else if (!checked && currentGoals.includes(goal)) {
        return { ...prev, [milestoneTitle]: currentGoals.filter(g => g !== goal) };
      }
      
      return prev;
    });
    
    // Update in the database
    try {
      const response = await fetch(`/api/projects/${params.id}/milestone-goals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneTitle,
          goal,
          completed: checked
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || "Failed to update goal status");
      }
      
      // Success, update project data with server response
      console.log('Goal updated successfully');
      setProject(data);
      
      // Show a success toast
      toast({
        title: checked ? "Goal completed" : "Goal unchecked",
        description: checked ? "Your progress has been saved" : "Goal marked as incomplete",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error updating goal:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to update goal status",
        variant: "destructive",
      });
      
      // Revert the local state change
      setCompletedGoals(prev => {
        const currentGoals = [...(prev[milestoneTitle] || [])];
        
        if (checked && currentGoals.includes(goal)) {
          return { ...prev, [milestoneTitle]: currentGoals.filter(g => g !== goal) };
        } else if (!checked && !currentGoals.includes(goal)) {
          return { ...prev, [milestoneTitle]: [...currentGoals, goal] };
        }
        
        return prev;
      });
    }
  };

  // Function to split goals string into array
  const parseGoals = (goalsStr: any): string[] => {
    // If goalsStr is already an array, return it
    if (Array.isArray(goalsStr)) {
      return goalsStr.map(goal => goal.toString().trim()).filter(Boolean);
    }
    
    // If goalsStr is a string, split it
    if (typeof goalsStr === 'string') {
      return goalsStr.split(',').map(goal => goal.trim()).filter(Boolean);
    }
    
    // If goalsStr is undefined, null, or not a string, return empty array
    return [];
  };

  // Function to generate AI suggestions
  const getAiSuggestion = async (milestone: Milestone) => {
    if (aiLoading) return;
    
    setAiLoading(true);
    setAiResponse(null);
    
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectTitle: project?.title,
          projectDescription: project?.description,
          repository: project?.connectedRepo,
          milestone: milestone.title,
          commitTitle: milestone.commitTitle,
          goals: milestone.goals,
          files: milestone.expectedFiles,
          completed: milestone.completed || false,
          detected: milestone.detected || false,
          commitSha: milestone.commitSha || ""
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI suggestion");
      }
      
      const data = await response.json();
      setAiResponse(data.response);
      
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestion",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCheckProgress = async () => {
    if (!project || !user) {
      toast({
        title: "Error",
        description: "Project not loaded",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Project data:", {
      id: project._id,
      title: project.title,
      connectedRepo: project.connectedRepo,
      activeMilestoneIndex: project.milestones.findIndex(m => !m.completed)
    });
    
    if (!project.connectedRepo) {
      console.log("No repository connected to project");
      toast({
        title: "Error",
        description: "No repository connected to this project",
        variant: "destructive",
      });
      return;
    }
    
    console.log("User data:", {
      email: user?.email,
      name: user?.name,
      hasGithub: !!user?.github,
      githubUsername: user?.github?.username
    });
    
    setCheckingProgress(true);
    
    try {
      const activeMilestoneIndex = project.milestones.findIndex(m => !m.completed);
      
      if (activeMilestoneIndex === -1) {
        console.log("All milestones already completed");
        toast({
          title: "All Done!",
          description: "All milestones are already completed",
        });
        setCheckingProgress(false);
        return;
      }
      
      const activeMilestone = project.milestones[activeMilestoneIndex];
      console.log("Active milestone:", {
        title: activeMilestone.title,
        commitTitle: activeMilestone.commitTitle,
        detected: activeMilestone.detected || false
      });
      
      // Prepare request payload
      const payload = {
        repoName: project.connectedRepo,
        expectedCommitTitle: activeMilestone.commitTitle,
        milestoneTitle: activeMilestone.title
      };
      
      console.log("Sending API request with payload:", payload);
      console.log("API URL:", `/api/projects/${project._id}/verify-commit`);
      
      // Call the API to verify the commit
      const response = await fetch(`/api/projects/${project._id}/verify-commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log("API response status:", response.status);
      const result = await response.json();
      console.log("API response body:", result);
      
      if (!response.ok) {
        console.error("API error:", result);
        throw new Error(result.error || "Failed to verify commit");
      }
      
      if (result.matched) {
        console.log("Commit matched - milestone detected");
        // Fetch the updated project to get all the latest data
        const projectResponse = await fetch(`/api/projects/${params.id}`);
        if (!projectResponse.ok) {
          throw new Error("Failed to refresh project data");
        }
        
        const updatedProject = await projectResponse.json();
        setProject(updatedProject);
        
        toast({
          title: "Commit Detected!",
          description: `Found a matching commit for "${activeMilestone.title}"`,
          variant: "default",
        });
      } else {
        // Show detailed message about why it didn't match
        console.log("No matching commit found");
        const message = result.message || "No matching commit found";
        const expectedTitle = result.expectedTitle || activeMilestone.commitTitle;
        const latestCommit = result.latestCommitTitle ? `Latest commit: "${result.latestCommitTitle}"` : "";
        
        toast({
          title: "No Matching Commit Found",
          description: `${message}. Expected: "${expectedTitle}". ${latestCommit}`,
          variant: "default",
          duration: 5000, // Show longer since there's more info
        });
      }
    } catch (error) {
      console.error("Error checking progress:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check progress",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      console.log("=== CLIENT-SIDE DEBUG END ===");
      setCheckingProgress(false);
    }
  };

  // Function to handle fetching commit analysis
  const getCommitAnalysis = async (milestoneTitle: string, commitSha: string) => {
    if (loadingCommitReport) return;
    
    setSelectedMilestone(milestoneTitle);
    setLoadingCommitReport(true);
    setCommitReport(null);
    setCommitReportOpen(true);
    
    try {
      const response = await fetch(`/api/projects/${params.id}/commit-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneTitle,
          commitSha
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze commit");
      }
      
      const data = await response.json();
      setCommitReport(data);
      
    } catch (err: any) {
      console.error("Error analyzing commit:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to analyze commit",
        variant: "destructive",
      });
      setCommitReportOpen(false);
    } finally {
      setLoadingCommitReport(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 p-4">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          
          <div className="space-y-6 mt-8">
            <Skeleton className="h-8 w-1/3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-24 w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Project not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button 
            className="mt-6 bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
            onClick={() => router.push('/dashboard/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-6xl mx-auto">
        {/* Project Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
              
              {project.connectedRepo && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <GitBranchIcon className="h-4 w-4 mr-2 text-[#ad46ff] dark:text-[#d48aff]" />
                  <span>Connected to: <span className="font-medium">{project.connectedRepo}</span></span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {project.previewUrl && (
                <Button 
                  variant="default"
                  className="bg-[#ad46ff] hover:bg-[#9b3be3] dark:bg-[#ad46ff] dark:hover:bg-[#9b3be3] text-white rounded-md"
                  onClick={() => window.open(project.previewUrl, '_blank')}
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-0.5" />
                  View Preview
                </Button>
              )}
              
              {project.structureImage && (
                <Button 
                  variant="default"
                  className="bg-[#ad46ff] hover:bg-[#9b3be3] dark:bg-[#ad46ff] dark:hover:bg-[#9b3be3] text-white rounded-md"
                  onClick={() => setIsStructureDialogOpen(true)}
                >
                  <LayoutIcon className="h-4 w-4 mr-0.5" />
                  View Structure
                </Button>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Milestones Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-between items-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Project Milestones
            </h2>
            
            {project.connectedRepo && (
              <Button
                onClick={handleCheckProgress}
                className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white rounded-md flex items-center gap-1.5"
                disabled={checkingProgress}
              >
                {checkingProgress ? (
                  <><span className="animate-spin">⟳</span> Checking...</>
                ) : (
                  <><GitBranchIcon className="h-4 w-4" /> Update Progress</>
                )}
              </Button>
            )}
          </motion.div>
          
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            {/* Custom Timeline */}
            <div className="flex flex-col space-y-8 relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 h-full w-[2px] bg-gray-200 dark:bg-gray-700 z-0" />
              
              {project.milestones.map((milestone, idx) => {
                const goals = parseGoals(milestone.goals);
                const isExpanded = expandedMilestone === milestone.title;
                const milestoneCompleted = milestone.completed || false;
                const milestoneDetected = milestone.detected || false;
                const isActive = idx === project.milestones.findIndex(m => !m.completed);
                
                // Determine colors based on milestone status
                let colors = standardMilestoneColor;
                if (milestoneCompleted) {
                  colors = standardMilestoneColor;
                } else if (milestoneDetected) {
                  colors = detectedMilestoneColor;
                } else if (isActive) {
                  colors = activeMilestoneColor;
                }
                
                const isLastMilestone = idx === project.milestones.length - 1;
                
                return (
                  <div key={milestone.title} className="flex items-start relative">
                    {/* Circle indicator */}
                    <div className="flex-shrink-0 mr-6 z-10">
                      <div 
                        className={`h-10 w-10 rounded-full flex items-center justify-center border-2
                          ${milestoneCompleted 
                            ? "bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600" 
                            : milestoneDetected
                              ? "bg-yellow-500 border-yellow-500 dark:bg-yellow-600 dark:border-yellow-600"
                              : isActive 
                                ? "bg-[#ad46ff] border-[#ad46ff]" 
                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          }`}
                      >
                        {milestoneCompleted ? (
                          <CheckIcon className="h-5 w-5 text-white" />
                        ) : milestoneDetected ? (
                          <span className="font-medium text-white">!</span>
                        ) : (
                          <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {idx + 1}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Milestone content */}
                    <div className={`flex-grow p-4 rounded-lg ${colors.bg} border ${colors.border} overflow-hidden`}>
                      <div className="flex justify-between items-start mb-1">
                        <button 
                          onClick={() => toggleMilestone(milestone.title)}
                          className="text-left focus:outline-none"
                        >
                          <h3 className={`text-lg font-semibold break-words pr-3 ${
                            milestoneCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : milestoneDetected
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : isActive 
                                  ? 'text-[#ad46ff] dark:text-[#d48aff]' 
                                  : 'text-gray-800 dark:text-white'
                          }`}>
                            {milestone.title}
                          </h3>
                        </button>
                        
                        <div className="flex items-center flex-shrink-0">
                          {milestoneCompleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300 mr-2">
                              Completed
                            </span>
                          )}
                          {milestoneDetected && !milestoneCompleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300 mr-2">
                              Detected
                            </span>
                          )}
                          {isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ad46ff]/20 text-[#ad46ff] dark:bg-[#ad46ff]/30 dark:text-[#d48aff] mr-2">
                              Active
                            </span>
                          )}
                          {milestoneDetected && !milestoneCompleted && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                getCommitAnalysis(milestone.title, milestone.commitSha || '');
                              }}
                              className="text-xs font-medium text-[#ad46ff] dark:text-[#d48aff] hover:underline flex items-center mr-2 cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  getCommitAnalysis(milestone.title, milestone.commitSha || '');
                                }
                              }}
                            >
                              {loadingCommitReport && selectedMilestone === milestone.title ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-1">⟳</span> Analyzing...
                                </span>
                              ) : (
                                <span>Show Report</span>
                              )}
                            </span>
                          )}
                          <button 
                            onClick={() => toggleMilestone(milestone.title)}
                            className="flex-shrink-0 ml-1 focus:outline-none"
                            aria-label={isExpanded ? "Collapse milestone details" : "Expand milestone details"}
                          >
                            <svg 
                              className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden mt-3"
                          >
                            <div className="p-5 space-y-6 max-w-full overflow-x-auto">
                              {milestone.description && (
                                <div>
                                  <h4 className={`text-sm font-bold text-white dark:text-white ${colors.accent.split(' ')[0]} inline-block px-3 py-1 rounded-md mb-2`}>
                                    Description
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 break-words whitespace-normal overflow-wrap-anywhere max-w-full">
                                    {milestone.description}
                                  </p>
                                </div>
                              )}
                              
                              <div>
                                <h4 className={`text-sm font-bold text-white dark:text-white ${colors.accent.split(' ')[0]} inline-block px-3 py-1 rounded-md mb-2`}>
                                  Expected Commit Title
                                </h4>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 font-mono text-sm text-gray-800 dark:text-gray-200 break-words overflow-wrap-anywhere">
                                  {milestone.commitTitle}
                                </div>
                              </div>
                              
                              {milestone.expectedFiles && milestone.expectedFiles.length > 0 && (
                                <div>
                                  <h4 className={`text-sm font-bold text-white dark:text-white ${colors.accent.split(' ')[0]} inline-block px-3 py-1 rounded-md mb-2`}>
                                    Files to Modify
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {milestone.expectedFiles.map((file, idx) => (
                                      <div key={idx} className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                                        {getFileIcon(file)}
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-mono truncate break-all">
                                          {file}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {goals.length > 0 && (
                                <div>
                                  <h4 className={`text-sm font-bold text-white dark:text-white ${colors.accent.split(' ')[0]} inline-block px-3 py-1 rounded-md mb-2`}>
                                    Goals to Achieve
                                  </h4>
                                  <div className="space-y-2 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-auto">
                                    {goals.map((goal, idx) => (
                                      <div key={idx} className="flex items-start space-x-2">
                                        <Checkbox 
                                          id={`goal-${milestone.title}-${idx}`}
                                          checked={completedGoals[milestone.title]?.includes(goal) || false}
                                          onCheckedChange={(checked) => 
                                            handleGoalToggle(milestone.title, goal, checked === true)
                                          }
                                          className="mt-0.5 data-[state=checked]:bg-[#ad46ff] data-[state=checked]:border-[#ad46ff]"
                                        />
                                        <label 
                                          htmlFor={`goal-${milestone.title}-${idx}`}
                                          className={`text-sm break-words whitespace-normal ${
                                            completedGoals[milestone.title]?.includes(goal)
                                              ? 'text-gray-500 dark:text-gray-500 line-through'
                                              : 'text-gray-700 dark:text-gray-300'
                                          }`}
                                        >
                                          {goal}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Project Structure Dialog */}
      <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Project Structure</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(80vh-8rem)]">
            {project.structureImage && (
              <div className="relative w-full h-auto flex justify-center">
                <img 
                  src={project.structureImage} 
                  alt="Project Structure" 
                  className="max-w-full object-contain rounded-md"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* AI Chat Button */}
      {project && <AIChatButton projectId={params.id as string} projectTitle={project.title} />}
      
      {/* Commit Analysis Sheet */}
      <Sheet open={commitReportOpen} onOpenChange={setCommitReportOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto px-6 py-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <GithubIcon className="h-5 w-5" /> 
              Commit Analysis Report
            </SheetTitle>
            <SheetDescription>
              AI analysis of your commit and its implementation of the milestone goals
            </SheetDescription>
          </SheetHeader>
          
          {loadingCommitReport && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="animate-spin text-2xl text-[#ad46ff]">⟳</div>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Analyzing your commit...<br />
                This may take a moment as we review your code changes
              </p>
            </div>
          )}
          
          {!loadingCommitReport && commitReport && (
            <div className="space-y-6 py-4">
              {/* Commit Details Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Commit Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Commit:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{commitReport.commitDetails.message}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">SHA:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{commitReport.commitDetails.sha.substring(0, 7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Author:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{commitReport.commitDetails.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Date:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {new Date(commitReport.commitDetails.date).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Files Changed:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{commitReport.commitDetails.filesChanged}</span>
                  </div>
                </div>
              </div>
              
              {/* Overall Assessment */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2">Overall Assessment</h3>
                <p className="text-gray-700 dark:text-gray-300">{commitReport.analysis.overallAssessment}</p>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Confidence</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {commitReport.analysis.confidenceScore}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ad46ff] rounded-full" 
                      style={{ width: `${commitReport.analysis.confidenceScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Recommendation: {commitReport.analysis.shouldComplete ? 
                      'This milestone is ready to be completed!' : 
                      'Some goals still need more work.'}
                  </span>
                </div>
              </div>
              
              {/* Detailed Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Detailed Analysis</h3>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {commitReport.analysis.description}
                </div>
              </div>
              
              {/* Goals Analysis */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Goals Achievement</h3>
                <div className="space-y-3">
                  {commitReport.analysis.goalsAchieved.map((goal, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full ${
                          goal.achieved ? 
                            'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                          } flex items-center justify-center mr-2 mt-0.5`}
                        >
                          {goal.achieved ? '✓' : '!'}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            goal.achieved ? 
                              'text-green-600 dark:text-green-400' : 
                              'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {goal.goal}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {goal.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Metrics Section with Animation */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Performance Metrics</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Goal Alignment */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Alignment</h4>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Score</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{commitReport.analysis.metrics.goalAlignment}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-[#ad46ff] h-2 rounded-full" 
                        style={{ width: `${commitReport.analysis.metrics.goalAlignment}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Security Risk */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Security</h4>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Score</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{commitReport.analysis.metrics.securityRisk}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${commitReport.analysis.metrics.securityRisk}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Code Quality */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code Quality</h4>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Score</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{commitReport.analysis.metrics.codeQuality}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${commitReport.analysis.metrics.codeQuality}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Commit Clarity */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commit Clarity</h4>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Score</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{commitReport.analysis.metrics.commitClarity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${commitReport.analysis.metrics.commitClarity}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Suggestions Section */}
              {commitReport.analysis.suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">Suggestions</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {commitReport.analysis.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {commitReport.analysis.suggestions.length === 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">Suggestions</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Great job! No specific suggestions for improvement at this time. Keep up the good work!
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
} 