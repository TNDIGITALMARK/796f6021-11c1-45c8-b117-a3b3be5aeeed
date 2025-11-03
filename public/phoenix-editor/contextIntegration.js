/**
 * Phoenix Context Integration
 *
 * Handles adding tracked components to chat context via hover button
 * Communicates with parent via postMessage pattern
 */

(() => {
  'use strict';

  const DEBUG = true;
  const PARENT_ORIGIN = '*';

  function log(...args) {
    if (DEBUG) console.log('[ContextIntegration]', ...args);
  }

  class PhoenixContextIntegration {
    constructor() {
      this.addedElements = new Set();
      this.pendingRequests = new Map();
      this.setupMessageListener();

      log('Initialized');
    }

    /**
     * Add component to chat context
     */
    async addToChat(phoenixId, trackingData) {
      log('Adding to chat context:', phoenixId);

      // Prevent duplicate additions
      if (this.addedElements.has(phoenixId)) {
        log('Already added to context:', phoenixId);
        return { success: false, reason: 'already-added' };
      }

      // Show optimistic feedback
      this.showAddingFeedback(phoenixId);

      try {
        // Create comprehensive payload for parent
        const payload = {
          type: 'phoenix-add-to-context',
          phoenixId,
          componentData: {
            id: `context-${phoenixId}-${Date.now()}`,
            displayName: this.generateDisplayName(trackingData),
            description: this.generateDescription(trackingData),
            category: this.categorizeComponent(trackingData),
            phoenixElement: trackingData,
            selectedAt: new Date(),
            selectionMode: 'context-button',
            boundingRect: trackingData.boundingRect
          },
          timestamp: Date.now()
        };

        // Send to parent and wait for response
        const response = await this.sendToParent(payload);

        if (response.success) {
          this.confirmAdded(phoenixId);
          this.addedElements.add(phoenixId);
          log('✅ Successfully added to context:', phoenixId);
          return { success: true };
        } else {
          this.rollbackAdded(phoenixId);
          log('❌ Failed to add to context:', response.error);
          return { success: false, error: response.error };
        }
      } catch (error) {
        log('❌ Error adding to context:', error);
        this.rollbackAdded(phoenixId);
        return { success: false, error: error.message };
      }
    }

    /**
     * Send message to parent and wait for response
     */
    sendToParent(payload) {
      return new Promise((resolve) => {
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Store resolver
        this.pendingRequests.set(requestId, resolve);

        // Send with request ID
        window.parent.postMessage({
          ...payload,
          requestId
        }, PARENT_ORIGIN);

        log('Sent to parent:', payload.type, requestId);

        // Timeout fallback (5 seconds)
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            resolve({ success: false, error: 'timeout' });
            log('Request timeout:', requestId);
          }
        }, 5000);
      });
    }

    /**
     * Setup message listener for parent responses
     */
    setupMessageListener() {
      window.addEventListener('message', (event) => {
        const { type, requestId, success, error } = event.data || {};

        if (type === 'phoenix-add-to-context-response' && requestId) {
          const resolver = this.pendingRequests.get(requestId);
          if (resolver) {
            this.pendingRequests.delete(requestId);
            resolver({ success, error });
            log('Received response:', requestId, success);
          }
        }
      });
    }

    /**
     * Show visual feedback that element is being added
     */
    showAddingFeedback(phoenixId) {
      const element = document.querySelector(`[data-phoenix-id="${phoenixId}"]`);
      if (!element) return;

      element.setAttribute('data-context-adding', 'true');

      // Add subtle pulse animation
      const originalTransition = element.style.transition;
      element.style.transition = 'all 0.3s ease-out';
      element.style.transform = 'scale(0.98)';

      setTimeout(() => {
        element.style.transform = 'scale(1)';
        setTimeout(() => {
          element.style.transition = originalTransition;
        }, 300);
      }, 100);
    }

    /**
     * Confirm element was added successfully
     */
    confirmAdded(phoenixId) {
      const element = document.querySelector(`[data-phoenix-id="${phoenixId}"]`);
      if (!element) return;

      element.removeAttribute('data-context-adding');
      element.setAttribute('data-context-added', 'true');

      // Show checkmark indicator briefly
      this.showCheckmark(element);
    }

    /**
     * Rollback if addition failed
     */
    rollbackAdded(phoenixId) {
      const element = document.querySelector(`[data-phoenix-id="${phoenixId}"]`);
      if (!element) return;

      element.removeAttribute('data-context-adding');

      // Show error indicator briefly
      this.showErrorIndicator(element);
    }

    /**
     * Show checkmark indicator with enhanced bounce animation
     */
    showCheckmark(element) {
      const checkmark = document.createElement('div');
      checkmark.className = '__phoenix-checkmark';
      checkmark.innerHTML = '✓';
      checkmark.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: rgba(34, 197, 94, 0.95);
        color: white;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: bold;
        pointer-events: none;
        z-index: 999999;
        animation: checkmarkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
      `;

      element.style.position = element.style.position || 'relative';
      element.appendChild(checkmark);

      // Remove after animation with fade
      setTimeout(() => {
        checkmark.style.transition = 'opacity 0.3s ease-out';
        checkmark.style.opacity = '0';
        setTimeout(() => checkmark.remove(), 300);
      }, 1200);
    }

    /**
     * Show error indicator
     */
    showErrorIndicator(element) {
      const errorIcon = document.createElement('div');
      errorIcon.className = '__phoenix-error';
      errorIcon.innerHTML = '✕';
      errorIcon.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: rgba(239, 68, 68, 0.95);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        z-index: 999999;
      `;

      element.style.position = element.style.position || 'relative';
      element.appendChild(errorIcon);

      // Animate in
      requestAnimationFrame(() => {
        errorIcon.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      // Remove after animation
      setTimeout(() => {
        errorIcon.style.opacity = '0';
        setTimeout(() => errorIcon.remove(), 300);
      }, 1200);
    }

    /**
     * Check if element is already in context
     */
    isInContext(phoenixId) {
      return this.addedElements.has(phoenixId);
    }

    /**
     * Remove element from context tracking
     */
    removeFromContext(phoenixId) {
      this.addedElements.delete(phoenixId);

      const element = document.querySelector(`[data-phoenix-id="${phoenixId}"]`);
      if (element) {
        element.removeAttribute('data-context-added');
      }
    }

    /**
     * Clear all context tracking
     */
    clearAll() {
      this.addedElements.clear();
      document.querySelectorAll('[data-context-added]').forEach(el => {
        el.removeAttribute('data-context-added');
      });
      log('Cleared all context tracking');
    }

    // Utility functions for component metadata
    generateDisplayName(trackingData) {
      const { componentName, tagName, textContent, attributes } = trackingData;

      if (componentName && componentName !== tagName) {
        return componentName.replace(/([A-Z])/g, ' $1').trim();
      }

      const tag = tagName.toLowerCase();

      if (tag === 'button' && textContent) {
        const text = textContent.trim().slice(0, 20);
        return text ? `"${text}" button` : 'Button';
      }

      if (tag === 'a' && textContent) {
        const text = textContent.trim().slice(0, 20);
        return text ? `"${text}" link` : 'Link';
      }

      if (tag === 'input') {
        const type = attributes?.type || 'text';
        return `${type.charAt(0).toUpperCase() + type.slice(1)} input`;
      }

      return tagName.charAt(0).toUpperCase() + tagName.slice(1);
    }

    generateDescription(trackingData) {
      const parts = [];

      if (trackingData.textContent && trackingData.textContent.trim()) {
        const text = trackingData.textContent.trim().slice(0, 50);
        parts.push(`"${text}${trackingData.textContent.length > 50 ? '...' : ''}"`);
      }

      parts.push(`${trackingData.tagName} element`);

      if (trackingData.className) {
        const classes = trackingData.className.split(' ').slice(0, 2).join(' ');
        parts.push(`(${classes})`);
      }

      return parts.join(' ');
    }

    categorizeComponent(trackingData) {
      const { tagName, isInteractive, className } = trackingData;
      const tag = tagName.toLowerCase();
      const classLower = className?.toLowerCase() || '';

      if (tag === 'form' || ['input', 'textarea', 'select'].includes(tag)) {
        return 'form';
      }

      if (tag === 'nav' || classLower.includes('nav')) {
        return 'navigation';
      }

      if (['header', 'footer', 'aside', 'main'].includes(tag)) {
        return 'layout';
      }

      if (isInteractive || tag === 'button' || tag === 'a') {
        return 'ui';
      }

      return 'other';
    }
  }

  // Create global instance
  window.__phoenixContextIntegration = new PhoenixContextIntegration();

  // Notify parent that context integration is ready
  window.parent.postMessage({
    type: 'phoenix-context-integration-ready',
    timestamp: Date.now()
  }, PARENT_ORIGIN);

  log('✅ Context Integration loaded and ready');

  // Add CSS animations with enhanced bounce
  const style = document.createElement('style');
  style.textContent = `
    @keyframes checkmarkBounce {
      0% {
        transform: translate(-50%, -50%) scale(0) rotate(-45deg);
        opacity: 0;
      }
      60% {
        transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
      }
      100% {
        transform: translate(-50%, -50%) scale(1) rotate(0deg);
        opacity: 1;
      }
    }

    [data-context-adding] {
      opacity: 0.7 !important;
      transition: opacity 0.2s ease !important;
    }

    [data-context-added] {
      position: relative !important;
    }

    [data-context-added]::after {
      content: '';
      position: absolute;
      top: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      background: rgba(34, 197, 94, 0.95);
      border-radius: 50%;
      border: 2px solid white;
      z-index: 999998;
      pointer-events: none;
      box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
      animation: checkmarkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `;
  document.head.appendChild(style);

})();
