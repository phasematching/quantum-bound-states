// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import optionize from '../../../phet-core/js/optionize.js';
import quantumBoundStates from '../quantumBoundStates.js';
import TwoWellsModel from './model/TwoWellsModel.js';
import TwoWellsScreenView from './view/TwoWellsScreenView.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';

type SelfOptions = {
  //TODO add options that are specific to TwoWellsScreen here
};

type TwoWellsScreenOptions = SelfOptions & ScreenOptions;

export default class TwoWellsScreen extends Screen<TwoWellsModel, TwoWellsScreenView> {

  public constructor( providedOptions: TwoWellsScreenOptions ) {

    const options = optionize<TwoWellsScreenOptions, SelfOptions, ScreenOptions>()( {
      name: QuantumBoundStatesStrings.screen.twoWellsStringProperty,

      //TODO add default values for optional SelfOptions here

      //TODO add default values for optional ScreenOptions here
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty
    }, providedOptions );

    super(
      () => new TwoWellsModel( { tandem: options.tandem.createTandem( 'model' ) } ),
      model => new TwoWellsScreenView( model, { tandem: options.tandem.createTandem( 'view' ) } ),
      options
    );
  }
}

quantumBoundStates.register( 'TwoWellsScreen', TwoWellsScreen );