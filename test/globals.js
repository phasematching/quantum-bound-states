// Copyright 2025, University of Colorado Boulder

/**
 * Global setup for Node.js tests - defines PhET framework globals
 * This file must be imported before any PhET modules.
 *
 * @author Martin Veillette
 */

// Mock the global assert function used by PhET code
globalThis.assert = ( condition, message ) => {
  if ( !condition ) {
    throw new Error( message || 'Assertion failed' );
  }
};

// Mock assertions module
globalThis.assertions = {
  enableAssertSlow: () => {},
  enableAssert: () => {},
  enabled: false
};

console.log( 'PhET globals initialized for Node.js testing' );
