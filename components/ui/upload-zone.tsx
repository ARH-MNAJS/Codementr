"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { LucideIcon, LucideUploadCloud } from 'lucide-react';

interface UploadZoneProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  onDrop?: (acceptedFiles: File[]) => void;
  className?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export function UploadZone({
  title,
  description = 'Drop your files here or click to browse',
  icon: Icon = LucideUploadCloud,
  onDrop,
  className,
  maxFiles = 1,
  acceptedFileTypes = ['video/*', 'audio/*', '.mp4', '.webm', '.mov', '.mp3'],
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragging(false);
    if (onDrop) {
      onDrop(acceptedFiles);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    maxFiles,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div 
      {...getRootProps()}
      className={cn(
        'glass-card h-[200px] flex flex-col items-center justify-center p-6 border border-white/5 cursor-pointer transition-all',
        isDragging && 'border-purple-500 bg-purple-500/5',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className={cn(
        "rounded-full bg-black/50 w-16 h-16 flex items-center justify-center mb-4 transition-transform",
        isDragging && "transform scale-110"
      )}>
        <Icon size={24} className={cn(
          "text-gray-300 transition-colors",
          isDragging && "text-purple-300"
        )} />
      </div>
      {title && <h3 className="text-base font-medium mb-1">{title}</h3>}
      <p className="text-center text-gray-400 text-sm">{description}</p>
    </div>
  );
}