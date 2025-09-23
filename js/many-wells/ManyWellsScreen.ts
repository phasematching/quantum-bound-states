// Copyright 2025, University of Colorado Boulder

/**
 * TODO Describe this class and its responsibilities.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Screen, { ScreenOptions } from '../../../joist/js/Screen.js';
import optionize from '../../../phet-core/js/optionize.js';
import quantumBoundStates from '../quantumBoundStates.js';
import QuantumBoundStatesStrings from '../QuantumBoundStatesStrings.js';
import QuantumBoundStatesColors from '../common/QuantumBoundStatesColors.js';
import ManyWellsModel from './model/ManyWellsModel.js';
import ManyWellsScreenView from './view/ManyWellsScreenView.js';

type SelfOptions = {
  //TODO add options that are specific to ManyWellsScreen here
};

type ManyWellsScreenOptions = SelfOptions & ScreenOptions;

export default class ManyWellsScreen extends Screen<ManyWellsModel, ManyWellsScreenView> {

  public constructor( providedOptions: ManyWellsScreenOptions ) {

    const options = optionize<ManyWellsScreenOptions, SelfOptions, ScreenOptions>()( {
      name: QuantumBoundStatesStrings.screen.manyWellsStringProperty,

      //TODO add default values for optional SelfOptions here

      //TODO add default values for optional ScreenOptions here
      backgroundColorProperty: QuantumBoundStatesColors.screenBackgroundColorProperty
    }, providedOptions );

    super(
      () => new ManyWellsModel( { tandem: options.tandem.createTandem( 'model' ) } ),
      model => new ManyWellsScreenView( model, { tandem: options.tandem.createTandem( 'view' ) } ),
      options
    );
  }
}

quantumBoundStates.register( 'ManyWellsScreen', ManyWellsScreen );