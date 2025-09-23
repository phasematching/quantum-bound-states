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
  //TODO add options that are specific to QuantumBoundStatesModel here
};

type QuantumBoundStatesModelOptions = SelfOptions & PickRequired<PhetioObjectOptions, 'tandem'>;

export default class QuantumBoundStatesModel implements TModel {

  public constructor( providedOptions: QuantumBoundStatesModelOptions ) {
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

quantumBoundStates.register( 'QuantumBoundStatesModel', QuantumBoundStatesModel );