/**
 * Browser Compatibility Script for ASP Cranes CRM
 * Provides polyfills and compatibility fixes for older browsers
 */

// Polyfill for browsers that don't support modern ES features
(function() {
  'use strict';
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Polyfill for older browsers
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      return this.indexOf(searchElement, fromIndex) !== -1;
    };
  }

  // Polyfill for Object.assign
  if (!Object.assign) {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Setup global environment for compatibility
  window.global = window.global || window;
  
  // Console polyfill for IE
  if (!window.console) {
    window.console = {
      log: function() {},
      warn: function() {},
      error: function() {},
      info: function() {},
      debug: function() {}
    };
  }

  // Basic fetch polyfill detection
  if (!window.fetch) {
    console.warn('Fetch API not supported. Please use a modern browser or include a fetch polyfill.');
  }

  // Promise polyfill detection
  if (!window.Promise) {
    console.warn('Promise not supported. Please use a modern browser or include a Promise polyfill.');
  }

  console.log('✅ Browser compatibility script loaded successfully');
})();
