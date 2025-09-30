// Copyright 2025, University of Colorado Boulder

/**
 * ManyWellsModel is the top-level model for the 'Many Wells' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import TModel from '../../../../joist/js/TModel.js';
import quantumBoundStates from '../../quantumBoundStates.js';
import Tandem from '../../../../tandem/js/Tandem.js';

export default class ManyWellsModel implements TModel {

  public constructor( tandem: Tandem ) {
    //TODO
  }

  /**
   * Resets the model.
   */
  public reset(): void {
    //TODO
  }

  /**
   * Steps the model.
   * @param dt - time step, in seconds
   */
  public step( dt: number ): void {
    //TODO
  }
}

quantumBoundStates.register( 'ManyWellsModel', ManyWellsModel );