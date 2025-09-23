// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import ScreenView, { ScreenViewOptions } from '../../../../joist/js/ScreenView.js';
import optionize from '../../../../phet-core/js/optionize.js';
import ResetAllButton from '../../../../scenery-phet/js/buttons/ResetAllButton.js';
import QuantumBoundStatesConstants from '../../common/QuantumBoundStatesConstants.js';
import quantumBoundStates from '../../quantumBoundStates.js';
import QuantumBoundStatesModel from '../model/QuantumBoundStatesModel.js';

type SelfOptions = {
 //TODO add options that are specific to QuantumBoundStatesScreenView here
};

type QuantumBoundStatesScreenViewOptions = SelfOptions & ScreenViewOptions;

export default class QuantumBoundStatesScreenView extends ScreenView {

  public constructor( model: QuantumBoundStatesModel, providedOptions: QuantumBoundStatesScreenViewOptions ) {

    const options = optionize<QuantumBoundStatesScreenViewOptions, SelfOptions, ScreenViewOptions>()( {

      //TODO add default values for optional SelfOptions here

      //TODO add default values for optional ScreenViewOptions here
    }, providedOptions );

    super( options );

    const resetAllButton = new ResetAllButton( {
      listener: () => {
        this.interruptSubtreeInput(); // cancel interactions that may be in progress
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - QuantumBoundStatesConstants.SCREEN_VIEW_X_MARGIN,
      bottom: this.layoutBounds.maxY - QuantumBoundStatesConstants.SCREEN_VIEW_Y_MARGIN,
      tandem: options.tandem.createTandem( 'resetAllButton' )
    } );
    this.addChild( resetAllButton );
  }

  /**
   * Resets the view.
   */
  public reset(): void {
    //TODO
  }

  /**
   * Steps the view.
   * @param dt - time step, in seconds
   */
  public override step( dt: number ): void {
    //TODO
  }
}

quantumBoundStates.register( 'QuantumBoundStatesScreenView', QuantumBoundStatesScreenView );