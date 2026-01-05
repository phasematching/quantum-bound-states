// Copyright 2025, University of Colorado Boulder

/**
 * QUnit tests for Numerov solver.
 *
 * @author Martin Veillette
 */

import { solveNumerov } from './NumerovSolver.js';
import FundamentalConstants from './FundamentalConstants.js';

const formatNumber = ( value: number, decimals: number ): string => Number.prototype.toFixed.call( value, decimals );

QUnit.module( 'NumerovSolver' );

const HBAR = FundamentalConstants.HBAR;
const ELECTRON_MASS = FundamentalConstants.ELECTRON_MASS;
const EV_TO_JOULES = FundamentalConstants.EV_TO_JOULES;

QUnit.test( 'Harmonic Oscillator', assert => {

  const mass = ELECTRON_MASS;  // kg
  const omega = 1e15;  // rad/s
  const k = mass * omega * omega;  // J/m^2
  const potential = ( x: number ) => 0.5 * k * x * x;  // J

  // Energy of the ground state
  const E0 = 0.5 * HBAR * omega;  // J

  // Turning point radius
  const x_turn = Math.sqrt( 2 * E0 / k );
  const gridConfig = {
    xMin: -6 * x_turn,  // m
    xMax: 6 * x_turn,  // m
    numPoints: 1001  // number of points
  };

  const numStates = 20;
  const result = solveNumerov( potential, mass, numStates, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

  assert.ok( result.energies.length === numStates, `Found ${result.energies.length} states` );

  let maxRelativeError = 0;
  for ( let n = 0; n < result.energies.length; n++ ) {
    const E_computed = result.energies[ n ];
    const E_analytical = ( n + 0.5 ) * HBAR * omega;
    const relativeError = Math.abs( E_computed - E_analytical ) / E_analytical;
    maxRelativeError = Math.max( maxRelativeError, relativeError );

    assert.ok(
      relativeError < 0.005,
      `State n=${n}: Error=${formatNumber( relativeError * 100, 4 )}%`
    );
  }

  console.log( `Harmonic Oscillator - Max error: ${formatNumber( maxRelativeError * 100, 4 )}%` );
} );

QUnit.test( 'Infinite Square Well', assert => {

  const mass = ELECTRON_MASS;
  const L = 1e-9;
  const V0 = 500 * EV_TO_JOULES;
  const potential = ( x: number ) => Math.abs( x ) < L / 2 ? 0 : V0;

  const gridConfig = {
    xMin: -0.6 * L,
    xMax: 0.6 * L,
    numPoints: 1001
  };

  const E1_analytical = ( Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * L * L );
  const numStates = 20;
  const result = solveNumerov( potential, mass, numStates, gridConfig, 0.5 * E1_analytical, 21 * 21 * E1_analytical );

  assert.ok( result.energies.length === numStates, `Found ${result.energies.length} states` );

  let maxRelativeError = 0;
  for ( let i = 0; i < result.energies.length; i++ ) {
    const n = i + 1;
    const E_computed = result.energies[ i ];
    const E_analytical = ( n * n * Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * L * L );
    const relativeError = Math.abs( E_computed - E_analytical ) / E_analytical;
    maxRelativeError = Math.max( maxRelativeError, relativeError );

    assert.ok(
      relativeError < 0.05,
      `State n=${n}: Error=${formatNumber( relativeError * 100, 4 )}%`
    );
  }

  console.log( `Infinite Square Well - Max error: ${formatNumber( maxRelativeError * 100, 4 )}%` );
} );

QUnit.test( 'Wavefunction Normalization', assert => {

  const mass = ELECTRON_MASS;
  const omega = 1e15;
  const k = mass * omega * omega;
  const potential = ( x: number ) => 0.5 * k * x * x;

  // Use grid based on turning point for better numerical accuracy
  const E0 = 0.5 * HBAR * omega;
  const x_turn = Math.sqrt( 2 * E0 / k );
  const gridConfig = {
    xMin: -6 * x_turn,
    xMax: 6 * x_turn,
    numPoints: 1001
  };

  const result = solveNumerov( potential, mass, 20, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

  // Ensure we found some states
  assert.ok( result.wavefunctions.length > 0, `Found ${result.wavefunctions.length} states` );

  const dx = ( gridConfig.xMax - gridConfig.xMin ) / ( gridConfig.numPoints - 1 );

  for ( let i = 0; i < result.wavefunctions.length; i++ ) {
    const psi = result.wavefunctions[ i ];

    let norm = 0;
    for ( let j = 0; j < psi.length - 1; j++ ) {
      norm += ( psi[ j ] * psi[ j ] + psi[ j + 1 ] * psi[ j + 1 ] ) / 2;
    }
    norm *= dx;

    assert.ok(
      Math.abs( norm - 1.0 ) < 0.01,
      `State ${i}: Norm = ${formatNumber( norm, 6 )}`
    );
  }
} );

QUnit.test( 'Node Counting', assert => {

  const mass = ELECTRON_MASS;
  const omega = 1e15;
  const k = mass * omega * omega;
  const potential = ( x: number ) => 0.5 * k * x * x;

  // Use grid based on turning point for better numerical accuracy
  const E0 = 0.5 * HBAR * omega;
  const x_turn = Math.sqrt( 2 * E0 / k );
  const gridConfig = {
    xMin: -6 * x_turn,
    xMax: 6 * x_turn,
    numPoints: 1001
  };

  const result = solveNumerov( potential, mass, 20, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

  // Ensure we found some states
  assert.ok( result.wavefunctions.length > 0, `Found ${result.wavefunctions.length} states` );

  for ( let n = 0; n < result.wavefunctions.length; n++ ) {
    const psi = result.wavefunctions[ n ];

    let nodeCount = 0;
    for ( let j = 1; j < psi.length; j++ ) {
      if ( psi[ j - 1 ] * psi[ j ] < 0 && Math.abs( psi[ j - 1 ] ) > 1e-8 && Math.abs( psi[ j ] ) > 1e-8 ) {
        nodeCount++;
      }
    }

    assert.ok( nodeCount === n, `State n=${n}: ${nodeCount} nodes` );
  }
} );
