"use client";

import { DashboardLayout } from "../components/layout";
import { Button } from "@/components/ui/button";
import { checkAuth } from "@/lib/auth";
import { LucidePlus, LucideStripe, LucideCpu, LucideVideo, LucideUploadCloud } from "lucide-react";
import Link from "next/link";
import { StepCard } from "@/components/ui/step-card";
import { UploadZone } from "@/components/ui/upload-zone";
import { WebinarCard } from "@/components/ui/webinar-card";

export default function Dashboard() {
  // Handle auth check client-side or in middleware
  // await checkAuth();

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Get maximum Conversion from your webinars</h1>
        <Link href="/dashboard/webinars/create">
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 rounded-md flex items-center gap-2">
            <LucidePlus size={18} />
            Create Webinar
          </Button>
        </Link>
      </div>

      <div className="mb-10">
        <StepCard
          stepNumber={1}
          title="Connect Stripe"
          description="Connect your Stripe account to start accepting payments"
          icon={LucideStripe}
          active={true}
          onClick={() => console.log('Connect Stripe')}
        />

        <StepCard
          stepNumber={2}
          title="Create AI Assistant"
          description="Set up an AI agent to automate your webinar interactions"
          icon={LucideCpu}
          onClick={() => console.log('Create AI Assistant')}
        />

        <StepCard
          stepNumber={3}
          title="Create a webinar"
          description="Set up your first webinar to start collecting leads"
          icon={LucideVideo}
          onClick={() => console.log('Create a webinar')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">Browse or drag a pre-recorded webinar file</h2>
          <UploadZone 
            description="Drop your webinar file here or click to browse"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Browse or drag a pre-recorded webinar file</h2>
          <UploadZone 
            icon={LucideVideo}
            description="Record a live webinar or upload existing recording"
          />
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Recent Webinars</h2>
          <Link href="/dashboard/webinars">
            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-white/5">
              View All →
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WebinarCard
            title="Introduction to Product"
            description="Learn about our amazing product and how it can help your business grow."
            date="May 10, 2025"
            tags={["Marketing", "Product"]}
            viewCount={120}
            conversionRate={24}
            status="published"
          />
          <WebinarCard
            title="Advanced Features Walkthrough"
            description="Deep dive into the advanced features of our platform."
            date="June 2, 2025"
            tags={["Tutorial", "Advanced"]}
            viewCount={85}
            conversionRate={18}
            status="scheduled"
          />
          <WebinarCard
            title="Customer Success Stories"
            description="Real customers share their success stories using our platform."
            date="April 28, 2025"
            tags={["Testimonial", "Case Study"]}
            viewCount={210}
            conversionRate={32}
            status="draft"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">See how far along are your potential customers</h2>
          <div className="glass-card p-0 overflow-hidden border border-white/5">
            <div className="bg-black/30 p-4 border-b border-white/5 mb-0 flex justify-between items-center">
              <h3 className="font-medium">Conversions</h3>
              <span className="text-purple-400">50</span>
            </div>
            <div className="divide-y divide-white/5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="mb-2">
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-gray-400">johndoe@gmail.com</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="tag tag-primary">New Customer</span>
                    <span className="tag">Tag 2</span>
                    <span className="tag">Tag 3</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 flex justify-end border-t border-white/5">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-white/5">
                View All →
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">See the list of your current customers</h2>
          <div className="glass-card p-0 overflow-hidden border border-white/5">
            <div className="divide-y divide-white/5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between mb-1">
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-400">johndoe@gmail.com</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>Updated At:</p>
                      <p>May 12, 2025</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="tag">New</span>
                    <span className="tag tag-hot">Hot Lead</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 flex justify-end border-t border-white/5">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-white/5">
                View All →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}