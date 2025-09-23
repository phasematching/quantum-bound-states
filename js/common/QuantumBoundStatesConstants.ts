// Copyright 2025, University of Colorado Boulder

/**
 * Constants used throughout this simulation.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import quantumBoundStates from '../quantumBoundStates.js';

export default class QuantumBoundStatesConstants {

  private constructor() {
    // Not intended for instantiation.
  }

  public static readonly SCREEN_VIEW_X_MARGIN = 15;
  public static readonly SCREEN_VIEW_Y_MARGIN = 15;
}

quantumBoundStates.register( 'QuantumBoundStatesConstants', QuantumBoundStatesConstants );