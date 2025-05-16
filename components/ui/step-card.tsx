"use client";

import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon?: LucideIcon;
  active?: boolean;
  completed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StepCard({
  stepNumber,
  title,
  description,
  icon: Icon,
  active = false,
  completed = false,
  onClick,
  className,
}: StepCardProps) {
  return (
    <div 
      className={cn(
        'glass-card p-4 border border-white/5 mb-4 transition-all', 
        active && 'border-l-4 border-l-purple-500',
        completed && 'border-l-4 border-l-green-500',
        className
      )}
    >
      <div className="flex items-center gap-4 p-2">
        <div 
          className={cn(
            'flex items-center justify-center rounded-full w-10 h-10',
            active ? 'bg-purple-500/10' : completed ? 'bg-green-500/10' : 'bg-white/5'
          )}
        >
          {Icon ? (
            <Icon className={cn(
              'h-5 w-5',
              active ? 'text-purple-400' : completed ? 'text-green-400' : 'text-gray-400'
            )} />
          ) : (
            <span className={cn(
              'text-white',
              active ? 'text-purple-200' : completed ? 'text-green-200' : 'text-gray-400'
            )}>
              {stepNumber}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={onClick}
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          <span className="sr-only">Go to step</span>
          →
        </Button>
      </div>
    </div>
  );
} 