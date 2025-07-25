
import React from 'react';
import { cn } from "@/lib/utils";

interface SafeChartProps {
  className?: string;
  children: React.ReactNode;
}

export const SafeChart: React.FC<SafeChartProps> = ({ className, children }) => {
  return (
    <div className={cn("recharts-wrapper", className)}>
      {children}
    </div>
  );
};

// Safe alternative to dangerouslySetInnerHTML
export const SafeHtmlContent: React.FC<{ 
  content: string;
  className?: string;
}> = ({ content, className }) => {
  // Sanitize HTML content by removing dangerous tags and attributes
  const sanitizeHtml = (html: string) => {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
