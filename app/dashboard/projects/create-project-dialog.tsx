"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LucidePlus } from "lucide-react";
import { motion } from "framer-motion";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <LucidePlus size={18} />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new AI-assisted project to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <input
              id="name"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="My Awesome Project"
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              placeholder="Describe your project..."
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="type" className="text-sm font-medium">
              Project Type
            </label>
            <select
              id="type"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="web">Web Application</option>
              <option value="mobile">Mobile App</option>
              <option value="ml">Machine Learning</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={() => {
              // Handle project creation logic
              setOpen(false);
            }}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 