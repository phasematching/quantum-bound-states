// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import quantumBoundStates from '../quantumBoundStates.js';
import TwoWellsModel from './model/TwoWellsModel.js';
import TwoWellsScreenView from './view/TwoWellsScreenView.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';
import Tandem from '../../../tandem/js/Tandem.js';

export default class TwoWellsScreen extends Screen<TwoWellsModel, TwoWellsScreenView> {

  public constructor( tandem: Tandem ) {

    const options: ScreenOptions = {
      name: QuantumBoundStatesStrings.screen.twoWellsStringProperty,
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty,
      tandem: tandem
    };

    super(
      () => new TwoWellsModel( tandem.createTandem( 'model' ) ),
      model => new TwoWellsScreenView( model, tandem.createTandem( 'view' ) ),
      options
    );
  }
}

quantumBoundStates.register( 'TwoWellsScreen', TwoWellsScreen );