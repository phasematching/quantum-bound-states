// Copyright 2025, University of Colorado Boulder

/**
 * Main entry point for the sim.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Sim, { SimOptions } from '../../joist/js/Sim.js';
import simLauncher from '../../joist/js/simLauncher.js';
import Tandem from '../../tandem/js/Tandem.js';
import QuantumBoundStatesScreen from './quantum-bound-states/QuantumBoundStatesScreen.js';
import QuantumBoundStatesStrings from './QuantumBoundStatesStrings.js';
import './common/QuantumBoundStatesQueryParameters.js';

// Launch the sim. Beware that scenery Image nodes created outside simLauncher.launch() will have zero bounds
// until the images are fully loaded. See https://github.com/phetsims/coulombs-law/issues/70#issuecomment-429037461
simLauncher.launch( () => {

  const titleStringProperty = QuantumBoundStatesStrings[ 'quantum-bound-states' ].titleStringProperty;

  const screens = [
    new QuantumBoundStatesScreen( { tandem: Tandem.ROOT.createTandem( 'quantumBoundStatesScreen' ) } )
  ];

  const options: SimOptions = {

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