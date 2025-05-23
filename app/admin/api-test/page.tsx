"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "../../components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ApiTest() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sample data for context generation
  const [projectData, setProjectData] = useState({
    title: "Center Text Project",
    description: "A project focused on implementing various techniques for centering text in web applications",
    repositoryName: "center-text"
  });
  
  const [milestoneData, setMilestoneData] = useState({
    title: "Basic CSS Centering",
    commitTitle: "Implement basic CSS centering",
    description: "Implement text-align and vertical alignment techniques",
    files: ["index.html", "styles.css"]
  });
  
  const [goalData, setGoalData] = useState({
    goal: "Center text horizontally with text-align",
    milestoneTitle: "Basic CSS Centering"
  });

  const testApiKey = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate-context');
      const data = await response.json();
      
      setTestResult(data);
    } catch (error: any) {
      console.error("API test failed:", error);
      setError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateProjectContext = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/ai/generate-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'project',
          projectTitle: projectData.title,
          projectDescription: projectData.description,
          repositoryName: projectData.repositoryName
        })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      console.error("Context generation failed:", error);
      setError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateMilestoneContext = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/ai/generate-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'milestone',
          projectTitle: projectData.title,
          projectDescription: projectData.description,
          milestoneTitle: milestoneData.title,
          milestoneCommitTitle: milestoneData.commitTitle,
          milestoneDescription: milestoneData.description,
          milestoneFiles: milestoneData.files
        })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      console.error("Context generation failed:", error);
      setError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateGoalContext = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/ai/generate-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'goal',
          projectTitle: projectData.title,
          milestoneTitle: goalData.milestoneTitle,
          goal: goalData.goal
        })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      console.error("Context generation failed:", error);
      setError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">API Configuration & Context Test</h1>
        
        <Tabs defaultValue="api-key">
          <TabsList className="mb-4">
            <TabsTrigger value="api-key">API Key Test</TabsTrigger>
            <TabsTrigger value="project">Project Context</TabsTrigger>
            <TabsTrigger value="milestone">Milestone Context</TabsTrigger>
            <TabsTrigger value="goal">Goal Context</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-key" className="space-y-4">
            <Card className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Gemini API Key Test</h2>
              <p className="text-sm text-gray-500 mb-4">
                Test if your Gemini API key is correctly configured and working.
              </p>
              
              <Button 
                onClick={testApiKey} 
                disabled={isLoading}
                className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
              >
                {isLoading ? 'Testing...' : 'Test API Key'}
              </Button>
            </Card>
            
            <Card className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
              <p className="text-sm text-gray-500 mb-2">
                Make sure these environment variables are set in your .env.local file:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code>GEMINI_API_KEY</code> or <code>GOOGLE_AI_API_KEY</code></li>
              </ul>
            </Card>
          </TabsContent>
          
          <TabsContent value="project" className="space-y-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3">Generate Project Context</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Title</label>
                  <Input 
                    value={projectData.title}
                    onChange={(e) => setProjectData({...projectData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Project Description</label>
                  <Textarea 
                    value={projectData.description}
                    onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Repository Name</label>
                  <Input 
                    value={projectData.repositoryName}
                    onChange={(e) => setProjectData({...projectData, repositoryName: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={generateProjectContext} 
                  disabled={isLoading || !projectData.title}
                  className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                >
                  {isLoading ? 'Generating...' : 'Generate Project Context'}
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="milestone" className="space-y-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3">Generate Milestone Context</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Milestone Title</label>
                  <Input 
                    value={milestoneData.title}
                    onChange={(e) => setMilestoneData({...milestoneData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Commit Title</label>
                  <Input 
                    value={milestoneData.commitTitle}
                    onChange={(e) => setMilestoneData({...milestoneData, commitTitle: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea 
                    value={milestoneData.description}
                    onChange={(e) => setMilestoneData({...milestoneData, description: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Files (comma-separated)</label>
                  <Input 
                    value={milestoneData.files.join(', ')}
                    onChange={(e) => setMilestoneData({...milestoneData, files: e.target.value.split(',').map(f => f.trim())})}
                  />
                </div>
                
                <Button 
                  onClick={generateMilestoneContext} 
                  disabled={isLoading || !milestoneData.title}
                  className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                >
                  {isLoading ? 'Generating...' : 'Generate Milestone Context'}
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="goal" className="space-y-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3">Generate Goal Context</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Goal</label>
                  <Textarea 
                    value={goalData.goal}
                    onChange={(e) => setGoalData({...goalData, goal: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Milestone Title</label>
                  <Input 
                    value={goalData.milestoneTitle}
                    onChange={(e) => setGoalData({...goalData, milestoneTitle: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={generateGoalContext} 
                  disabled={isLoading || !goalData.goal}
                  className="bg-[#ad46ff] hover:bg-[#9b3be3] text-white"
                >
                  {isLoading ? 'Generating...' : 'Generate Goal Context'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {testResult && (
          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <h3 className="font-medium mb-2">Result:</h3>
            {testResult.context ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Context Type: {testResult.type}</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                  <p className="whitespace-pre-wrap">{testResult.context}</p>
                </div>
              </div>
            ) : (
              <pre className="text-xs overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </Card>
        )}
        
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-300">Troubleshooting:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2 text-yellow-700 dark:text-yellow-400">
            <li>Check if your API key is valid and not expired</li>
            <li>Ensure you have the correct permissions for the Gemini API</li>
            <li>Verify your API key in the Google AI Studio dashboard</li>
            <li>Check server logs for detailed error messages</li>
            <li>The API has rate limits - if generation fails, wait a minute and try again</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
} 