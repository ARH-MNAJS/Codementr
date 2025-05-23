"use client";

import { DashboardLayout } from "../../components/layout";
import { useState, useEffect } from "react";
import { College } from "@/types/db";
import { Input } from "@/components/ui/input";
import { LucideSearch, LucidePlus, LucidePencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdminColleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/colleges');
        
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        
        const data = await response.json();
        
        // Filter colleges by search term if present
        const filteredData = searchTerm 
          ? data.filter((college: College) => 
              college.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : data;
          
        setColleges(filteredData);
        setError(null);
      } catch (err) {
        setError('Error loading colleges');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-gray-800">Colleges</h1>
        <div className="flex space-x-4">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LucideSearch className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search colleges..."
              className="pl-10 dark:bg-black/30 bg-white border-white/10 dark:text-white text-gray-800 cursor-text"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Link href="/admin/colleges/create" className="cursor-pointer">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium border-0 rounded-md flex items-center gap-2 cursor-pointer">
              <LucidePlus size={16} />
              Add College
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="glass-card overflow-hidden border dark:border-white/5 border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="dark:text-gray-400 text-gray-600">Loading colleges...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            {error}
          </div>
        ) : colleges.length === 0 ? (
          <div className="p-8 text-center dark:text-gray-400 text-gray-600">
            No colleges found. {searchTerm && "Try a different search term."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dark:border-gray-700 border-gray-200">
                  <th className="dark:text-gray-200 text-gray-800">College Name</th>
                  <th className="dark:text-gray-200 text-gray-800">Branches</th>
                  <th className="dark:text-gray-200 text-gray-800 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((college) => (
                  <tr key={college._id} className="dark:border-gray-700 border-gray-200">
                    <td className="dark:text-gray-300 text-gray-700 font-medium">{college.name}</td>
                    <td className="dark:text-gray-300 text-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {college.branches.map((branch, index) => (
                          <Badge key={index} variant="secondary" className="dark:bg-white/5 bg-gray-100 dark:text-gray-200 text-gray-700 hover:bg-white/10">
                            {branch}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/colleges/edit/${college._id}`} className="cursor-pointer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="dark:text-purple-400 text-purple-600 dark:hover:text-purple-300 hover:text-purple-700 dark:hover:bg-purple-900/80 hover:bg-purple-100/90 cursor-pointer transition-all duration-200"
                        >
                          <LucidePencil className="mr-1 h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 