import { DashboardLayout } from "../../components/layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkAuth } from "@/lib/auth";
import { LucidePlus } from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";

export default async function Projects() {
  await checkAuth();

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <CreateProjectDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Project {i + 1}</CardTitle>
              <CardDescription>Last updated {i + 1} days ago</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This is a description of the project and what it does.
                {i % 2 === 0 ? " It involves AI and machine learning." : " It focuses on web development."}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  View
                </Button>
                <Button variant="default" size="sm">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
} 