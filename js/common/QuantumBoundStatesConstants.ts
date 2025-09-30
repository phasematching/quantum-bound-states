// Copyright 2025, University of Colorado Boulder

/**
 * QuantumBoundStatesConstants defines constants that are used throughout this simulation.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import quantumBoundStates from '../quantumBoundStates.js';
import { CreditsData } from '../../../joist/js/CreditsNode.js';

export default class QuantumBoundStatesConstants {

  private constructor() {
    // Not intended for instantiation.
  }

  // Credits are shared by all sims in this family.
  public static readonly CREDITS: CreditsData = {
    leadDesign: 'Sam McKagan',
    softwareDevelopment: 'Chris Malley (PixelZoom, Inc.)',
    team: 'Wendy Adams, Kathy Perkins, Carl Wieman',
    contributors: '',
    qualityAssurance: '',
    graphicArts: '',
    soundDesign: '',
    thanks: ''
  };

  public static readonly SCREEN_VIEW_X_MARGIN = 15;
  public static readonly SCREEN_VIEW_Y_MARGIN = 15;
}

quantumBoundStates.register( 'QuantumBoundStatesConstants', QuantumBoundStatesConstants );