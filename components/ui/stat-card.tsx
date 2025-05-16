import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      'glass-card p-5 border border-white/5 transition-all duration-300 hover:border-white/10',
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div className={cn(
          'text-xs mt-1',
          trend.positive ? 'text-green-400' : 'text-red-400'
        )}>
          {trend.positive ? '↑ ' : '↓ '}{trend.value}
        </div>
      )}
    </div>
  );
} 