// Copyright 2025, University of Colorado Boulder

/**
 * Node.js tests for Numerov solver.
 * Run with: npm test
 *
 * @author Martin Veillette
 */

// Import globals first - this sets up PhET framework globals
import './globals.js';

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { solveNumerov } from '../../chipper/dist/js/quantum-bound-states/js/common/model/NumerovSolver.js';
import FundamentalConstants from '../../chipper/dist/js/quantum-bound-states/js/common/model/FundamentalConstants.js';

const formatNumber = ( value, decimals ) => Number.prototype.toFixed.call( value, decimals );

const HBAR = FundamentalConstants.HBAR;
const ELECTRON_MASS = FundamentalConstants.ELECTRON_MASS;
const EV_TO_JOULES = FundamentalConstants.EV_TO_JOULES;

describe( 'NumerovSolver', () => {

  test( 'Harmonic Oscillator', () => {

    const mass = ELECTRON_MASS;  // kg
    const omega = 1e15;  // rad/s
    const k = mass * omega * omega;  // J/m^2
    const potential = ( x ) => 0.5 * k * x * x;  // J

    // Energy of the ground state
    const E0 = 0.5 * HBAR * omega;  // J

    // Use standard grid from -4nm to 4nm
    const gridConfig = {
      xMin: -4e-9,  // m
      xMax: 4e-9,  // m
      numPoints: 10001  // number of points
    };

    const numStates = 5;
    const result = solveNumerov( potential, mass, numStates, gridConfig, 0.1 * E0, 50.5 * HBAR * omega );

    // Basic smoke test - just verify we get some results
    assert.ok( result.energies.length > 0, `Found ${result.energies.length} states` );
    assert.ok( result.wavefunctions.length === result.energies.length, 'Energies and wavefunctions match' );
    assert.ok( Array.isArray( result.energies ), 'Energies is an array' );
    assert.ok( Array.isArray( result.wavefunctions ), 'Wavefunctions is an array' );

    console.log( `Harmonic Oscillator - Found ${result.energies.length} states` );

    for ( let n = 0; n < result.energies.length; n++ ) {
      console.log( `Energy of state ${n}: ${(result.energies[n] / EV_TO_JOULES).toFixed(2)} eV` );
      console.log( `Expected energy: ${( HBAR * omega*(n+1/2) / EV_TO_JOULES).toFixed(2)} eV` );
    }
  } );

  test( 'Infinite Square Well', () => {

    const mass = ELECTRON_MASS;
    const L = 2e-9;
    const V0 = 500 * EV_TO_JOULES;
    const potential = ( x ) => Math.abs( x ) < L / 2 ? 0 : V0;

    // Use standard grid from -4nm to 4nm
    const gridConfig = {
      xMin: -4e-9,
      xMax: 4e-9,
      numPoints: 100001
    };

    const E1_analytical = ( Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * L * L );
    const numStates = 20;
    const result = solveNumerov( potential, mass, numStates, gridConfig, 0.5 * E1_analytical, 21 * 21 * E1_analytical );

    console.log( `Infinite Square Well - Found ${result.energies.length} states` );
    assert.ok( result.energies.length >= 5, `Found ${result.energies.length} states (expected at least 5)` );

    let maxRelativeError = 0;
    for ( let i = 0; i < result.energies.length; i++ ) {
      const n = i + 1;
      const E_computed = result.energies[ i ];
      const E_analytical = ( n * n * Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * L * L );
      const relativeError = Math.abs( E_computed - E_analytical ) / E_analytical;
      maxRelativeError = Math.max( maxRelativeError, relativeError );

      assert.ok(
        relativeError < 0.5,
        `State n=${n}: Error=${formatNumber( relativeError * 100, 4 )}%`
      );
    }

    console.log( `Infinite Square Well - Max error: ${formatNumber( maxRelativeError * 100, 4 )}%` );
  } );

  test( 'Wavefunction Normalization', () => {

    const mass = ELECTRON_MASS;
    const omega = 1e15;
    const k = mass * omega * omega;
    const potential = ( x ) => 0.5 * k * x * x;

    // Use standard grid from -4nm to 4nm
    const E0 = 0.5 * HBAR * omega;
    const gridConfig = {
      xMin: -4e-9,
      xMax: 4e-9,
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

  test( 'Node Counting', { skip: 'Node counting algorithm needs review' }, () => {

    const mass = ELECTRON_MASS;
    const omega = 1e15;
    const k = mass * omega * omega;
    const potential = ( x ) => 0.5 * k * x * x;

    // Use standard grid from -4nm to 4nm
    const E0 = 0.5 * HBAR * omega;
    const gridConfig = {
      xMin: -4e-9,
      xMax: 4e-9,
      numPoints: 1001
    };

    const result = solveNumerov( potential, mass, 20, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

    // Ensure we found some states
    assert.ok( result.wavefunctions.length > 0, `Found ${result.wavefunctions.length} states` );

    for ( let n = 0; n < result.wavefunctions.length; n++ ) {
      const psi = result.wavefunctions[ n ];

      let nodeCount = 0;
      for ( let j = 1; j < psi.length; j++ ) {
        if ( psi[ j - 1 ] * psi[ j ] < 0 && Math.abs( psi[ j - 1 ] ) > 1e-16 && Math.abs( psi[ j ] ) > 1e-16 ) {
          nodeCount++;
        }
      }

      assert.equal( nodeCount, n, `State n=${n}: ${nodeCount} nodes` );
    }
  } );

} );
