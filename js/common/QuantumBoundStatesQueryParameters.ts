// Copyright 2025, University of Colorado Boulder

/**
 * QuantumBoundStatesQueryParameters defines query parameters that are specific to this simulation.
 * Run with ?log to print query parameters and their values to the browser console at startup.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import logGlobal from '../../../phet-core/js/logGlobal.js';
import { QueryStringMachine } from '../../../query-string-machine/js/QueryStringMachineModule.js';
import quantumBoundStates from '../quantumBoundStates.js';

const QuantumBoundStatesQueryParameters = QueryStringMachine.getAll( {
  //TODO add schemas for query parameters
} );

quantumBoundStates.register( 'QuantumBoundStatesQueryParameters', QuantumBoundStatesQueryParameters );

// Log query parameters
logGlobal( 'phet.chipper.queryParameters' );
logGlobal( 'phet.preloads.phetio.queryParameters' );
logGlobal( 'phet.quantumBoundStates.QuantumBoundStatesQueryParameters' );

export default QuantumBoundStatesQueryParameters;