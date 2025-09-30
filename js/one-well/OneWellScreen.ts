// Copyright 2025, University of Colorado Boulder

/**
 * OneWellScreen is the 'One Well' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import quantumBoundStates from '../quantumBoundStates.js';
import OneWellModel from './model/OneWellModel.js';
import OneWellScreenView from './view/OneWellScreenView.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';
import Tandem from '../../../tandem/js/Tandem.js';

export default class OneWellScreen extends Screen<OneWellModel, OneWellScreenView> {

  public constructor( tandem: Tandem ) {

    const options: ScreenOptions = {
      name: QuantumBoundStatesStrings.screen.oneWellStringProperty,
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty,
      tandem: tandem
    };

    super(
      () => new OneWellModel( tandem.createTandem( 'model' ) ),
      model => new OneWellScreenView( model, tandem.createTandem( 'view' ) ),
      options
    );
  }
}

quantumBoundStates.register( 'OneWellScreen', OneWellScreen );