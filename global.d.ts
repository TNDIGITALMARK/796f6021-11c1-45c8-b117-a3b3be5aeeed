// Global TypeScript declarations for absolutely lenient builds
// This file prevents TypeScript from failing on unknown modules/imports

// Catch-all module declaration - handles any unknown imports
declare module "*" {
  const content: any;
  export default content;
  export = content;
}

// Asset type shims - prevents build failures on media imports
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

declare module "*.avif" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.ico" {
  const value: string;
  export default value;
}

// CSS modules
declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.sass" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Font files
declare module "*.woff" {
  const value: string;
  export default value;
}

declare module "*.woff2" {
  const value: string;
  export default value;
}

declare module "*.ttf" {
  const value: string;
  export default value;
}

declare module "*.otf" {
  const value: string;
  export default value;
}

declare module "*.eot" {
  const value: string;
  export default value;
}

// Video and audio
declare module "*.mp4" {
  const value: string;
  export default value;
}

declare module "*.webm" {
  const value: string;
  export default value;
}

declare module "*.mp3" {
  const value: string;
  export default value;
}

declare module "*.wav" {
  const value: string;
  export default value;
}

// Data files
declare module "*.json" {
  const value: any;
  export default value;
}

declare module "*.xml" {
  const value: string;
  export default value;
}

declare module "*.txt" {
  const value: string;
  export default value;
}

// Common library modules that might not have types
declare module "*.md" {
  const value: string;
  export default value;
}

declare module "*.mdx" {
  const value: any;
  export default value;
}

// Global type extensions for maximum compatibility
declare global {
  // Browser APIs that might not be available in all environments
  interface Window {
    [key: string]: any;
  }

  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

// Export empty object to make this a module
export {};