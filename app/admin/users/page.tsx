"use client";

import { DashboardLayout } from "../../components/layout";
import { useEffect, useState } from "react";
import { User } from "@/types/db";
import { Input } from "@/components/ui/input";
import { LucideSearch, LucideGithub } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users${searchTerm ? `?search=${searchTerm}` : ''}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError('Error loading users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-gray-800">Users</h1>
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LucideSearch className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search users..."
            className="pl-10 dark:bg-black/30 bg-white border-white/10 dark:text-white text-gray-800 cursor-text"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="glass-card overflow-hidden border dark:border-white/5 border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="dark:text-gray-400 text-gray-600">Loading users...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center dark:text-gray-400 text-gray-600">
            No users found. {searchTerm && "Try a different search term."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="dark:border-gray-700 border-gray-200">
                  <th className="dark:text-gray-200 text-gray-800">Name</th>
                  <th className="dark:text-gray-200 text-gray-800">Email</th>
                  <th className="dark:text-gray-200 text-gray-800">College</th>
                  <th className="dark:text-gray-200 text-gray-800">Branch</th>
                  <th className="dark:text-gray-200 text-gray-800 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="dark:border-gray-700 border-gray-200">
                    <td className="dark:text-gray-300 text-gray-700 font-medium">{user.name}</td>
                    <td className="dark:text-gray-300 text-gray-700">{user.email}</td>
                    <td className="dark:text-gray-300 text-gray-700">{user.college}</td>
                    <td className="dark:text-gray-300 text-gray-700">{user.branch}</td>
                    <td className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://github.com/${user.githubUsername}`, '_blank')}
                              className="dark:text-purple-400 text-purple-600 dark:hover:text-purple-300 hover:text-purple-700 dark:hover:bg-purple-900/80 hover:bg-purple-100/90 cursor-pointer transition-all duration-200"
                            >
                              <LucideGithub className="mr-1 h-4 w-4" />
                              <span className="hidden md:inline">View GitHub Profile</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            {`View ${user.name}'s GitHub Profile`}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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