// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import optionize from '../../../phet-core/js/optionize.js';
import quantumBoundStates from '../quantumBoundStates.js';
import OneWellModel from './model/OneWellModel.js';
import OneWellScreenView from './view/OneWellScreenView.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';

type SelfOptions = {
  //TODO add options that are specific to OneWellScreen here
};

type OneWellScreenOptions = SelfOptions & ScreenOptions;

export default class OneWellScreen extends Screen<OneWellModel, OneWellScreenView> {

  public constructor( providedOptions: OneWellScreenOptions ) {

    const options = optionize<OneWellScreenOptions, SelfOptions, ScreenOptions>()( {
      name: QuantumBoundStatesStrings.screen.oneWellStringProperty,

      //TODO add default values for optional SelfOptions here

      //TODO add default values for optional ScreenOptions here
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty
    }, providedOptions );

    super(
      () => new OneWellModel( { tandem: options.tandem.createTandem( 'model' ) } ),
      model => new OneWellScreenView( model, { tandem: options.tandem.createTandem( 'view' ) } ),
      options
    );
  }
}

quantumBoundStates.register( 'OneWellScreen', OneWellScreen );