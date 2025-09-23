// Copyright 2025, University of Colorado Boulder

/**
 * Main entry point for the sim.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Sim, { SimOptions } from '../../joist/js/Sim.js';
import simLauncher from '../../joist/js/simLauncher.js';
import Tandem from '../../tandem/js/Tandem.js';
import OneWellScreen from './one-well/OneWellScreen.js';
import QuantumBoundStatesStrings from './QuantumBoundStatesStrings.js';
import './common/QuantumBoundStatesQueryParameters.js';
import TwoWellsScreen from './two-wells/TwoWellsScreen.js';
import ManyWellsScreen from './many-wells/ManyWellsScreen.js';
import PreferencesModel from '../../joist/js/preferences/PreferencesModel.js';

// Launch the sim. Beware that scenery Image nodes created outside simLauncher.launch() will have zero bounds
// until the images are fully loaded. See https://github.com/phetsims/coulombs-law/issues/70#issuecomment-429037461
simLauncher.launch( () => {

  const titleStringProperty = QuantumBoundStatesStrings[ 'quantum-bound-states' ].titleStringProperty;

  const screens = [
    new OneWellScreen( { tandem: Tandem.ROOT.createTandem( 'oneWellScreen' ) } ),
    new TwoWellsScreen( { tandem: Tandem.ROOT.createTandem( 'twoWellsScreen' ) } ),
    new ManyWellsScreen( { tandem: Tandem.ROOT.createTandem( 'manyWellsScreen' ) } )
  ];

  const options: SimOptions = {

    preferencesModel: new PreferencesModel( {
      visualOptions: {
        supportsProjectorMode: true
      }
    } ),

    //TODO fill in credits, all of these fields are optional, see joist.CreditsNode
    credits: {
      leadDesign: '',
      softwareDevelopment: '',
      team: '',
      contributors: '',
      qualityAssurance: '',
      graphicArts: '',
      soundDesign: '',
      thanks: ''
    }
  };

  const sim = new Sim( titleStringProperty, screens, options );
  sim.start();
} );