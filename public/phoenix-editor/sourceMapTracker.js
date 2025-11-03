/**
 * Source Map Tracker
 *
 * Tracks file paths and line numbers for elements using React DevTools data,
 * stack traces, and intelligent heuristics
 */

(() => {
  'use strict';

  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('[SourceMapTracker]', ...args);
  }

  class SourceMapTracker {
    constructor() {
      this.elementSourceMap = new Map(); // phoenixId -> { filePath, lineNumber }
      this.componentFileCache = new Map(); // componentName -> filePath
      this.projectRoot = this.detectProjectRoot();

      log('Initialized with project root:', this.projectRoot);
    }

    /**
     * Detect project root from script sources
     */
    detectProjectRoot() {
      // Try to find the root from webpack/vite dev server
      const scripts = Array.from(document.scripts);

      for (const script of scripts) {
        const src = script.src;

        // Webpack dev server pattern: http://localhost:3000/src/...
        if (src.includes('/src/')) {
          const rootMatch = src.match(/^(https?:\/\/[^\/]+)(\/.*)/);
          if (rootMatch) {
            return rootMatch[1];
          }
        }

        // Vite pattern: http://localhost:5173/@fs/Users/...
        if (src.includes('/@fs/')) {
          const fsMatch = src.match(/\/@fs(\/[^?]+)/);
          if (fsMatch) {
            const fullPath = fsMatch[1];
            // Extract up to src/ or app/
            const projectMatch = fullPath.match(/^(.+?)\/(src|app)\//);
            if (projectMatch) {
              return projectMatch[1];
            }
          }
        }
      }

      return '/'; // Fallback
    }

    /**
     * Extract file path from element using multiple strategies
     */
    extractFilePath(element) {
      // Strategy 1: Check for explicit data attributes
      const explicitPath = this.checkExplicitAttributes(element);
      if (explicitPath) return explicitPath;

      // Strategy 2: Check React Fiber (if available)
      const fiberPath = this.extractFromReactFiber(element);
      if (fiberPath) return fiberPath;

      // Strategy 3: Check stack trace
      const stackPath = this.extractFromStackTrace(element);
      if (stackPath) return stackPath;

      // Strategy 4: Derive from component structure
      const derivedPath = this.deriveFromStructure(element);
      if (derivedPath) return derivedPath;

      // Fallback
      return './src/app/page.tsx';
    }

    /**
     * Strategy 1: Check explicit data attributes
     */
    checkExplicitAttributes(element) {
      // Next.js data attributes
      const dataFile = element.getAttribute('data-file');
      if (dataFile) return this.normalizePath(dataFile);

      // Vite/Webpack source map attributes
      const dataSource = element.getAttribute('data-source');
      if (dataSource) return this.normalizePath(dataSource);

      // Custom component source
      const componentSource = element.getAttribute('data-component-source');
      if (componentSource) return this.normalizePath(componentSource);

      return null;
    }

    /**
     * Strategy 2: Extract from React Fiber (React DevTools integration)
     */
    extractFromReactFiber(element) {
      try {
        // Try to get React Fiber from element
        const fiberKey = Object.keys(element).find(key =>
          key.startsWith('__reactFiber') ||
          key.startsWith('__reactInternalInstance')
        );

        if (!fiberKey) return null;

        const fiber = element[fiberKey];
        if (!fiber) return null;

        // Navigate up fiber tree to find component with _debugSource
        let currentFiber = fiber;
        let attempts = 0;

        while (currentFiber && attempts < 20) {
          if (currentFiber._debugSource) {
            const { fileName, lineNumber } = currentFiber._debugSource;

            if (fileName) {
              const normalizedPath = this.normalizePath(fileName);
              log('Found React Fiber source:', normalizedPath, 'line:', lineNumber);

              // Store line number for later use
              if (lineNumber) {
                this.elementSourceMap.set(
                  element.getAttribute('data-phoenix-id'),
                  { filePath: normalizedPath, lineNumber }
                );
              }

              return normalizedPath;
            }
          }

          currentFiber = currentFiber.return;
          attempts++;
        }
      } catch (error) {
        log('React Fiber extraction failed:', error);
      }

      return null;
    }

    /**
     * Strategy 3: Extract from stack trace
     */
    extractFromStackTrace(element) {
      try {
        // Trigger a stack trace
        const stack = new Error().stack;
        if (!stack) return null;

        // Look for source file patterns in stack
        const lines = stack.split('\n');

        for (const line of lines) {
          // Match webpack/vite source patterns
          // Example: at Module../src/components/Button.tsx (http://localhost:3000/src/components/Button.tsx:42:15)
          const webpackMatch = line.match(/\((https?:\/\/[^:]+):(\d+):(\d+)\)/);
          if (webpackMatch) {
            const url = webpackMatch[1];
            const lineNumber = parseInt(webpackMatch[2]);

            // Extract path from URL
            const pathMatch = url.match(/\/src\/(.+)$/);
            if (pathMatch) {
              const filePath = `./src/${pathMatch[1]}`;
              log('Found stack trace source:', filePath, 'line:', lineNumber);
              return filePath;
            }
          }

          // Vite pattern: @fs/Users/.../src/components/Button.tsx:42:15
          const viteMatch = line.match(/@fs(.+):(\d+):(\d+)/);
          if (viteMatch) {
            const fullPath = viteMatch[1];
            const lineNumber = parseInt(viteMatch[2]);

            // Extract relative path
            const srcMatch = fullPath.match(/\/(src\/.+)$/);
            if (srcMatch) {
              const filePath = `./${srcMatch[1]}`;
              log('Found Vite source:', filePath, 'line:', lineNumber);
              return filePath;
            }
          }
        }
      } catch (error) {
        log('Stack trace extraction failed:', error);
      }

      return null;
    }

    /**
     * Strategy 4: Derive from component structure and naming
     */
    deriveFromStructure(element) {
      const tagName = element.tagName.toLowerCase();
      const className = element.className;
      const id = element.id;
      const textContent = element.textContent?.trim() || '';

      // Strategy 4a: Check for CSS Module class names (ComponentName_className__hash)
      if (className && typeof className === 'string') {
        const cssModuleMatch = className.match(/^([A-Z][a-zA-Z0-9]+)_/);
        if (cssModuleMatch) {
          const componentName = cssModuleMatch[1];
          const filePath = `./src/components/${componentName}/${componentName}.tsx`;
          log('Derived from CSS Module:', filePath);
          return filePath;
        }
      }

      // Strategy 4b: Analyze DOM ancestry to find component boundaries
      const ancestorPath = this.findComponentFromAncestry(element);
      if (ancestorPath) {
        return ancestorPath;
      }

      // Strategy 4c: Check for data attributes that hint at component location
      const dataComponent = element.getAttribute('data-component');
      if (dataComponent) {
        const filePath = `./src/components/${dataComponent}/${dataComponent}.tsx`;
        log('Derived from data-component:', filePath);
        return filePath;
      }

      // Strategy 4d: Map text content to known components (for story rings, posts, etc.)
      if (textContent.length > 0) {
        const contentBasedPath = this.deriveFromContent(element, textContent);
        if (contentBasedPath) {
          return contentBasedPath;
        }
      }

      return null;
    }

    /**
     * Find component from DOM ancestry
     */
    findComponentFromAncestry(element) {
      let current = element;
      let depth = 0;
      const maxDepth = 15;

      while (current && current !== document.body && depth < maxDepth) {
        // Check for component-like attributes
        const dataComponent = current.getAttribute('data-component');
        if (dataComponent) {
          const filePath = `./src/components/${dataComponent}/${dataComponent}.tsx`;
          log('Found component from ancestry:', filePath);
          return filePath;
        }

        // Check class names for component hints
        const className = current.className;
        if (className && typeof className === 'string') {
          // Look for patterns that suggest components
          // E.g., "PostCard", "StoryRing", "TopHeader"
          const classes = className.split(' ');

          for (const cls of classes) {
            // Check if class looks like a component name (PascalCase)
            if (/^[A-Z][a-z]+([A-Z][a-z]+)*$/.test(cls)) {
              const filePath = `./src/components/${cls}/${cls}.tsx`;
              log('Derived from PascalCase class:', filePath);
              return filePath;
            }

            // Check for shadcn/ui components (starts with lowercase)
            if (['card', 'button', 'avatar', 'badge', 'dialog', 'sheet'].some(ui => cls.startsWith(ui))) {
              const componentName = cls.charAt(0).toUpperCase() + cls.slice(1);
              const filePath = `./src/components/ui/${cls}.tsx`;
              log('Derived from UI component:', filePath);
              return filePath;
            }
          }
        }

        current = current.parentElement;
        depth++;
      }

      return null;
    }

    /**
     * Derive file path from content and context
     */
    deriveFromContent(element, textContent) {
      // Check if this looks like a story ring (username format)
      if (textContent.includes('_') && textContent.length < 30) {
        log('Detected story-like content:', textContent);
        return './src/components/stories/StoryRing.tsx';
      }

      // Check if this is in a post context (likes, comments, etc.)
      const hasPostIndicators = this.checkAncestorForKeywords(element, ['like', 'comment', 'share']);
      if (hasPostIndicators) {
        log('Detected post content context');
        return './src/components/posts/PostCard.tsx';
      }

      // Check if in navigation context
      const hasNavIndicators = this.checkAncestorForKeywords(element, ['home', 'explore', 'create', 'activity', 'profile']);
      if (hasNavIndicators) {
        log('Detected navigation context');
        return './src/components/layout/BottomNavigation.tsx';
      }

      return null;
    }

    /**
     * Check if ancestor elements contain certain keywords in class/id/text
     */
    checkAncestorForKeywords(element, keywords) {
      let current = element;
      let depth = 0;

      while (current && current !== document.body && depth < 10) {
        const className = current.className?.toString().toLowerCase() || '';
        const id = current.id?.toLowerCase() || '';
        const text = current.textContent?.toLowerCase() || '';

        for (const keyword of keywords) {
          if (className.includes(keyword) || id.includes(keyword) || text.includes(keyword)) {
            return true;
          }
        }

        current = current.parentElement;
        depth++;
      }

      return false;
    }

    /**
     * Extract line number using multiple strategies
     */
    extractLineNumber(element) {
      const phoenixId = element.getAttribute('data-phoenix-id');

      // Check if we already have it from React Fiber
      const cached = this.elementSourceMap.get(phoenixId);
      if (cached?.lineNumber) {
        return cached.lineNumber;
      }

      // Strategy 1: Explicit attribute
      const lineAttr = element.getAttribute('data-line-number');
      if (lineAttr) return parseInt(lineAttr);

      // Strategy 2: From React Fiber (already tried in extractFilePath)
      this.extractFromReactFiber(element); // This might set it
      const updated = this.elementSourceMap.get(phoenixId);
      if (updated?.lineNumber) {
        return updated.lineNumber;
      }

      // Strategy 3: Estimate from DOM position
      const depth = this.getElementDepth(element);
      const siblings = Array.from(element.parentElement?.children || []);
      const siblingIndex = siblings.indexOf(element);

      // Rough estimate: base line + depth + sibling offset
      return 10 + (depth * 2) + siblingIndex;
    }

    /**
     * Get column number (basic estimation)
     */
    extractColumnNumber(element) {
      const depth = this.getElementDepth(element);
      // Estimate based on indentation (2 spaces per level)
      return (depth * 2) + 1;
    }

    /**
     * Normalize file path to relative format
     */
    normalizePath(path) {
      // Remove http/https and host
      path = path.replace(/^https?:\/\/[^\/]+/, '');

      // Remove query strings and hash
      path = path.split('?')[0].split('#')[0];

      // Remove /@fs/ prefix (Vite)
      path = path.replace(/^\/@fs/, '');

      // Convert absolute to relative
      if (path.startsWith('/')) {
        // Try to extract src/ or app/ portion
        const srcMatch = path.match(/\/(src\/.+)$/);
        if (srcMatch) {
          return `./${srcMatch[1]}`;
        }

        const appMatch = path.match(/\/(app\/.+)$/);
        if (appMatch) {
          return `./${appMatch[1]}`;
        }
      }

      // Already relative
      if (path.startsWith('./') || path.startsWith('../')) {
        return path;
      }

      // Make relative
      return `./${path}`;
    }

    /**
     * Get element depth in DOM tree
     */
    getElementDepth(element) {
      let depth = 0;
      let current = element;
      while (current.parentElement && current.parentElement !== document.body) {
        depth++;
        current = current.parentElement;
      }
      return depth;
    }

    /**
     * Get source location for element
     */
    getSourceLocation(element) {
      const filePath = this.extractFilePath(element);
      const lineNumber = this.extractLineNumber(element);
      const columnNumber = this.extractColumnNumber(element);

      const location = {
        filePath,
        lineNumber,
        columnNumber,
        confidence: this.calculateConfidence(element, filePath, lineNumber)
      };

      log('Source location:', location);
      return location;
    }

    /**
     * Calculate confidence score for source location
     */
    calculateConfidence(element, filePath, lineNumber) {
      let confidence = 0;

      // High confidence if from React Fiber or explicit attributes
      if (this.checkExplicitAttributes(element)) {
        confidence += 0.9;
      } else if (this.extractFromReactFiber(element)) {
        confidence += 0.8;
      } else if (this.extractFromStackTrace(element)) {
        confidence += 0.6;
      } else {
        confidence += 0.3; // Derived/estimated
      }

      // Bonus for specific line numbers (not estimated)
      const lineAttr = element.getAttribute('data-line-number');
      const cachedLine = this.elementSourceMap.get(element.getAttribute('data-phoenix-id'))?.lineNumber;
      if (lineAttr || cachedLine) {
        confidence += 0.1;
      }

      return Math.min(confidence, 1.0);
    }

    /**
     * Clear cached data
     */
    clearCache() {
      this.elementSourceMap.clear();
      this.componentFileCache.clear();
      log('Cache cleared');
    }
  }

  // Create global instance
  window.__phoenixSourceMapTracker = new SourceMapTracker();

  // Notify parent that source map tracker is ready
  window.parent.postMessage({
    type: 'phoenix-sourcemap-tracker-ready',
    projectRoot: window.__phoenixSourceMapTracker.projectRoot,
    timestamp: Date.now()
  }, '*');

  log('✅ Source Map Tracker loaded and ready');

})();
