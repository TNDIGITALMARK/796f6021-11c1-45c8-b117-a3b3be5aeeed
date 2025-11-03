/**
 * Visual Edit Extension for Phoenix Helper
 * 
 * Extends the existing helper.js with optimistic visual editing capabilities
 * This script should be loaded after helper.js to add visual editing features
 */

(() => {
  'use strict';

  // Configuration
  const VISUAL_EDIT_CONFIG = {
    projectId: window.__PHOENIX_PROJECT_ID__ || 'default-project',
    apiBaseUrl: '/api/ast-editor',
    enableOptimisticUpdates: true,
    enableDebugLogging: true
  };

  console.log('🎨 Visual Edit Extension Loading...', VISUAL_EDIT_CONFIG);

  // ========================================
  // OPTIMISTIC STYLE EDITOR
  // ========================================
  
  class OptimisticStyleEditor {
    constructor() {
      this.pendingUpdates = new Map();
      this.originalStyles = new Map();
    }

    applyOptimisticChange(phoenixId, property, value) {
      const element = document.querySelector(`[data-phoenix-id="${phoenixId}"]`);
      if (!element) {
        console.warn('🎨 OptimisticStyleEditor: Element not found:', phoenixId);
        return false;
      }

      try {
        // Store original state for rollback
        if (!this.originalStyles.has(phoenixId)) {
          this.originalStyles.set(phoenixId, {
            className: element.className,
            style: element.getAttribute('style') || '',
            computedStyle: this.captureComputedStyle(element)
          });
        }

        // Apply change based on property type
        if (this.isTextContentProperty(property)) {
          this.updateTextContent(element, value);
        } else if (this.isTailwindClass(property, value)) {
          this.updateTailwindClasses(element, property, value);
        } else if (this.isInlineStyle(property)) {
          this.updateInlineStyle(element, property, value);
        } else {
          console.warn('🎨 Unknown property type:', property);
          return false;
        }

        // Track the update
        const update = {
          phoenixId,
          changes: [{ property, value }],
          timestamp: Date.now()
        };
        this.pendingUpdates.set(phoenixId, update);

        console.log('🎨 OptimisticStyleEditor: Applied change:', { phoenixId, property, value });
        return true;

      } catch (error) {
        console.error('🎨 OptimisticStyleEditor: Failed to apply change:', error);
        return false;
      }
    }

    updateTailwindClasses(element, property, value) {
      const currentClasses = Array.from(element.classList);
      
      // Remove existing classes of the same type
      const classesToRemove = this.getConflictingTailwindClasses(currentClasses, property);
      classesToRemove.forEach(cls => element.classList.remove(cls));
      
      // Add new class
      if (value && value !== 'none') {
        element.classList.add(value);
      }
    }

    updateInlineStyle(element, property, value) {
      const cssProperty = this.toCSSProperty(property);
      element.style.setProperty(cssProperty, value);
    }

    updateTextContent(element, value) {
      // Only update direct text nodes, not child elements
      const textNodes = [];
      for (let node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node);
        }
      }

      if (textNodes.length > 0) {
        // Update first text node (most common case)
        textNodes[0].textContent = value;
      } else if (element.childNodes.length === 0) {
        // Element has no children, safe to set textContent
        element.textContent = value;
      } else {
        // Element has children but no direct text nodes
        // Create a text node and prepend it
        const textNode = document.createTextNode(value);
        element.insertBefore(textNode, element.firstChild);
      }
    }

    getConflictingTailwindClasses(currentClasses, property) {
      const conflicts = {
        'backgroundColor': ['bg-'],
        'color': ['text-'],
        'padding': ['p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-'],
        'margin': ['m-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-'],
        'width': ['w-'],
        'height': ['h-'],
        'fontSize': ['text-'],
        'fontWeight': ['font-'],
        'borderRadius': ['rounded-'],
        'border': ['border-'],
        'shadow': ['shadow-']
      };

      const prefixes = conflicts[property] || [];
      return currentClasses.filter(cls => 
        prefixes.some(prefix => cls.startsWith(prefix))
      );
    }

    rollbackOptimisticChange(phoenixId) {
      const element = document.querySelector(`[data-phoenix-id="${phoenixId}"]`);
      const original = this.originalStyles.get(phoenixId);
      
      if (!element || !original) {
        console.warn('🎨 OptimisticStyleEditor: Cannot rollback, element or original state not found');
        return false;
      }

      try {
        // Restore original state
        element.className = original.className;
        element.setAttribute('style', original.style);
        
        // Clean up tracking
        this.pendingUpdates.delete(phoenixId);
        this.originalStyles.delete(phoenixId);
        
        console.log('🎨 OptimisticStyleEditor: Rolled back change:', phoenixId);
        return true;
        
      } catch (error) {
        console.error('🎨 OptimisticStyleEditor: Failed to rollback:', error);
        return false;
      }
    }

    confirmOptimisticChange(phoenixId) {
      // Clean up tracking but keep the visual changes
      this.pendingUpdates.delete(phoenixId);
      this.originalStyles.delete(phoenixId);
      console.log('🎨 OptimisticStyleEditor: Confirmed change:', phoenixId);
    }

    isTailwindClass(property, value) {
      const tailwindPatterns = [
        /^bg-/, /^text-/, /^p-/, /^m-/, /^w-/, /^h-/, 
        /^font-/, /^rounded-/, /^border-/, /^shadow-/
      ];
      return tailwindPatterns.some(pattern => pattern.test(value));
    }

    isInlineStyle(property) {
      return ['color', 'backgroundColor', 'fontSize', 'width', 'height', 'padding', 'margin'].includes(property);
    }

    isTextContentProperty(property) {
      return property === 'textContent' || property === 'text';
    }

    toCSSProperty(property) {
      return property.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    captureComputedStyle(element) {
      const computed = window.getComputedStyle(element);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight
      };
    }

    getPendingUpdates() {
      return this.pendingUpdates;
    }
  }

  // ========================================
  // HELPER API BRIDGE
  // ========================================
  
  class HelperAPIBridge {
    constructor(projectId, apiBaseUrl) {
      this.projectId = projectId;
      this.apiBaseUrl = apiBaseUrl;
      this.optimisticEditor = new OptimisticStyleEditor();
    }

    async processVisualEdit(request) {
      const { phoenixId, property, value } = request;
      
      try {
        console.log('🎯 HelperAPIBridge: Processing visual edit:', request);

        // Step 1: Apply optimistic change immediately
        const optimisticSuccess = this.optimisticEditor.applyOptimisticChange(
          phoenixId, 
          property, 
          value
        );

        if (!optimisticSuccess) {
          return {
            success: false,
            phoenixId,
            error: 'Failed to apply optimistic change'
          };
        }

        // Step 2: Optimistic update only (no server call)
        // The inlineTextEditor will send postMessage to parent for AST persistence
        console.log('✅ HelperAPIBridge: Optimistic visual edit applied (AST persistence via postMessage):', phoenixId);

        // Immediately confirm the optimistic change
        this.optimisticEditor.confirmOptimisticChange(phoenixId);

        return {
          success: true,
          phoenixId,
          changes: [{ property, value }],
          note: 'Optimistic update - AST persistence handled by postMessage'
        };

      } catch (error) {
        console.error('❌ HelperAPIBridge: Visual edit error:', error);
        
        // Rollback optimistic change on any error
        this.optimisticEditor.rollbackOptimisticChange(phoenixId);
        
        return {
          success: false,
          phoenixId,
          error: error instanceof Error ? error.message : 'Unknown error',
          rollback: true
        };
      }
    }

    async sendToASTEditor(request) {
      const endpoint = `${this.apiBaseUrl}/visual-edit`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`AST Editor API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    }

    resetAllOptimisticChanges() {
      const pending = this.optimisticEditor.getPendingUpdates();
      pending.forEach((_, phoenixId) => {
        this.optimisticEditor.rollbackOptimisticChange(phoenixId);
      });
      console.log('🎯 HelperAPIBridge: Reset all optimistic changes');
    }
  }

  // ========================================
  // VISUAL EDIT COORDINATOR
  // ========================================
  
  class VisualEditCoordinator {
    constructor(config) {
      this.config = {
        enableOptimisticUpdates: true,
        enableDebugLogging: true,
        ...config
      };
      
      this.bridge = new HelperAPIBridge(config.projectId, config.apiBaseUrl);
      this.editableProperties = this.setupEditableProperties();
      
      if (this.config.enableDebugLogging) {
        console.log('🎯 VisualEditCoordinator initialized:', this.config);
      }
    }

    async handleVisualEdit(phoenixId, property, value) {
      if (!this.isEditableProperty(phoenixId, property)) {
        console.warn('🎯 Property not editable:', { phoenixId, property });
        return false;
      }

      try {
        const result = await this.bridge.processVisualEdit({
          phoenixId,
          property,
          value,
          projectId: this.config.projectId
        });

        if (this.config.enableDebugLogging) {
          console.log('🎯 Visual edit result:', result);
        }

        return result.success;
      } catch (error) {
        console.error('🎯 Visual edit failed:', error);
        return false;
      }
    }

    isEditableProperty(phoenixId, property) {
      const commonEditableProperties = [
        'backgroundColor', 'color', 'fontSize', 'fontWeight',
        'padding', 'margin', 'width', 'height', 'borderRadius',
        'textContent'
      ];
      
      return commonEditableProperties.includes(property) || 
             this.isTailwindClass(property);
    }

    isTailwindClass(property) {
      const tailwindPrefixes = [
        'bg-', 'text-', 'p-', 'm-', 'w-', 'h-', 
        'font-', 'rounded-', 'border-', 'shadow-'
      ];
      return tailwindPrefixes.some(prefix => property.startsWith(prefix));
    }

    setupEditableProperties() {
      return [
        { name: 'backgroundColor', type: 'tailwind-class', category: 'colors' },
        { name: 'color', type: 'tailwind-class', category: 'colors' },
        { name: 'fontSize', type: 'tailwind-class', category: 'typography' },
        { name: 'fontWeight', type: 'tailwind-class', category: 'typography' },
        { name: 'textContent', type: 'text-content', category: 'typography' },
        { name: 'padding', type: 'tailwind-class', category: 'spacing' },
        { name: 'margin', type: 'tailwind-class', category: 'spacing' },
        { name: 'width', type: 'tailwind-class', category: 'layout' },
        { name: 'height', type: 'tailwind-class', category: 'layout' },
        { name: 'borderRadius', type: 'tailwind-class', category: 'styling' }
      ];
    }

    resetOptimisticChanges() {
      this.bridge.resetAllOptimisticChanges();
    }

    getStatus() {
      return {
        config: this.config,
        editablePropertiesCount: this.editableProperties.length
      };
    }
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  // Initialize visual edit coordinator
  const visualEditCoordinator = new VisualEditCoordinator(VISUAL_EDIT_CONFIG);

  // ========================================
  // MESSAGE HANDLING EXTENSION
  // ========================================

  // Listen for visual edit requests from parent window
  window.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};
    
    if (type === 'visual-edit-request') {
      const { phoenixId, property, value } = payload;
      
      console.log('🎨 Received visual edit request:', payload);
      
      visualEditCoordinator.handleVisualEdit(phoenixId, property, value)
        .then(success => {
          // Send response back to parent
          window.parent.postMessage({
            type: 'visual-edit-response',
            payload: {
              phoenixId,
              property,
              value,
              success,
              timestamp: Date.now()
            }
          }, '*');
        })
        .catch(error => {
          console.error('🎨 Visual edit request failed:', error);
          window.parent.postMessage({
            type: 'visual-edit-response',
            payload: {
              phoenixId,
              property,
              value,
              success: false,
              error: error.message,
              timestamp: Date.now()
            }
          }, '*');
        });
    } else if (type === 'visual-edit-optimistic') {
      // Handle optimistic update request from parent
      const { phoenixId, changes } = payload;
      
      Object.entries(changes).forEach(([property, value]) => {
        visualEditCoordinator.bridge.optimisticEditor.applyOptimisticChange(
          phoenixId, 
          property, 
          value
        );
      });
    } else if (type === 'visual-edit-reset') {
      // Reset all optimistic changes
      visualEditCoordinator.resetOptimisticChanges();
    }
  });

  // ========================================
  // GLOBAL API
  // ========================================

  // Extend the existing debug API
  if (window.__editorHelperEnhanced) {
    Object.assign(window.__editorHelperEnhanced, {
      // Visual editing capabilities
      visualEdit: (phoenixId, property, value) => {
        return visualEditCoordinator.handleVisualEdit(phoenixId, property, value);
      },
      resetOptimistic: () => {
        visualEditCoordinator.resetOptimisticChanges();
      },
      getVisualEditStatus: () => {
        return visualEditCoordinator.getStatus();
      }
    });
  }

  // Also create standalone global API
  window.__phoenixVisualEditor = {
    handleVisualEdit: (phoenixId, property, value) => {
      return visualEditCoordinator.handleVisualEdit(phoenixId, property, value);
    },
    resetOptimisticChanges: () => {
      visualEditCoordinator.resetOptimisticChanges();
    },
    getStatus: () => {
      return visualEditCoordinator.getStatus();
    }
  };

  console.log('✅ Visual Edit Extension loaded and ready!');
  console.log('🎯 Available via window.__phoenixVisualEditor');

  // Notify parent that visual editing is ready
  try {
    window.parent.postMessage({
      type: 'visual-edit-ready',
      payload: {
        projectId: VISUAL_EDIT_CONFIG.projectId,
        capabilities: visualEditCoordinator.editableProperties.map(p => p.name),
        timestamp: Date.now()
      }
    }, '*');
  } catch (error) {
    console.error('🎨 Failed to notify parent of visual edit readiness:', error);
  }

})();