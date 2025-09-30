// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import ScreenView from '../../../../joist/js/ScreenView.js';
import ResetAllButton from '../../../../scenery-phet/js/buttons/ResetAllButton.js';
import quantumBoundStates from '../../quantumBoundStates.js';
import ManyWellsModel from '../model/ManyWellsModel.js';
import QuantumBoundStatesConstants from '../../common/QuantumBoundStatesConstants.js';
import Tandem from '../../../../tandem/js/Tandem.js';

export default class ManyWellsScreenView extends ScreenView {

  public constructor( model: ManyWellsModel, tandem: Tandem ) {

    super( {
      tandem: tandem
    } );

    const resetAllButton = new ResetAllButton( {
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - QuantumBoundStatesConstants.SCREEN_VIEW_X_MARGIN,
      bottom: this.layoutBounds.maxY - QuantumBoundStatesConstants.SCREEN_VIEW_Y_MARGIN,
      tandem: tandem.createTandem( 'resetAllButton' )
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

quantumBoundStates.register( 'ManyWellsScreenView', ManyWellsScreenView );