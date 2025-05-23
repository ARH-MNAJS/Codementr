"use client";

import { DashboardLayout } from "../../../../components/layout";
import { useState, useEffect, use } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucidePlus, LucideX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { College } from "@/types/db";

interface EditCollegeProps {
  params: {
    id: string;
  };
}

export default function EditCollege({ params }: EditCollegeProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const [collegeName, setCollegeName] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch(`/api/colleges/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch college');
        }
        
        const college: College = await response.json();
        
        setCollegeName(college.name);
        setBranches(college.branches);
        setError(null);
      } catch (err) {
        setError('Error loading college');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCollege();
  }, [id]);

  const handleAddBranch = () => {
    if (branchInput.trim() && !branches.includes(branchInput.trim())) {
      setBranches([...branches, branchInput.trim()]);
      setBranchInput("");
    }
  };

  const handleRemoveBranch = (branch: string) => {
    setBranches(branches.filter(b => b !== branch));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBranch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collegeName.trim()) {
      setError("College name is required");
      return;
    }
    
    if (branches.length === 0) {
      setError("At least one branch is required");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/colleges/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: collegeName.trim(),
          branches,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update college');
      }
      
      // Navigate back to colleges list
      router.push('/admin/colleges');
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error updating college:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Edit College</h1>
            <div className="animate-pulse">Loading college data...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white text-gray-800">Edit College</h1>
          </div>
          
          <div className="glass-card border dark:border-white/5 border-gray-200 p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="college-name" className="block dark:text-white text-gray-800 mb-2">
                  College Name
                </label>
                <Input
                  id="college-name"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="dark:bg-black/30 bg-white border-gray-200 dark:border-white/10 dark:text-white text-gray-800 cursor-text"
                  placeholder="Enter college name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="branches" className="block dark:text-white text-gray-800 mb-2">
                  Branches
                </label>
                <div className="flex gap-2">
                  <Input
                    id="branches"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="dark:bg-black/30 bg-white border-gray-200 dark:border-white/10 dark:text-white text-gray-800 cursor-text"
                    placeholder="Add a branch (e.g., Computer Science)"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddBranch}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium cursor-pointer"
                  >
                    <LucidePlus size={16} />
                    Add
                  </Button>
                </div>
                
                {branches.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {branches.map((branch, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="dark:bg-white/5 bg-gray-100 dark:text-white text-gray-700 flex items-center gap-1 px-3 py-1"
                      >
                        {branch}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveBranch(branch)}
                          className="ml-1 dark:text-gray-400 text-gray-500 dark:hover:text-white hover:text-gray-900 cursor-pointer"
                        >
                          <LucideX size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="dark:border-white/10 border-gray-200 dark:text-white text-gray-800 dark:hover:bg-white/5 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 