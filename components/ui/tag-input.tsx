"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  tagClassName?: string;
  disabled?: boolean;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value, onChange, placeholder = "Add tag...", className, tagClassName, disabled = false, ...props }, ref) => {
    const [inputValue, setInputValue] = useState<string>("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        if (!value.includes(inputValue.trim())) {
          onChange([...value, inputValue.trim()]);
        }
        setInputValue("");
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        onChange(value.slice(0, -1));
      }
    };

    const removeTag = (tagToRemove: string) => {
      onChange(value.filter(tag => tag !== tagToRemove));
    };

    const focusInput = () => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    };

    return (
      <div 
        className={cn(
          "flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-md focus-within:ring-2 focus-within:ring-[#ad46ff] dark:focus-within:ring-[#c65dff] focus-within:border-transparent transition-all",
          className,
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={focusInput}
      >
        {value.map((tag, index) => (
          <div 
            key={index} 
            className={cn(
              "bg-[#ad46ff1a] dark:bg-[#ad46ff33] text-[#ad46ff] dark:text-[#d48aff] px-2 py-1 rounded-md text-sm flex items-center gap-1 group",
              tagClassName
            )}
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="text-[#ad46ff] hover:text-[#9b3be3] dark:text-[#d48aff] dark:hover:text-[#e9b8ff] rounded-full focus:outline-none focus:ring-1 focus:ring-[#ad46ff]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

TagInput.displayName = "TagInput"; 