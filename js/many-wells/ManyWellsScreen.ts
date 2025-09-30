// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import quantumBoundStates from '../quantumBoundStates.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';
import ManyWellsModel from './model/ManyWellsModel.js';
import ManyWellsScreenView from './view/ManyWellsScreenView.js';
import Tandem from '../../../tandem/js/Tandem.js';

export default class ManyWellsScreen extends Screen<ManyWellsModel, ManyWellsScreenView> {

  public constructor( tandem: Tandem ) {

    const options: ScreenOptions = {
      name: QuantumBoundStatesStrings.screen.manyWellsStringProperty,
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty,
      tandem: tandem
    };

    super(
      () => new ManyWellsModel( tandem.createTandem( 'model' ) ),
      model => new ManyWellsScreenView( model, tandem.createTandem( 'view' ) ),
      options
    );
  }
}

quantumBoundStates.register( 'ManyWellsScreen', ManyWellsScreen );