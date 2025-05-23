"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircleIcon, Link2Icon, LinkIcon, UnplugIcon, GitBranchIcon, GitMergeIcon, CodeIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types/db";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";

interface GithubRepository {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
}

interface ProjectCardProps {
  project: Project;
  variant: "admin" | "student";
  onConnectRepo?: (projectId: string, repoName: string) => Promise<boolean>;
  onDisconnectRepo?: (projectId: string) => Promise<boolean>;
}

export function ProjectCard({ project, variant, onConnectRepo, onDisconnectRepo }: ProjectCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [repos, setRepos] = useState<GithubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // Calculate progress based on milestones
  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(m => m.completed).length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const handleConnectClick = async () => {
    if (variant === "admin") {
      // Navigate to edit page handled by the Link component
      return;
    }

    // For students, open the dialog to connect repo
    setIsDialogOpen(true);
    setIsLoading(true);

    try {
      // Use the actual user ID or username from the auth context
      if (!user?.username) {
        throw new Error("User not authenticated or username not available");
      }
      
      const response = await fetch(`/api/github/repositories?username=${user.username}`);
      if (!response.ok) throw new Error("Failed to fetch repositories");
      
      const data = await response.json();
      setRepos(data);
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectClick = () => {
    if (variant === "admin") {
      // Admin cannot disconnect repositories from this view
      return;
    }

    // Open the confirmation dialog
    setIsDisconnectDialogOpen(true);
  };

  const handleDisconnectRepo = () => {
    if (onDisconnectRepo) {
      setIsLoading(true);
      
      onDisconnectRepo(project._id as string)
        .then(() => {
          setIsDisconnectDialogOpen(false);
        })
        .catch((error) => {
          console.error("Failed to disconnect repository:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleConnectRepo = () => {
    if (onConnectRepo && selectedRepo) {
      // Show a loading state within the dialog
      setIsLoading(true);
      
      // Call the parent component's connect function
      onConnectRepo(project._id as string, selectedRepo)
        .then(() => {
          // Close dialog on success
          setIsDialogOpen(false);
        })
        .catch((error) => {
          console.error("Failed to connect repository:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleRepoStatusClick = () => {
    if (variant === "admin") return; // Admin cannot connect/disconnect repos from this view
    
    if (project.connectedRepo) {
      handleDisconnectClick();
    } else {
      handleConnectClick();
    }
  };

  return (
    <>
      <Card className="p-5 flex flex-col h-full border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shadow-sm hover:shadow-md transition-all duration-200 relative">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0"> {/* min-width 0 is essential for text-overflow to work */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={project.title}>
                {project.title}
              </h3>
            </div>
            
            {/* Repository Connection Status Tag - only show for student view */}
            {variant === "student" && (
              <div 
                className="cursor-pointer flex-shrink-0"
                onClick={handleRepoStatusClick}
              >
                {project.connectedRepo ? (
                  <Badge 
                    variant="outline" 
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 flex gap-1 items-center px-2 py-1 whitespace-nowrap"
                  >
                    <GitMergeIcon className="w-3 h-3" />
                    <span>Connected</span>
                  </Badge>
                ) : (
                  <Badge 
                    variant="outline" 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 flex gap-1 items-center px-2 py-1 whitespace-nowrap"
                  >
                    <GitBranchIcon className="w-3 h-3" />
                    <span>Disconnected</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {project.description}
          </p>
        </div>

        <div className=" space-y-4">
          {variant === "admin" ? (
            <Link href={`/admin/projects/edit/${project._id}`} className="w-full">
              <Button 
                variant="default" 
                className="w-full flex items-center gap-2 bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
              >
                <LinkIcon className="w-4 h-4" />
                Edit Project
              </Button>
            </Link>
          ) : (
            <div className="space-y-2">
              {project.connectedRepo ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <span className="font-semibold">Repository:</span> {project.connectedRepo}
                  </p>
                  
                  <Link href={`/dashboard/projects/${project._id}`}>
                    <Button 
                      variant="default" 
                      className="w-full flex items-center gap-2 bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                    >
                      <CodeIcon className="w-4 h-4" />
                      Continue Development
                    </Button>
                  </Link>
                </>
              ) : (
                <Button 
                  variant="default"
                  className="w-full flex items-center gap-2 bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                  onClick={handleConnectClick}
                >
                  <Link2Icon className="w-4 h-4" />
                  <span>Connect Repository</span>
                </Button>
              )}
            </div>
          )}

          {/* Progress bar - only for student view */}
          {variant === "student" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="font-semibold text-[#ad46ff] dark:text-[#d48aff]">{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2 bg-gray-100 dark:bg-gray-800"
                indicatorClassName="bg-[#ad46ff] dark:bg-[#c65dff]"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Repository Selection Dialog for Students */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Connect GitHub Repository</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ad46ff]"></div>
              </div>
            ) : repos.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a repository to connect to this project:
                </p>
                {repos.map((repo) => (
                  <div 
                    key={repo.name} 
                                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedRepo === repo.name 
                        ? "border-[#ad46ff] bg-[#ad46ff1a] dark:bg-[#ad46ff33]" 
                        : "hover:bg-white dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
                    }`}
                    onClick={() => setSelectedRepo(repo.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-[#ad46ff] flex items-center justify-center flex-shrink-0">
                        {selectedRepo === repo.name && (
                          <div className="w-2 h-2 rounded-full bg-[#ad46ff]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{repo.name}</div>
                        {repo.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{repo.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-6 flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-300 dark:border-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    disabled={!selectedRepo} 
                    onClick={handleConnectRepo}
                    className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No repositories found. Make sure your GitHub account is connected correctly.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect Repository Confirmation Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent className="max-w-md rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Disconnect Repository</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to disconnect <span className="font-bold">{project.connectedRepo}</span> from this project?
            </p>
            
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDisconnectDialogOpen(false)}
                className="border-gray-300 dark:border-gray-700"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDisconnectRepo}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-r-transparent border-white rounded-full"></div>
                    <span>Disconnecting...</span>
                  </div>
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 