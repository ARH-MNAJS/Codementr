import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== VERIFY COMMIT DEBUG START ===");
    console.log("Project ID:", params.id);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Session user:", {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ? "Has image" : "No image"
    });

    // Check valid id
    if (!ObjectId.isValid(params.id)) {
      console.log("Invalid project ID format");
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }
    
    // Get the project
    const projectsCollection = await getCollection('projects');
    const project = await projectsCollection.findOne({ _id: new ObjectId(params.id) });
    
    console.log("Project found:", {
      id: params.id,
      title: project?.title,
      connectedRepo: project?.connectedRepo,
      hasMilestones: project?.milestones?.length > 0
    });
    
    if (!project) {
      console.log("Project not found");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    // Get the user to access their GitHub info
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    
    // For debugging
    console.log("User data:", {
      email: session.user.email,
      hasGithub: !!user?.github,
      githubUsername: user?.github?.username || "Not found",
      githubApiUrl: user?.github?.apiUrl || "Not found",
      githubOwner: user?.github?.owner || "Not found"
    });
    
    // Get request parameters
    const requestBody = await req.json();
    console.log("Request body:", requestBody);
    
    const { repoName, expectedCommitTitle, milestoneTitle } = requestBody;
    
    if (!repoName || !expectedCommitTitle) {
      console.log("Missing required parameters");
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Use owner directly from user.github.owner as shown in DB screenshot
    const owner = user?.github?.owner || "ARH-MNAJS"; // Fallback to the correct owner name
    
    console.log("GitHub credentials:", {
      owner: owner,
      repo: repoName
    });
    
    if (!owner) {
      console.log("GitHub owner not found");
      return NextResponse.json({ error: "GitHub owner not found" }, { status: 400 });
    }
    
    // Construct GitHub API URL using the specific format with correct owner name
    const commitsUrl = `https://api.github.com/repos/${owner}/${repoName}/commits`;
    
    console.log("Final GitHub API URL:", commitsUrl);
    
    // Fetch the latest commits from GitHub
    console.log("Making GitHub API request with token:", 
      process.env.GITHUB_ACCESS_TOKEN ? "Token available" : "No token found");
    
    const response = await fetch(commitsUrl, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    console.log("GitHub API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      console.log("GitHub API headers:", Object.fromEntries(response.headers.entries()));
      console.log("=== VERIFY COMMIT DEBUG END ===");
      
      return NextResponse.json({ 
        error: "Failed to fetch commits from GitHub", 
        details: errorText,
        statusCode: response.status,
        url: commitsUrl.replace(process.env.GITHUB_ACCESS_TOKEN || "", "TOKEN")
      }, { status: 500 });
    }
    
    const commits = await response.json();
    
    // Debug the commits response
    console.log(`Received ${commits.length} commits from GitHub`);
    if (commits.length > 0) {
      console.log("Latest commit:", {
        message: commits[0].commit.message,
        author: commits[0].commit.author
      });
    } else {
      console.log("No commits found in response");
    }
    
    if (!commits || commits.length === 0) {
      console.log("=== VERIFY COMMIT DEBUG END ===");
      return NextResponse.json({ 
        matched: false,
        message: "No commits found in repository" 
      });
    }
    
    // Find the active milestone
    const milestoneIndex = project.milestones.findIndex(
      (m) => m.title === milestoneTitle && !m.completed
    );
    
    console.log("Milestone check:", {
      milestoneTitle,
      milestoneIndex,
      isCompleted: milestoneIndex >= 0 ? project.milestones[milestoneIndex].completed : "N/A"
    });
    
    if (milestoneIndex === -1) {
      console.log("Milestone not found or already completed");
      console.log("=== VERIFY COMMIT DEBUG END ===");
      return NextResponse.json({ error: "Milestone not found or already completed" }, { status: 400 });
    }
    
    // Check if any of the latest commits match the expected commit title
    // We'll check the 5 most recent commits
    const recentCommits = commits.slice(0, 5);
    console.log("Checking recent commits:", recentCommits.map(c => ({
      message: c.commit.message,
      date: c.commit.author.date
    })));
    
    const matchingCommit = recentCommits.find((commit) => {
      // Compare case-insensitive and trim whitespace
      const commitMessage = commit.commit.message.trim().toLowerCase();
      const expectedTitle = expectedCommitTitle.trim().toLowerCase();
      
      return commitMessage.includes(expectedTitle);
    });
    
    if (matchingCommit) {
      console.log("Found matching commit:", matchingCommit.commit.message);
      
      // Update the milestone as detected (not completed) in the database
      const updatedMilestones = [...project.milestones];
      updatedMilestones[milestoneIndex].detected = true;
      updatedMilestones[milestoneIndex].commitSha = matchingCommit.sha;
      
      await projectsCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { milestones: updatedMilestones } }
      );
      
      console.log("Updated milestone detection status and stored commit SHA");
      console.log("=== VERIFY COMMIT DEBUG END ===");
      
      return NextResponse.json({ 
        matched: true,
        message: `Matched commit: ${matchingCommit.commit.message}`,
        commitUrl: matchingCommit.html_url,
        commitSha: matchingCommit.sha
      });
    } else {
      console.log("No matching commit found for expected title:", expectedCommitTitle);
      console.log("=== VERIFY COMMIT DEBUG END ===");
      
      return NextResponse.json({ 
        matched: false,
        message: "No matching commit found",
        expectedTitle: expectedCommitTitle,
        latestCommitTitle: commits[0].commit.message
      });
    }
    
  } catch (error) {
    console.error("Error verifying commit:", error);
    console.log("=== VERIFY COMMIT DEBUG END (ERROR) ===");
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 