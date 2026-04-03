/**
 * DOM manipulation utilities.
 */

/**
 * Create a DOM element with attributes and children.
 * @param {string} tag - HTML tag name.
 * @param {Object} attrs - Attribute key/value pairs. "className" maps to class.
 * @param {Array<HTMLElement|string>} children - Child nodes or text strings.
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === "className") {
      el.className = value;
    } else if (key.startsWith("data-")) {
      el.setAttribute(key, value);
    } else {
      el[key] = value;
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Add one or more CSS classes to an element.
 */
export function addClass(el, ...classes) {
  el.classList.add(...classes.filter(Boolean));
}

/**
 * Toggle the visibility of an element by flipping the "hidden" attribute.
 * Returns the new visibility state (true = visible).
 */
export function toggleVisibility(el) {
  const isHidden = el.hasAttribute("hidden");
  if (isHidden) {
    el.removeAttribute("hidden");
  } else {
    el.setAttribute("hidden", "");
  }
  return isHidden; // was hidden, now visible
}

/**
 * Delegate an event from a parent to children matching a CSS selector.
 * Works for dynamically added elements.
 */
export function delegateEvent(parent, selector, event, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e, target);
    }
  });
}

/**
 * Sanitize an HTML string by escaping dangerous characters.
 * Prevents XSS when inserting user-provided text into the DOM.
 */
export function sanitizeHTML(str) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return String(str).replace(/[&<>"'/]/g, (char) => map[char]);
}
