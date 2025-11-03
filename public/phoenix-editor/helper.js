/**
 * Enhanced Editor Mode Helper - Legacy Phoenix-2 Inspired
 * 
 * Based on the successful phoenix-2 tracking system with improved
 * element detection and better handling of nested components.
 */

(() => {
  'use strict';

  // Configuration
  const PARENT_ORIGIN = window.__EDITOR_PARENT_ORIGIN__ || '*';
  const DEBUG = true;
  
  // Enhanced debug logging for iframe visibility
  console.log('🎯 Phoenix Editor Helper Loading...', {
    url: window.location.href,
    userAgent: navigator.userAgent.slice(0, 50),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    inIframe: window.self !== window.top
  });

  // State
  let enabled = false; // Default OFF - tracking is now opt-in via design mode
  let hoveredElement = null;
  let selectedElement = null;
  let trackingElements = new Map();
  let elementCounter = 0;
  let tooltip = null;
  let mutationObserver = null;
  let reInitTimer = null;
  let doubleClickTimer = null; // For detecting double-clicks
  let hoverThrottle = null; // Throttle hover updates for performance

  // Utility functions
  function log(...args) {
    if (DEBUG) console.log('[EditorHelper-Enhanced]', ...args);
  }

  // Enhanced element filtering to avoid container divs
  function isValidTrackingElement(element) {
    if (!element || !element.tagName) return false;

    // Skip non-interactive elements
    const skipTags = ['SCRIPT', 'STYLE', 'META', 'TITLE', 'LINK', 'HEAD', 'HTML', 'BODY'];
    if (skipTags.includes(element.tagName)) return false;

    // Skip media elements (this was key in phoenix-2)
    const mediaTags = ['IMG', 'VIDEO', 'AUDIO', 'CANVAS', 'SVG', 'IFRAME'];
    if (mediaTags.includes(element.tagName)) return false;

    // Skip our own editor elements (updated class names)
    if (element.classList?.contains('__phoenix-tooltip') ||
        element.classList?.contains('__phoenix-context-dropdown') ||
        element.hasAttribute('data-editor-element')) {
      return false;
    }

    // OPTIMIZATION: Only check size for container elements, not all elements
    // This makes hover detection much faster
    if (['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'NAV', 'HEADER', 'FOOTER'].includes(element.tagName)) {
      const rect = element.getBoundingClientRect();

      // Skip very small elements
      if (rect.width < 10 || rect.height < 10) return false;

      // Only skip if it's truly massive (likely full-page containers)
      if (rect.width > window.innerWidth * 0.95 && rect.height > window.innerHeight * 0.95) {
        return false;
      }
    }

    // Always allow semantic and interactive elements
    const alwaysAllowTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'LABEL', 'LI'];
    if (alwaysAllowTags.includes(element.tagName)) {
      return true;
    }

    return true;
  }

  // Add phoenix-style IDs to elements with prioritization
  function addPhoenixIds() {
    log('Adding Phoenix-style tracking IDs...');
    
    // Use prioritized selector strategy - semantic elements first
    const prioritySelectors = [
      // High priority: Interactive elements
      'button, a[href], input, textarea, select, [role="button"], [onclick]',
      // Medium priority: Semantic content
      'h1, h2, h3, h4, h5, h6, p, article, section, nav, header, footer, aside, main',
      // Lower priority: Structure and text
      'form, label, ul, ol, li, table, tr, td, th, blockquote, pre, code, span',
      // Lowest priority: Generic containers (with stricter filtering)
      'div'
    ];
    
    let counter = 0;
    
    prioritySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        if (!isValidTrackingElement(element)) return;
        
        // Skip if already has tracking ID
        if (element.hasAttribute('data-phoenix-id')) return;
        
        // Generate phoenix ID
        const phoenixId = 'phoenix-' + Date.now() + '-' + (++counter);
        element.setAttribute('data-phoenix-id', phoenixId);
        
        // Create tracking data
        const trackingData = createElementData(element);
        trackingElements.set(phoenixId, trackingData);
        
        elementCounter++;
      });
    });
    
    log(`Added Phoenix IDs to ${elementCounter} prioritized elements`);
    
    // Debug: Show what elements we're tracking
    console.log('🎯 Element breakdown:');
    const elementTypes = {};
    document.querySelectorAll('[data-phoenix-id]').forEach(el => {
      const tag = el.tagName.toLowerCase();
      elementTypes[tag] = (elementTypes[tag] || 0) + 1;
    });
    console.table(elementTypes);
  }

  function createElementData(element) {
    const phoenixId = element.getAttribute('data-phoenix-id');
    const rect = element.getBoundingClientRect();
    
    // Get component name
    let componentName = element.tagName.toLowerCase();
    
    return {
      // Core Phoenix identifiers
      id: phoenixId,
      type: 'element',
      tagName: element.tagName.toLowerCase(),
      componentName: componentName,
      
      // File location (essential for AST changes)
      filePath: extractFilePathFromElement(element),
      lineNumber: extractLineNumberFromElement(element),
      columnNumber: extractColumnNumberFromElement(element),

      // Element properties
      className: element.className || '',
      textContent: (element.textContent || '').slice(0, 100).trim(),
      innerHTML: element.innerHTML?.slice(0, 200) || '',
      boundingRect: rect,
      attributes: getElementAttributes(element),
      cssSelector: generateCSSSelector(element),
      
      // Component hierarchy and AST metadata
      props: extractElementProps(element),
      children: extractChildrenInfo(element),
      parentComponent: getParentComponentInfo(element),
      depth: getElementDepth(element),
      
      // Design and editing context
      computedStyles: getRelevantComputedStyles(element),
      isEditable: true,
      isInteractive: isInteractiveElement(element),
      priority: determineElementPriority(element),
      modificationHints: generateModificationHints(element),
      
      // Text selection context for precise editing
      selectedTextContext: extractTextContext(element)
    };
  }

  function getElementAttributes(element) {
    const attrs = {};
    Array.from(element.attributes).forEach(attr => {
      attrs[attr.name] = attr.value;
    });
    return attrs;
  }

  function isInteractiveElement(element) {
    const interactiveTags = ['button', 'a', 'input', 'textarea', 'select'];
    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           element.getAttribute('role') === 'button' ||
           element.style.cursor === 'pointer' ||
           element.onclick ||
           element.getAttribute('onclick');
  }

  function getElementDepth(element) {
    let depth = 0;
    let current = element;
    while (current.parentNode && current.parentNode !== document) {
      depth++;
      current = current.parentNode;
    }
    return depth;
  }
  
  // Enhanced helper functions for AST/Babel processing
  function extractFilePathFromElement(element) {
    // Use source map tracker if available
    if (window.__phoenixSourceMapTracker) {
      const location = window.__phoenixSourceMapTracker.getSourceLocation(element);
      return location.filePath;
    }

    // Fallback: check explicit attributes
    const componentId = element.getAttribute('data-component-source');
    if (componentId) return componentId;

    const dataFile = element.getAttribute('data-file');
    if (dataFile) return dataFile;

    // Attempt to derive from class names or data attributes
    const className = element.className;
    if (className && typeof className === 'string' && className.includes('-')) {
      const segments = className.split('-');
      return `./src/components/${segments[0]}/${segments[0]}.tsx`;
    }

    return `./src/app/page.tsx`; // Default fallback
  }

  function extractLineNumberFromElement(element) {
    // Use source map tracker if available
    if (window.__phoenixSourceMapTracker) {
      const location = window.__phoenixSourceMapTracker.getSourceLocation(element);
      return location.lineNumber;
    }

    // Fallback: check explicit attribute
    const lineAttr = element.getAttribute('data-line-number');
    if (lineAttr) return parseInt(lineAttr);

    // Estimate based on depth and position
    return getElementDepth(element) * 3 + 10; // Rough estimate
  }

  function extractColumnNumberFromElement(element) {
    // Use source map tracker if available
    if (window.__phoenixSourceMapTracker) {
      const location = window.__phoenixSourceMapTracker.getSourceLocation(element);
      return location.columnNumber;
    }

    // Fallback: estimate from depth
    return getElementDepth(element) * 2 + 1;
  }
  
  function generateCSSSelector(element) {
    if (element.id) return `#${element.id}`;
    
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        selector += '.' + current.className.split(' ')[0];
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
  
  function extractElementProps(element) {
    const props = {};
    
    // Extract data attributes as props
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') && !attr.name.startsWith('data-phoenix')) {
        props[attr.name.replace('data-', '')] = attr.value;
      }
    });
    
    // Extract common HTML attributes as props
    const htmlProps = ['id', 'className', 'style', 'title', 'alt', 'src', 'href'];
    htmlProps.forEach(prop => {
      const value = element.getAttribute(prop === 'className' ? 'class' : prop);
      if (value) props[prop] = value;
    });
    
    return props;
  }
  
  function extractChildrenInfo(element) {
    const children = [];
    
    Array.from(element.children).forEach((child, index) => {
      const phoenixId = child.getAttribute('data-phoenix-id');
      children.push({
        index,
        tagName: child.tagName.toLowerCase(),
        phoenixId: phoenixId || null,
        hasText: (child.textContent || '').trim().length > 0,
        childCount: child.children.length
      });
    });
    
    return children;
  }
  
  function getParentComponentInfo(element) {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const phoenixId = parent.getAttribute('data-phoenix-id');
      if (phoenixId) {
        return {
          phoenixId,
          tagName: parent.tagName.toLowerCase(),
          componentName: parent.tagName.toLowerCase()
        };
      }
      parent = parent.parentElement;
    }
    return null;
  }
  
  function getRelevantComputedStyles(element) {
    const computed = window.getComputedStyle(element);
    return {
      // Layout
      display: computed.display,
      position: computed.position,
      width: computed.width,
      height: computed.height,
      
      // Typography
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
      color: computed.color,
      textAlign: computed.textAlign,
      
      // Spacing
      margin: computed.margin,
      padding: computed.padding,
      
      // Visual
      backgroundColor: computed.backgroundColor,
      border: computed.border,
      borderRadius: computed.borderRadius,
      
      // Interaction
      cursor: computed.cursor,
      pointerEvents: computed.pointerEvents
    };
  }
  
  function determineElementPriority(element) {
    if (isInteractiveElement(element)) return 'high';
    if (['h1', 'h2', 'h3', 'nav', 'main', 'header', 'footer'].includes(element.tagName.toLowerCase())) {
      return 'high';
    }
    if (['p', 'span', 'div', 'section'].includes(element.tagName.toLowerCase())) {
      return 'medium';
    }
    return 'low';
  }
  
  function generateModificationHints(element) {
    const hints = [];
    
    if (isInteractiveElement(element)) {
      hints.push('Can modify click handlers and interaction logic');
    }
    
    if (element.textContent && element.textContent.trim()) {
      hints.push('Can modify text content and typography');
    }
    
    if (element.children.length > 0) {
      hints.push('Can modify child components and layout');
    }
    
    const styles = window.getComputedStyle(element);
    if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || styles.border !== '0px none rgb(0, 0, 0)') {
      hints.push('Can modify visual styling and appearance');
    }
    
    return hints;
  }
  
  function extractTextContext(element) {
    const textContent = element.textContent || '';
    const directTextNodes = [];
    
    // Extract direct text nodes (not from child elements)
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        directTextNodes.push(node.textContent.trim());
      }
    });
    
    return {
      selectedText: textContent.slice(0, 100),
      fullText: textContent,
      directText: directTextNodes,
      hasText: textContent.trim().length > 0,
      isTextElement: directTextNodes.length > 0,
      wordCount: textContent.trim().split(/\s+/).length,
      extractionMethod: 'automated-phoenix',
      extractedAt: new Date().toISOString(),
      textProperties: {
        fontSize: window.getComputedStyle(element).fontSize,
        fontFamily: window.getComputedStyle(element).fontFamily,
        color: window.getComputedStyle(element).color,
        lineHeight: window.getComputedStyle(element).lineHeight
      }
    };
  }
  
  // Helper functions for component classification
  function generateComponentDescription(trackingData) {
    const { tagName, textContent, isInteractive, children } = trackingData;
    
    if (isInteractive) {
      return `Interactive ${tagName} element with click functionality`;
    }
    
    if (textContent && textContent.trim()) {
      return `${tagName} containing "${textContent.slice(0, 30)}..."`;
    }
    
    if (children && children.length > 0) {
      return `${tagName} container with ${children.length} child element(s)`;
    }
    
    return `${tagName} element`;
  }
  
  function categorizeComponent(trackingData) {
    const { tagName, isInteractive, className, textContent } = trackingData;
    
    if (isInteractive) return 'ui';
    if (['nav', 'header', 'footer', 'aside', 'main'].includes(tagName)) return 'navigation';
    if (['form', 'input', 'textarea', 'select', 'button'].includes(tagName)) return 'form';
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em'].includes(tagName)) return 'ui';
    if (['div', 'section', 'article'].includes(tagName)) return 'layout';
    if (textContent && textContent.trim()) return 'data';
    
    return 'other';
  }

  // Create tooltip element with glassmorphic design
  function createTooltip() {
    if (tooltip) return;

    tooltip = document.createElement('div');
    tooltip.className = '__phoenix-tooltip';
    tooltip.setAttribute('data-editor-element', 'true');
    tooltip.style.cssText = `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;

      /* Glassmorphic design */
      background: rgba(255, 255, 255, 0.85) !important;
      backdrop-filter: blur(12px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(12px) saturate(180%) !important;

      color: #1f2937 !important;
      padding: 6px 10px !important;
      border-radius: 8px !important;
      font: 500 12px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
      display: none !important;
      white-space: nowrap !important;
      opacity: 0 !important;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      transform: translateY(-4px) !important;
      letter-spacing: 0.2px !important;
    `;

    document.body.appendChild(tooltip);
  }

  function updateTooltip(element, trackingData) {
    if (!tooltip) createTooltip();

    const rect = element.getBoundingClientRect();

    // Minimal tooltip - just the tag name
    const componentName = trackingData.componentName || trackingData.tagName;
    tooltip.textContent = `<${componentName}>`;

    // Position tooltip above the element
    const padding = 10;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Measure tooltip to center it properly
    tooltip.style.display = 'block';
    tooltip.style.opacity = '0';
    const tooltipRect = tooltip.getBoundingClientRect();

    let tooltipLeft = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);
    let tooltipTop = rect.top + scrollY - tooltipRect.height - padding;

    // If tooltip would go off screen top, show below
    if (tooltipTop < scrollY + padding) {
      tooltipTop = rect.bottom + scrollY + padding;
    }

    // Keep tooltip on screen horizontally
    const viewportWidth = window.innerWidth;
    if (tooltipLeft < scrollX + padding) {
      tooltipLeft = scrollX + padding;
    } else if (tooltipLeft + tooltipRect.width > viewportWidth + scrollX - padding) {
      tooltipLeft = viewportWidth + scrollX - tooltipRect.width - padding;
    }

    tooltip.style.left = tooltipLeft + 'px';
    tooltip.style.top = tooltipTop + 'px';
    tooltip.style.opacity = '1';
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        if (tooltip && tooltip.style.opacity === '0') {
          tooltip.style.display = 'none';
        }
      }, 150);
    }
  }

  // Enhanced element highlighting with smooth animations
  function highlightElement(element) {
    clearHighlights();

    // Use cssText for bulletproof override
    const originalStyle = element.getAttribute('style') || '';
    element.setAttribute('data-phoenix-original-style', originalStyle);

    element.style.cssText += `
      outline: 3px solid #00d9ff !important;
      outline-offset: 2px !important;
      background-color: rgba(0, 217, 255, 0.15) !important;
      box-shadow: 0 0 0 2px rgba(0, 217, 255, 0.5), 0 0 15px rgba(0, 217, 255, 0.8) !important;
      position: relative !important;
      z-index: 999999 !important;
      transition: outline 0.15s ease, box-shadow 0.15s ease !important;
    `;

    element.setAttribute('data-phoenix-hover', 'true');
  }

  function selectElement(element) {
    clearHighlights();

    const originalStyle = element.getAttribute('style') || '';
    element.setAttribute('data-phoenix-original-style', originalStyle);

    element.style.cssText += `
      outline: 4px solid #00ff88 !important;
      outline-offset: 3px !important;
      background-color: rgba(0, 255, 136, 0.2) !important;
      box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 1) !important;
      position: relative !important;
      z-index: 999999 !important;
      animation: selectionPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    `;

    element.setAttribute('data-phoenix-selected', 'true');
    console.log('✅ Selected element:', element.tagName, element.className || 'no-class');
  }

  function clearHighlights() {
    document.querySelectorAll('[data-phoenix-hover], [data-phoenix-selected]').forEach(el => {
      const originalStyle = el.getAttribute('data-phoenix-original-style');
      if (originalStyle !== null) {
        el.setAttribute('style', originalStyle);
        el.removeAttribute('data-phoenix-original-style');
      }
      el.removeAttribute('data-phoenix-hover');
      el.removeAttribute('data-phoenix-selected');
    });
  }

  // Event handlers with optimized hover detection
  function handleMouseOver(event) {
    if (!enabled) return;

    // Throttle hover updates for better performance (10ms debounce)
    if (hoverThrottle) {
      clearTimeout(hoverThrottle);
    }

    hoverThrottle = setTimeout(() => {
      let target = event.target;
      let phoenixElement = null;
      let phoenixId = null;

      // Find the most specific trackable element (innermost first)
      // Start with the direct target and work up
      while (target && target !== document.body) {
        const elementPhoenixId = target.getAttribute('data-phoenix-id');
        if (elementPhoenixId && isValidTrackingElement(target)) {
          phoenixElement = target;
          phoenixId = elementPhoenixId;
          break; // Take the first (most specific) match
        }
        target = target.parentElement;
      }

      if (phoenixElement && phoenixElement !== hoveredElement) {
        if (hoveredElement) {
          clearHighlights();
          hideTooltip();
        }

        highlightElement(phoenixElement);
        hoveredElement = phoenixElement;

        const trackingData = trackingElements.get(phoenixId);
        if (trackingData) {
          updateTooltip(phoenixElement, trackingData);
          // Context dropdown now shows on CLICK, not hover
        }
      }
    }, 10); // 10ms throttle - fast but prevents excessive updates
  }

  function handleMouseOut(event) {
    if (!enabled || !hoveredElement) return;

    const relatedTarget = event.relatedTarget;
    if (relatedTarget && (hoveredElement.contains(relatedTarget) ||
        relatedTarget.classList?.contains('__phoenix-tooltip') ||
        relatedTarget.classList?.contains('__phoenix-context-dropdown'))) {
      return;
    }

    clearHighlights();
    hideTooltip();
    hoveredElement = null;
  }

  function handleClick(event) {
    if (!enabled) return;

    // Don't prevent default if clicking the dropdown
    if (event.target.closest('.__phoenix-context-dropdown')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    let target = event.target;
    let phoenixElement = null;
    let phoenixId = null;
    
    while (target && target !== document.body) {
      const elementPhoenixId = target.getAttribute('data-phoenix-id');
      if (elementPhoenixId) {
        phoenixElement = target;
        phoenixId = elementPhoenixId;
        break;
      }
      target = target.parentElement;
    }
    
    if (!phoenixId) {
      log('Click: No trackable element found');
      return;
    }
    
    log('Phoenix element clicked:', phoenixId);
    
    if (selectedElement) {
      clearHighlights();
    }
    
    selectElement(phoenixElement);
    selectedElement = phoenixElement;
    
    const trackingData = trackingElements.get(phoenixId);
    if (!trackingData) return;
    
    const currentRect = phoenixElement.getBoundingClientRect();
    trackingData.boundingRect = currentRect;
    
    const metadata = {
      uid: phoenixId,
      selector: generateSelector(phoenixElement),
      tag: trackingData.tagName,
      componentName: trackingData.componentName,
      fileName: '',
      classes: trackingData.className.split(' ').filter(c => c),
      text: trackingData.textContent,
      rect: {
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      attributes: trackingData.attributes,
      analysis: trackingData,
      timestamp: new Date().toISOString()
    };
    
    log('Sending selection to parent:', metadata);
    
    // Create comprehensive selection payload for design interface
    const designPayload = {
      type: 'phoenix-component-selected',
      data: {
        // Visual display data for the UI
        displayName: `<${trackingData.componentName}>`,
        description: generateComponentDescription(trackingData),
        category: categorizeComponent(trackingData),
        
        // Rich Phoenix metadata for server processing
        phoenixElement: trackingData,
        
        // Selection context
        selectedAt: new Date(),
        selectionMode: 'click',
        boundingRect: trackingData.boundingRect
      },
      timestamp: Date.now()
    };

    try {
      // Send both legacy format and new design interface format
      window.parent.postMessage({
        type: 'ed.select',
        payload: metadata
      }, PARENT_ORIGIN);
      
      // Send enhanced payload for design interface
      window.parent.postMessage(designPayload, PARENT_ORIGIN);

    } catch (error) {
      log('Error sending selection:', error);
    }

    // Show context dropdown after selection
    showContextDropdown(phoenixElement, phoenixId, trackingData, event);
  }

  function generateSelector(element) {
    if (element.id) return `#${element.id}`;

    let selector = element.tagName.toLowerCase();
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).slice(0, 2);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    return selector;
  }

  // NEW: Context dropdown functions (click-triggered)
  function showContextDropdown(element, phoenixId, trackingData, clickEvent) {
    // Check if element is already in context
    if (window.__phoenixContextIntegration?.isInContext(phoenixId)) {
      log('Element already in context, skipping dropdown');
      return;
    }

    hideContextDropdown(); // Hide any existing dropdown

    const rect = element.getBoundingClientRect();
    const clickX = clickEvent?.clientX || rect.left + rect.width / 2;
    const clickY = clickEvent?.clientY || rect.top + rect.height / 2;

    const dropdown = document.createElement('div');
    dropdown.className = '__phoenix-context-dropdown';
    dropdown.setAttribute('data-editor-element', 'true');

    dropdown.innerHTML = `
      <button class="__phoenix-dropdown-button" data-action="add-context">
        <svg class="__phoenix-dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
        </svg>
        <span>Add to Chat Context</span>
      </button>
    `;

    // Smart positioning: place near click, but keep on screen
    let dropdownX = clickX + 10;
    let dropdownY = clickY + 10;

    // Adjust if would go off-screen
    const dropdownWidth = 220; // approximate width
    const dropdownHeight = 50; // approximate height

    if (dropdownX + dropdownWidth > window.innerWidth) {
      dropdownX = clickX - dropdownWidth - 10;
    }
    if (dropdownY + dropdownHeight > window.innerHeight) {
      dropdownY = clickY - dropdownHeight - 10;
    }

    dropdown.style.cssText = `
      position: fixed !important;
      top: ${dropdownY}px !important;
      left: ${dropdownX}px !important;
      z-index: 2147483647 !important;
    `;

    // Handle button click
    const button = dropdown.querySelector('[data-action="add-context"]');
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      log('Context dropdown clicked for:', phoenixId);

      if (window.__phoenixContextIntegration) {
        window.__phoenixContextIntegration.addToChat(phoenixId, trackingData);
        hideContextDropdown();
      } else {
        log('Context integration not available');
      }
    });

    document.body.appendChild(dropdown);
    element.setAttribute('data-context-dropdown-visible', 'true');

    // Close dropdown on outside click (with delay to avoid immediate close)
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!dropdown.contains(e.target)) {
          hideContextDropdown();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);

    log('Context dropdown shown');
  }

  function hideContextDropdown() {
    const dropdown = document.querySelector('.__phoenix-context-dropdown');
    if (dropdown) {
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'scale(0.95) translateY(-4px)';
      setTimeout(() => dropdown.remove(), 150);
    }

    document.querySelectorAll('[data-context-dropdown-visible]').forEach(el => {
      el.removeAttribute('data-context-dropdown-visible');
    });
  }

  // NEW: Double-click handler for text editing
  function handleDoubleClick(event) {
    if (!enabled) return;

    let target = event.target;
    let phoenixElement = null;

    // Find trackable element
    while (target && target !== document.body) {
      if (target.getAttribute('data-phoenix-id')) {
        phoenixElement = target;
        break;
      }
      target = target.parentElement;
    }

    if (!phoenixElement) return;

    // Check if element has editable text
    if (window.__phoenixInlineTextEditor?.hasEditableText(phoenixElement)) {
      // ENHANCED: Get FULL element text, not just selected word
      // Strategy 1: Try to get text from the element itself
      let fullText = phoenixElement.textContent?.trim() || '';

      // Strategy 2: If element is empty or very short, check if we clicked a child
      // (e.g., clicking inside a <span> that's inside a <div>)
      if (fullText.length < 3 && target !== phoenixElement) {
        const clickedElement = target.closest('[data-phoenix-id]');
        if (clickedElement) {
          fullText = clickedElement.textContent?.trim() || fullText;
        }
      }

      // Strategy 3: Also capture the browser's word selection for reference
      const selection = window.getSelection();
      const selectedWord = selection && selection.rangeCount > 0
        ? selection.toString().trim()
        : '';

      log('Double-click detected, capturing text', {
        fullText: fullText.substring(0, 100) + (fullText.length > 100 ? '...' : ''),
        fullTextLength: fullText.length,
        selectedWord: selectedWord || '(none)',
        phoenixId: phoenixElement.getAttribute('data-phoenix-id'),
        elementTag: phoenixElement.tagName
      });

      // Now prevent default to stop any other handlers
      event.preventDefault();
      event.stopPropagation();

      // Hide tooltip and dropdown during editing
      hideTooltip();
      hideContextDropdown();

      // Start inline text editing with FULL TEXT (not just selected word)
      // The editor will display the full content for editing
      window.__phoenixInlineTextEditor.startEdit(phoenixElement, fullText);
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('dblclick', handleDoubleClick, true); // NEW: Double-click for text editing
    log('Event listeners set up');
  }

  function removeEventListeners() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('dblclick', handleDoubleClick, true); // NEW: Remove double-click listener
    log('Event listeners removed');
  }

  // Enable/disable functions
  function enable() {
    console.log('🔴🔴🔴 enable() CALLED! Stack trace:');
    console.trace();

    if (enabled) {
      console.log('🔴 enable() called but already enabled, ignoring');
      return;
    }

    console.log('🔴 ENABLING TRACKING NOW!');
    enabled = true;
    document.body.classList.add('__editor-active');

    addPhoenixIds();
    createTooltip();
    setupEventListeners();

    log('Enhanced editor mode enabled with bulletproof CSS');
    console.log('🎯 Tracking enabled! Current element count:', elementCounter);
    
    try {
      window.parent.postMessage({
        type: 'ed.enabled',
        payload: { 
          elementCount: elementCounter,
          timestamp: new Date().toISOString()
        }
      }, PARENT_ORIGIN);
    } catch (error) {
      log('Error notifying parent:', error);
    }
  }

  function disable() {
    if (!enabled) return;
    
    enabled = false;
    document.body.classList.remove('__editor-active');
    
    removeEventListeners();
    clearHighlights();
    hideTooltip();
    
    hoveredElement = null;
    selectedElement = null;
    
    log('Enhanced editor mode disabled');
    
    try {
      window.parent.postMessage({
        type: 'ed.disabled',
        payload: { timestamp: new Date().toISOString() }
      }, PARENT_ORIGIN);
    } catch (error) {
      log('Error notifying parent:', error);
    }
  }

  // Message handling
  console.log('🔵 helper.js: Registering message listener on window object');
  console.log('🔵 helper.js: Window object:', typeof window, 'Has addEventListener:', typeof window.addEventListener);

  const messageHandler = (event) => {
    const { type, payload } = event.data || {};

    console.log('🔵 helper.js: Message received:', { type, enabled: event.data?.enabled, currentEnabled: enabled, origin: event.origin, fullData: event.data });

    // Handle phoenix-tracking-toggle messages
    if (type === 'phoenix-tracking-toggle') {
      const isEnabled = event.data.enabled;
      console.log('🔵 helper.js: phoenix-tracking-toggle received! isEnabled:', isEnabled, 'current enabled:', enabled);

      // Send acknowledgment back to parent
      try {
        window.parent.postMessage({
          type: 'phoenix-tracking-toggle-ack',
          enabled: isEnabled,
          previousState: enabled,
          timestamp: Date.now()
        }, '*');
        console.log('🔵 helper.js: Sent acknowledgment to parent');
      } catch (err) {
        console.error('🔵 helper.js: Failed to send acknowledgment:', err);
      }

      if (isEnabled && !enabled) {
        console.log('🔵 helper.js: Calling enable() - tracking should turn ON');
        log('🎯 Tracking ENABLED via postMessage');
        enable();
        console.log('🔵 helper.js: enable() completed, enabled is now:', enabled);
      } else if (!isEnabled && enabled) {
        console.log('🔵 helper.js: Calling disable() - tracking should turn OFF');
        log('🎯 Tracking DISABLED via postMessage');
        disable();
        console.log('🔵 helper.js: disable() completed, enabled is now:', enabled);
      } else {
        console.log('🔵 helper.js: No state change needed. isEnabled:', isEnabled, 'enabled:', enabled);
      }
      return;
    }

    // Legacy message handlers (kept for backwards compatibility)
    switch (type) {
      case 'ed.ping':
        try {
          window.parent.postMessage({
            type: 'ed.pong',
            payload: {
              enabled,
              elementCount: elementCounter,
              timestamp: new Date().toISOString()
            }
          }, PARENT_ORIGIN);
        } catch (error) {
          log('Error responding to ping:', error);
        }
        break;
    }
  };

  // Actually attach the listener
  window.addEventListener('message', messageHandler);
  console.log('🔵 helper.js: Message listener attached successfully! Listener function:', typeof messageHandler);

  // Initialize
  function init() {
    log('Initializing enhanced editor helper');

    // Tracking is now ONLY enabled via postMessage from Design button
    // No auto-enable on page load
    console.log('🔵 helper.js: INIT - Initial state: enabled =', enabled);
    console.log('🔵 helper.js: Tracking is DISABLED by default. Waiting for Design mode activation via postMessage.');

    try {
      window.parent.postMessage({
        type: 'phoenix-helper-ready',
        enabled: enabled,
        timestamp: Date.now()
      }, PARENT_ORIGIN);
    } catch (error) {
      log('Error notifying parent of ready state:', error);
    }

    console.log('🔵 helper.js: Helper initialized successfully. enabled =', enabled);
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    disable();
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Debug API
  if (DEBUG) {
    window.__editorHelperEnhanced = {
      enable,
      disable,
      isEnabled: () => enabled,
      getTrackingElements: () => trackingElements,
      getElementCount: () => elementCounter
    };
  }


  // Send ready signal to parent on initialization
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({
        type: 'phoenix-helper-ready',
        enabled: enabled,
        timestamp: Date.now()
      }, '*');
      log('📡 Sent ready signal to parent window');
    } catch (error) {
      log('⚠️ Failed to send ready signal:', error);
    }
  }

})();