// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import TModel from '../../../../joist/js/TModel.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import quantumBoundStates from '../../quantumBoundStates.js';

type SelfOptions = {
  //TODO add options that are specific to TwoWellsModel here
};

type TwoWellsModelOptions = SelfOptions & PickRequired<PhetioObjectOptions, 'tandem'>;

export default class TwoWellsModel implements TModel {

  public constructor( providedOptions: TwoWellsModelOptions ) {
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

quantumBoundStates.register( 'TwoWellsModel', TwoWellsModel );