"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  count?: number;
  className?: string;
  onViewAll?: () => void;
}

export function DataTable({
  columns,
  data,
  title,
  count,
  className,
  onViewAll,
}: DataTableProps) {
  return (
    <div className={cn(
      'glass-card p-0 overflow-hidden border border-white/5',
      className
    )}>
      {(title || count !== undefined) && (
        <div className="bg-black/30 p-4 border-b border-white/5 mb-0 flex justify-between items-center">
          {title && <h3 className="font-medium">{title}</h3>}
          {count !== undefined && <span className="text-purple-400">{count}</span>}
        </div>
      )}
      
      <div className="divide-y divide-white/5">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="p-4 hover:bg-white/5 transition-colors">
            <div className="grid" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
              {columns.map((column, colIndex) => (
                <div key={colIndex} className={colIndex === 0 ? 'mb-0' : 'mb-0 text-gray-400'}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {onViewAll && (
        <div className="p-4 flex justify-end border-t border-white/5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll} 
            className="text-purple-400 hover:text-purple-300 hover:bg-white/5"
          >
            View All →
          </Button>
        </div>
      )}
    </div>
  );
} 