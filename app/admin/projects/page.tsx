"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircleIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/project-card";
import { DashboardLayout } from "../../components/layout";
import { Project } from "@/types/db";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchProjects = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/projects${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(debouncedSearch);
  }, [debouncedSearch, fetchProjects]);

  const handleCreateProject = () => {
    router.push("/admin/projects/create");
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          
          <div className="flex w-full md:w-auto gap-3 items-center">
            <div className="relative flex-grow md:w-72">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search projects..."
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[#ad46ff] dark:focus:ring-[#c65dff] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleCreateProject}
              className="whitespace-nowrap bg-[#ad46ff] hover:bg-[#9b3be3] text-white px-4 py-2 h-10 rounded-md font-medium"
            >
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </div>
      </div>
      
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ad46ff]"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project._id} 
                project={project} 
                variant="admin" 
              />
            ))}
          </div>
        ) : (
          <div className="h-60 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
            <p className="text-gray-500 mb-6">No projects found</p>
            <Button 
              onClick={handleCreateProject}
              className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
            >
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 