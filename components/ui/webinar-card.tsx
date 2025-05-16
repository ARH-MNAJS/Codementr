"use client";

import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface WebinarCardProps {
  title: string;
  description: string;
  tags?: string[];
  className?: string;
  status?: 'published' | 'draft' | 'scheduled';
  date?: string;
  viewCount?: number;
  conversionRate?: number;
  children?: React.ReactNode;
}

export function WebinarCard({
  title,
  description,
  tags = [],
  className,
  status = 'published',
  date,
  viewCount,
  conversionRate,
  children,
}: WebinarCardProps) {
  return (
    <div className={cn(
      'glass-card transition-all duration-300 border border-white/5 overflow-hidden hover:border-white/10',
      className
    )}>
      <div className="p-5">
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        {date && <p className="text-xs text-gray-400 mb-3">Created on {date}</p>}
        <p className="text-sm text-gray-300 mb-4">{description}</p>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span key={index} className="tag bg-black/30 text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {(viewCount !== undefined || conversionRate !== undefined) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {viewCount !== undefined && (
              <div className="bg-black/20 p-2 rounded-md">
                <p className="text-xs text-gray-400">Views</p>
                <p className="text-lg font-medium">{viewCount}</p>
              </div>
            )}
            {conversionRate !== undefined && (
              <div className="bg-black/20 p-2 rounded-md">
                <p className="text-xs text-gray-400">Conversion</p>
                <p className="text-lg font-medium">{conversionRate}%</p>
              </div>
            )}
          </div>
        )}
        
        {children}
      </div>
      
      <div className="bg-black/30 p-3 flex justify-between items-center border-t border-white/5">
        <div>
          <span 
            className={cn(
              "tag text-xs",
              status === 'published' ? 'tag-primary' : 
              status === 'scheduled' ? 'bg-blue-500/15 text-blue-300' :
              'bg-gray-500/15 text-gray-300'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          View Details →
        </Button>
      </div>
    </div>
  );
} 