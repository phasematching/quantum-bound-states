// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import optionize from '../../../phet-core/js/optionize.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';
import quantumBoundStates from '../quantumBoundStates.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';
import QuantumBoundStatesModel from './model/QuantumBoundStatesModel.js';
import QuantumBoundStatesScreenView from './view/QuantumBoundStatesScreenView.js';

type SelfOptions = {
  //TODO add options that are specific to QuantumBoundStatesScreen here
};

type QuantumBoundStatesScreenOptions = SelfOptions & ScreenOptions;

export default class QuantumBoundStatesScreen extends Screen<QuantumBoundStatesModel, QuantumBoundStatesScreenView> {

  public constructor( providedOptions: QuantumBoundStatesScreenOptions ) {

    const options = optionize<QuantumBoundStatesScreenOptions, SelfOptions, ScreenOptions>()( {
      name: QuantumBoundStatesStrings.screen.nameStringProperty,

      //TODO add default values for optional SelfOptions here

      //TODO add default values for optional ScreenOptions here
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty
    }, providedOptions );

    super(
      () => new QuantumBoundStatesModel( { tandem: options.tandem.createTandem( 'model' ) } ),
      model => new QuantumBoundStatesScreenView( model, { tandem: options.tandem.createTandem( 'view' ) } ),
      options
    );
  }
}

quantumBoundStates.register( 'QuantumBoundStatesScreen', QuantumBoundStatesScreen );