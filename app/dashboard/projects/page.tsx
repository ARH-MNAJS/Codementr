"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/project-card";
import { DashboardLayout } from "../../components/layout";
import { Project, User } from "@/types/db";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUser";

export default function StudentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { user, isAuthenticated } = useUser();
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  // First, fetch the full user profile from our database
  useEffect(() => {
    async function fetchUserProfile() {
      setIsUserLoading(true);
      if (!isAuthenticated || !user?.username) {
        setIsUserLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/users?search=${user.username}`);
        if (!response.ok) throw new Error("Failed to fetch user profile");
        
        const data = await response.json();
        // Find the user with matching GitHub username
        const userProfile = data.find((u: User) => u.githubUsername === user.username);
        
        if (userProfile) {
          setUserDetails(userProfile);
        } else {
          console.warn("User profile not found in database. Projects will not be filtered by college/branch.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsUserLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [isAuthenticated, user]);

  const fetchProjects = useCallback(async (search?: string) => {
    if (isUserLoading) return; // Don't fetch projects until user data is loaded
    
    setIsLoading(true);
    try {
      // Build query params based on user's college and branch
      const queryParams = new URLSearchParams();
      
      if (search) {
        queryParams.append('search', search);
      }
      
      // Only filter by college and branch if we have user details
      if (userDetails) {
        // Find collegeId by name
        const collegeResponse = await fetch(`/api/colleges?name=${encodeURIComponent(userDetails.college)}`);
        if (collegeResponse.ok) {
          const colleges = await collegeResponse.json();
          if (colleges.length > 0) {
            queryParams.append('collegeId', colleges[0]._id);
          }
        }
        
        // Add branch filter
        queryParams.append('branch', userDetails.branch);
      }
      
      const response = await fetch(`/api/projects?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userDetails, isUserLoading]);

  useEffect(() => {
    // Only fetch projects after user loading is complete
    if (!isUserLoading) {
      fetchProjects(debouncedSearch);
    }
  }, [debouncedSearch, fetchProjects, isUserLoading]);

  // Show a single combined loading state
  const showLoading = isLoading || isUserLoading;

  const handleConnectRepo = async (projectId: string, repoName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/connect-repo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error("Failed to connect repository");
      }
      
      // Update the project in the local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project._id === projectId 
            ? { ...project, connectedRepo: repoName }
            : project
        )
      );
      
      return true; // Return success to indicate the operation completed successfully
    } catch (error) {
      console.error("Error connecting repository:", error);
      toast({
        title: "Error",
        description: "Failed to connect repository. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw the error to be caught by the caller
    }
  };

  const handleDisconnectRepo = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/disconnect-repo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error("Failed to disconnect repository");
      }
      
      // Update the project in the local state by removing the connected repository
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project._id === projectId 
            ? { ...project, connectedRepo: undefined, github: undefined }
            : project
        )
      );

      toast({
        title: "Repository disconnected",
        description: "The repository has been successfully disconnected from this project.",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Error disconnecting repository:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect repository. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          
          <div className="relative w-full md:w-72">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search projects..."
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={showLoading}
            />
          </div>
        </div>

        {showLoading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ad46ff]"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project._id} 
                project={project} 
                variant="student"
                onConnectRepo={handleConnectRepo}
                onDisconnectRepo={handleDisconnectRepo}
              />
            ))}
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
            <p className="text-gray-600 dark:text-gray-400">No projects available for your college/branch</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 