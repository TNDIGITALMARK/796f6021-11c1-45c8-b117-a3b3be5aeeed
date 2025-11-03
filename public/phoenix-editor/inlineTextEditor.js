/**
 * Phoenix Inline Text Editor
 *
 * Handles double-click to edit text content inline
 * Delegates to visualEditExtension.js for optimistic updates and API calls
 */

(() => {
  'use strict';

  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('[InlineTextEditor]', ...args);
  }

  class PhoenixInlineTextEditor {
    constructor() {
      this.activeEditor = null;
      this.originalElement = null;
      this.originalText = '';
      this.isEditing = false;

      log('Initialized');
    }

    /**
     * Check if element has editable text
     */
    hasEditableText(element) {
      if (!element) {
        log('hasEditableText: element is null/undefined');
        return false;
      }

      // Skip elements that shouldn't be text-edited
      const skipTags = ['INPUT', 'TEXTAREA', 'SELECT', 'IMG', 'VIDEO', 'AUDIO', 'CANVAS', 'SVG', 'SCRIPT', 'STYLE', 'CODE', 'PRE'];
      if (skipTags.includes(element.tagName)) {
        log('hasEditableText: Skipping tag', element.tagName);
        return false;
      }

      // Element must have direct text content (not just from children)
      const textContent = element.textContent?.trim() || '';
      if (textContent.length === 0) {
        log('hasEditableText: Empty text content');
        return false;
      }

      // Must be reasonably short text (not entire page content)
      // Increased from 500 to 1000 to support longer post captions
      if (textContent.length > 1000) {
        log('hasEditableText: Text too long', { length: textContent.length });
        return false;
      }

      // Skip elements that look like code (camelCase, snake_case, function names)
      // This prevents editing variable names, function calls, etc.
      if (this.looksLikeCode(textContent)) {
        log('hasEditableText: Text looks like code', textContent.substring(0, 30));
        return false;
      }

      // Only allow editing elements that are likely user-visible text
      // Check if element or its parents have common text display classes/tags
      if (!this.isUserVisibleText(element)) {
        log('hasEditableText: Not user-visible text', {
          tag: element.tagName,
          classes: element.className,
          role: element.getAttribute('role')
        });
        return false;
      }

      log('hasEditableText: ✅ Element is editable', {
        tag: element.tagName,
        textLength: textContent.length,
        textPreview: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : '')
      });
      return true;
    }

    /**
     * Check if text looks like code rather than user-visible content
     */
    looksLikeCode(text) {
      // Single words that are camelCase or have underscores are likely code
      const words = text.split(/\s+/);
      if (words.length === 1) {
        // camelCase: doubleTapTimeout
        if (/^[a-z]+[A-Z]/.test(text)) return true;

        // snake_case: user_id
        if (/_/.test(text)) return true;

        // function calls: setTimeout(
        if (/\(/.test(text)) return true;
      }

      // Multiple camelCase words in sequence is likely code
      const camelCaseWords = words.filter(w => /^[a-z]+[A-Z]/.test(w));
      if (camelCaseWords.length > 1) return true;

      return false;
    }

    /**
     * Check if element is user-visible text (not code, not UI elements)
     */
    isUserVisibleText(element) {
      // Common user-text tags
      const userTextTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'A', 'LI', 'TD', 'TH', 'LABEL'];

      // Check element itself
      if (userTextTags.includes(element.tagName)) {
        // Additional check: if it's a SPAN or DIV, make sure it's not a button or interactive element
        const role = element.getAttribute('role');
        const className = element.className || '';

        // Skip buttons, icons, badges
        if (role === 'button' || className.includes('button') || className.includes('icon') || className.includes('badge')) {
          return false;
        }

        return true;
      }

      return false;
    }

    /**
     * Start inline editing on an element
     * @param {HTMLElement} element - The element to edit
     * @param {string} [preSelectedText] - Text that was already selected (captured before preventDefault)
     */
    startEdit(element, preSelectedText = null) {
      if (!element || !this.hasEditableText(element)) {
        log('Element not editable:', element?.tagName);
        return false;
      }

      // Prevent multiple editors
      if (this.isEditing) {
        this.cancelEdit();
      }

      const phoenixId = element.getAttribute('data-phoenix-id');
      if (!phoenixId) {
        log('Element missing phoenix-id');
        return false;
      }

      log('Starting edit on:', phoenixId, element.tagName);

      this.originalElement = element;

      // Use pre-selected text if provided (this is the most reliable method)
      if (preSelectedText && preSelectedText.length > 0) {
        this.originalText = preSelectedText;
        log('Using pre-selected text from helper:', preSelectedText);
      } else {
        // Fallback: Try to read selection (might be empty if preventDefault was called)
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const selectedText = selection.toString().trim();
          if (selectedText) {
            this.originalText = selectedText;
            log('Captured selected text from Selection API:', selectedText);
          } else {
            // Last resort: use entire element text
            this.originalText = element.textContent || '';
            log('No selection found, using full element text:', this.originalText);
          }
        } else {
          // Last resort: use entire element text
          this.originalText = element.textContent || '';
          log('No selection API available, using full element text:', this.originalText);
        }
      }

      this.isEditing = true;

      // Create inline editor overlay
      this.createInlineEditor(element);

      return true;
    }

    /**
     * Create the inline contenteditable overlay
     */
    createInlineEditor(element) {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      // Create editor element
      const editor = document.createElement('div');
      editor.contentEditable = 'true';
      editor.className = '__phoenix-inline-editor';
      editor.textContent = this.originalText;

      // Position and style to match original element
      editor.style.cssText = `
        position: fixed !important;
        top: ${rect.top}px !important;
        left: ${rect.left}px !important;
        width: ${rect.width}px !important;
        min-height: ${rect.height}px !important;

        /* Copy visual styles from original */
        font-family: ${computedStyle.fontFamily} !important;
        font-size: ${computedStyle.fontSize} !important;
        font-weight: ${computedStyle.fontWeight} !important;
        line-height: ${computedStyle.lineHeight} !important;
        text-align: ${computedStyle.textAlign} !important;
        padding: ${computedStyle.padding} !important;

        /* ALWAYS black text on white - consistent editing experience */
        color: #000000 !important;
        background: rgba(255, 255, 255, 0.98) !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 6px !important;
        outline: none !important;
        box-shadow:
          0 0 0 4px rgba(59, 130, 246, 0.15),
          0 12px 40px rgba(0, 0, 0, 0.2) !important;
        z-index: 2147483647 !important;
        cursor: text !important;
        overflow: auto !important;
        box-sizing: border-box !important;

        /* Smooth entrance animation */
        animation: editorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      this.activeEditor = editor;

      // Hide original element
      element.style.opacity = '0.3';
      element.setAttribute('data-phoenix-editing', 'true');

      // Add to DOM
      document.body.appendChild(editor);

      // Focus and select all text
      editor.focus();
      this.selectAllText(editor);

      // Setup event handlers
      this.setupEditorHandlers(editor, element);

      log('Editor created and focused');
    }

    /**
     * Setup editor event handlers
     */
    setupEditorHandlers(editor, element) {
      // Save on blur (click outside)
      const blurHandler = () => {
        this.commitEdit();
      };

      // Keyboard shortcuts
      const keydownHandler = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          // Enter without Shift = save
          e.preventDefault();
          this.commitEdit();
        } else if (e.key === 'Escape') {
          // Escape = cancel
          e.preventDefault();
          this.cancelEdit();
        } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
          // Cmd/Ctrl+S = save
          e.preventDefault();
          this.commitEdit();
        }
      };

      // Prevent form submission if editor is in a form
      const submitHandler = (e) => {
        if (this.isEditing) {
          e.preventDefault();
          this.commitEdit();
        }
      };

      editor.addEventListener('blur', blurHandler);
      editor.addEventListener('keydown', keydownHandler);

      // Find parent form and prevent submission
      const form = element.closest('form');
      if (form) {
        form.addEventListener('submit', submitHandler);
      }

      // Store handlers for cleanup
      this.editorHandlers = { blurHandler, keydownHandler, submitHandler, form };
    }

    /**
     * Commit the edit (save changes)
     */
    async commitEdit() {
      if (!this.isEditing || !this.activeEditor || !this.originalElement) {
        return;
      }

      const newText = this.activeEditor.textContent?.trim() || '';
      const phoenixId = this.originalElement.getAttribute('data-phoenix-id');

      log('Committing edit:', { phoenixId, originalText: this.originalText, newText });

      // Check if text actually changed
      if (newText === this.originalText.trim()) {
        log('No changes detected, canceling');
        this.cancelEdit();
        return;
      }

      // Validate text is not empty
      if (newText.length === 0) {
        log('Empty text not allowed, canceling');
        this.cancelEdit();
        return;
      }

      // Get source location BEFORE cleanup (while element still exists)
      const sourceTracker = window.__phoenixSourceMapTracker;
      const sourceLocation = sourceTracker?.getSourceLocation(this.originalElement);
      const elementTag = this.originalElement.tagName.toLowerCase();
      const elementClasses = Array.from(this.originalElement.classList);

      // Use visualEditExtension's optimistic update system
      if (window.__phoenixVisualEditor) {
        try {
          const success = await window.__phoenixVisualEditor.handleVisualEdit(
            phoenixId,
            'textContent',
            newText
          );

          if (success) {
            log('✅ Text edit successful - sending AST request to parent');

            // Send postMessage to parent for AST persistence
            try {
              const astEditMessage = {
                type: 'phoenix-text-edit',
                requestId: `text-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                phoenixId: phoenixId,
                data: {
                  phoenixId: phoenixId,
                  filePath: sourceLocation?.filePath || './src/app/page.tsx',
                  lineNumber: sourceLocation?.lineNumber,
                  columnNumber: sourceLocation?.columnNumber,
                  oldText: this.originalText,
                  newText: newText,
                  elementTag: elementTag,
                  elementClasses: elementClasses,
                  operationType: 'text-edit'
                }
              };

              log('📤 Sending AST edit message to parent:', astEditMessage);
              window.parent.postMessage(astEditMessage, '*');
              log('✅ AST request sent successfully');
            } catch (astError) {
              log('❌ Error sending AST request:', astError);
              // Don't fail the edit if AST request fails
            }
          } else {
            log('❌ Text edit failed - reverted');
          }
        } catch (error) {
          log('❌ Error during text edit:', error);
        }
      } else {
        log('❌ Visual editor not available, applying change directly');
        this.originalElement.textContent = newText;
      }

      // Clean up editor UI AFTER everything is done
      this.cleanupEditor();
    }

    /**
     * Cancel the edit (discard changes)
     */
    cancelEdit() {
      if (!this.isEditing) return;

      log('Canceling edit');

      this.cleanupEditor();
    }

    /**
     * Clean up editor UI and restore original element
     */
    cleanupEditor() {
      // Remove editor element
      if (this.activeEditor) {
        this.activeEditor.remove();
        this.activeEditor = null;
      }

      // Restore original element
      if (this.originalElement) {
        this.originalElement.style.opacity = '';
        this.originalElement.removeAttribute('data-phoenix-editing');
      }

      // Clean up event handlers
      if (this.editorHandlers) {
        const { form, submitHandler } = this.editorHandlers;
        if (form && submitHandler) {
          form.removeEventListener('submit', submitHandler);
        }
        this.editorHandlers = null;
      }

      // Reset state
      this.isEditing = false;
      this.originalElement = null;
      this.originalText = '';

      log('Editor cleaned up');
    }

    /**
     * Select all text in editor
     */
    selectAllText(element) {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    /**
     * Check if color is dark (for contrast adjustment)
     */
    isDarkColor(color) {
      // Parse RGB color
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return false;

      // Calculate luminance
      const [r, g, b] = rgb.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      return luminance < 0.5;
    }

    /**
     * Check if currently editing
     */
    isCurrentlyEditing() {
      return this.isEditing;
    }

    /**
     * Get active editor element (for debugging)
     */
    getActiveEditor() {
      return this.activeEditor;
    }
  }

  // Create global instance
  window.__phoenixInlineTextEditor = new PhoenixInlineTextEditor();

  // Notify parent that text editor is ready
  window.parent.postMessage({
    type: 'phoenix-text-editor-ready',
    timestamp: Date.now()
  }, '*');

  log('✅ Inline Text Editor loaded and ready');

  // Listen for AST edit responses from parent
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'phoenix-ast-edit-response') {
      const { requestId, success, data } = event.data;

      if (success) {
        log('✅ AST Edit Response - Success:', {
          requestId,
          operationType: data?.operationType,
          filePath: data?.filePath,
        });
      } else {
        log('❌ AST Edit Response - Failed:', {
          requestId,
          error: data?.error,
        });
      }
    }
  });

  // Add CSS for visual feedback
  const style = document.createElement('style');
  style.textContent = `
    .__phoenix-inline-editor {
      animation: editorFadeIn 0.2s ease-out;
    }

    @keyframes editorFadeIn {
      from {
        opacity: 0;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    [data-phoenix-editing] {
      pointer-events: none !important;
      user-select: none !important;
    }

    /* Visual hint that element is text-editable on hover */
    [data-phoenix-id]:hover[data-has-text="true"]:not([data-phoenix-editing]):not([data-context-button-visible]) {
      cursor: text !important;
    }
  `;
  document.head.appendChild(style);

})();
