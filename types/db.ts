export interface User {
  _id?: string;
  name: string;
  email: string;
  college: string;
  branch: string;
  githubUsername: string;
  githubToken?: string;
  connectedProjects?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface College {
  _id?: string;
  name: string;
  branches: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  _id?: string;
  title: string;
  description: string;
  repositoryName: string;
  connectedRepo?: string;
  collegeId: string;
  branch: string;
  structureImage?: string;
  previewUrl?: string;
  milestones: Milestone[];
  createdAt?: Date;
  updatedAt?: Date;
  context?: string;
}

export interface Milestone {
  title: string;
  commitTitle: string;
  goals: string;
  description?: string;
  expectedFiles: string[];
  completed?: boolean;
  completedGoals?: string[];
  context?: string;
  goalContexts?: Record<string, string>;
  commitSha?: string;
  detected?: boolean;
} 