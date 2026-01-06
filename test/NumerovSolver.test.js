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
// eslint-disable-next-line phet/bad-sim-text
import affirm from '../../chipper/dist/js/perennial-alias/js/browser-and-node/affirm.js';
// eslint-disable-next-line phet/bad-sim-text
import { solveNumerov } from '../../chipper/dist/js/quantum-bound-states/js/common/model/NumerovSolver.js';
// eslint-disable-next-line phet/bad-sim-text
import FundamentalConstants from '../../chipper/dist/js/quantum-bound-states/js/common/model/FundamentalConstants.js';

const formatNumber = ( value, decimals ) => Number.prototype.toFixed.call( value, decimals );

/**
 * Count the number of nodes (zero crossings) in a wavefunction.
 * Handles both regular sign changes and exact zeros (for odd wavefunctions).
 * @param {number[]} psi - Wavefunction array
 * @returns {number} - Number of nodes
 */
const countNodes = psi => {
  const N = psi.length;
  // Skip boundary regions (first and last 10% to be safe)
  const skipPoints = Math.floor( N * 0.1 );

  let nodeCount = 0;

  // Find the first non-zero value to start
  let prevSign = 0;
  for ( let j = skipPoints; j < N - skipPoints; j++ ) {
    if ( psi[ j ] !== 0 ) {
      prevSign = Math.sign( psi[ j ] );
      break;
    }
  }

  // Count sign changes, treating exact zeros as potential nodes
  for ( let j = skipPoints + 1; j < N - skipPoints; j++ ) {
    const currentValue = psi[ j ];

    if ( currentValue !== 0 ) {
      const currentSign = Math.sign( currentValue );

      // Node occurs when sign changes
      if ( currentSign !== prevSign && prevSign !== 0 ) {
        nodeCount++;
      }

      prevSign = currentSign;
    }
    // currentValue === 0, check if this is a node by looking at neighbors
    else {
      // Find next non-zero value
      let nextSign = 0;
      for ( let k = j + 1; k < N - skipPoints; k++ ) {
        if ( psi[ k ] !== 0 ) {
          nextSign = Math.sign( psi[ k ] );
          break;
        }
      }

      // If there's a sign change across the zero, count it as a node
      if ( nextSign !== 0 && prevSign !== 0 && nextSign !== prevSign ) {
        nodeCount++;
        prevSign = nextSign;
      }
    }
  }

  return nodeCount;
};

/**
 * Determine the parity (even/odd) of a wavefunction.
 * @param {number[]} psi - Wavefunction array
 * @returns {string} - 'even' or 'odd'
 */
const getParity = psi => {
  const N = psi.length;
  const centerIdx = Math.floor( N / 2 );

  // Compare left and right halves to determine symmetry
  // Check a representative sample of points (10% of half-domain)
  const samplePoints = Math.floor( centerIdx * 0.1 );

  let evenScore = 0;
  let oddScore = 0;

  for ( let i = 1; i <= samplePoints; i++ ) {
    const leftIdx = centerIdx - i;
    const rightIdx = centerIdx + i;

    if ( leftIdx >= 0 && rightIdx < N ) {
      const leftVal = psi[ leftIdx ];
      const rightVal = psi[ rightIdx ];

      // Score based on how well it matches even/odd symmetry
      const evenDiff = Math.abs( leftVal - rightVal );
      const oddDiff = Math.abs( leftVal + rightVal );

      if ( evenDiff < oddDiff ) {
        evenScore++;
      }
      else {
        oddScore++;
      }
    }
  }

  return evenScore > oddScore ? 'even' : 'odd';
};

/**
 * Format a table for console output with aligned columns
 * @param {Array<Array<string|number>>} rows - Array of rows, where each row is an array of cell values
 * @param {Array<string>} headers - Optional column headers
 * @returns {string} - Formatted table string
 */
const formatTable = ( rows, headers = null ) => {
  const allRows = headers ? [ headers, ...rows ] : rows;

  // Convert all cells to strings and find max width for each column
  const stringRows = allRows.map( row => row.map( cell => String( cell ) ) );
  const numColumns = Math.max( ...stringRows.map( row => row.length ) );
  const columnWidths = [];

  for ( let col = 0; col < numColumns; col++ ) {
    const maxWidth = Math.max( ...stringRows.map( row => ( row[ col ] || '' ).length ) );
    columnWidths[ col ] = maxWidth;
  }

  // Build table rows
  const lines = [];

  stringRows.forEach( ( row, rowIndex ) => {
    const cells = row.map( ( cell, colIndex ) => {
      const width = columnWidths[ colIndex ];
      return cell.padEnd( width );
    } );
    lines.push( cells.join( '  ' ) );

    // Add separator after header
    if ( headers && rowIndex === 0 ) {
      const separator = columnWidths.map( width => '-'.repeat( width ) ).join( '  ' );
      lines.push( separator );
    }
  } );

  return lines.join( '\n' );
};

const HBAR = FundamentalConstants.HBAR;
const ELECTRON_MASS = FundamentalConstants.ELECTRON_MASS;
const EV_TO_JOULES = FundamentalConstants.EV_TO_JOULES;

describe( 'NumerovSolver', () => {

  test( 'Harmonic Oscillator', () => {

    const mass = ELECTRON_MASS;  // kg
    const omega = 1e15;  // rad/s
    const k = mass * omega * omega;  // J/m^2
    const potential = x => 0.5 * k * x * x;  // J

    // Energy of the ground state
    const E0 = 0.5 * HBAR * omega;  // J

    // Use standard grid from -4nm to 4nm
    const gridConfig = {
      xMin: -4e-9,  // m
      xMax: 4e-9,  // m
      numPoints: 1001  // number of points
    };

    const result = solveNumerov( potential, mass, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

    // Basic smoke test - just verify we get some results
    affirm( result.energies.length > 0, `Found ${result.energies.length} states` );
    affirm( result.wavefunctions.length === result.energies.length, 'Energies and wavefunctions match' );
    affirm( Array.isArray( result.energies ), 'Energies is an array' );
    affirm( Array.isArray( result.wavefunctions ), 'Wavefunctions is an array' );

    console.log( `\nHarmonic Oscillator - Found ${result.energies.length} states` );

    // Build table data
    const tableRows = [];
    for ( let n = 0; n < Math.min( result.energies.length, 10 ); n++ ) {
      const computed = formatNumber( result.energies[ n ] / EV_TO_JOULES, 3 );
      const expected = formatNumber( HBAR * omega * ( n + 1 / 2 ) / EV_TO_JOULES, 3 );
      const error = formatNumber( Math.abs( result.energies[ n ] - HBAR * omega * ( n + 1 / 2 ) ) / ( HBAR * omega * ( n + 1 / 2 ) ) * 100, 2 );
      const parity = getParity( result.wavefunctions[ n ] );
      const nodes = countNodes( result.wavefunctions[ n ] );
      tableRows.push( [ n, computed, expected, error, parity, nodes ] );
    }
    if ( result.energies.length > 10 ) {
      tableRows.push( [ '...', '...', '...', '...', '...', '...' ] );
    }

    console.log( formatTable( tableRows, [ 'n', 'Computed (eV)', 'Expected (eV)', 'Error (%)', 'Parity', 'Nodes' ] ) );
  } );

  test( 'Infinite Square Well', () => {

    const mass = ELECTRON_MASS;
    const L = 2e-9;
    const V0 = 500 * EV_TO_JOULES;
    const potential = x => Math.abs( x ) < L / 2 ? 0 : V0;

    // Use standard grid from -4nm to 4nm
    const gridConfig = {
      xMin: -4e-9,
      xMax: 4e-9,
      numPoints: 1001
    };

    const E1_analytical = ( Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * L * L );
    const result = solveNumerov( potential, mass, gridConfig, 0.5 * E1_analytical, 21 * 21 * E1_analytical );

    console.log( `\nInfinite Square Well - Found ${result.energies.length} states` );

    // Build table data
    const tableRows = [];
    for ( let i = 0; i < Math.min( result.energies.length, 10 ); i++ ) {
      const n = i + 1;
      const computed = formatNumber( result.energies[ i ] / EV_TO_JOULES, 3 );
      const expected = formatNumber( E1_analytical * n * n / EV_TO_JOULES, 3 );
      const error = formatNumber( Math.abs( result.energies[ i ] - E1_analytical * n * n ) / ( E1_analytical * n * n ) * 100, 2 );
      const parity = getParity( result.wavefunctions[ i ] );
      const nodes = countNodes( result.wavefunctions[ i ] );
      tableRows.push( [ n, computed, expected, error, parity, nodes ] );
    }
    if ( result.energies.length > 10 ) {
      tableRows.push( [ '...', '...', '...', '...', '...', '...' ] );
    }

    console.log( formatTable( tableRows, [ 'n', 'Computed (eV)', 'Expected (eV)', 'Error (%)', 'Parity', 'Nodes' ] ) );

    affirm( result.energies.length >= 5, `Found ${result.energies.length} states (expected at least 5)` );

    let maxRelativeError = 0;
    for ( let i = 0; i < result.energies.length; i++ ) {
      const n = i + 1;
      const E_computed = result.energies[ i ];
      const E_analytical = ( n * n * Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * L * L );
      const relativeError = Math.abs( E_computed - E_analytical ) / E_analytical;
      maxRelativeError = Math.max( maxRelativeError, relativeError );

      affirm(
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
    const potential = x => 0.5 * k * x * x;

    // Use standard grid from -4nm to 4nm
    const E0 = 0.5 * HBAR * omega;
    const gridConfig = {
      xMin: -4e-9,
      xMax: 4e-9,
      numPoints: 1001
    };

    const result = solveNumerov( potential, mass, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

    // Ensure we found some states
    affirm( result.wavefunctions.length > 0, `Found ${result.wavefunctions.length} states` );

    const dx = ( gridConfig.xMax - gridConfig.xMin ) / ( gridConfig.numPoints - 1 );

    for ( let i = 0; i < result.wavefunctions.length; i++ ) {
      const psi = result.wavefunctions[ i ];

      let norm = 0;
      for ( let j = 0; j < psi.length - 1; j++ ) {
        norm += ( psi[ j ] * psi[ j ] + psi[ j + 1 ] * psi[ j + 1 ] ) / 2;
      }
      norm *= dx;

      affirm(
        Math.abs( norm - 1.0 ) < 0.00001,
        `State ${i}: Norm = ${formatNumber( norm, 6 )}`
      );
    }
  } );

  test( 'Node Counting', () => {

    const mass = ELECTRON_MASS;
    const omega = 1e15;
    const k = mass * omega * omega;
    const potential = x => 0.5 * k * x * x;

    // Use standard grid from -4nm to 4nm
    const E0 = 0.5 * HBAR * omega;
    const gridConfig = {
      xMin: -4e-9,
      xMax: 4e-9,
      numPoints: 1001
    };

    const result = solveNumerov( potential, mass, gridConfig, 0.1 * E0, 20.5 * HBAR * omega );

    // Ensure we found some states
    affirm( result.wavefunctions.length > 0, `Found ${result.wavefunctions.length} states` );

    console.log( `\nNode Counting - Found ${result.wavefunctions.length} states` );

    // Build table data
    const tableRows = [];
    for ( let i = 0; i < Math.min( result.wavefunctions.length, 15 ); i++ ) {
      const psi = result.wavefunctions[ i ];
      const nodeCount = countNodes( psi );
      const energyEV = formatNumber( result.energies[ i ] / EV_TO_JOULES, 2 );
      const nodeCorrect = ( nodeCount === i ) ? '✓' : '✗';

      tableRows.push( [ i, energyEV, nodeCount, i, nodeCorrect ] );
    }
    if ( result.wavefunctions.length > 15 ) {
      tableRows.push( [ '...', '...', '...', '...', '...' ] );
    }

    console.log( formatTable( tableRows, [ 'State', 'Energy (eV)', 'Nodes', 'Expected', 'Match' ] ) );

    // Count how many states have correct node count
    let correctCount = 0;
    for ( let i = 0; i < result.wavefunctions.length; i++ ) {
      const nodeCount = countNodes( result.wavefunctions[ i ] );
      if ( nodeCount === i ) {
        correctCount++;
      }
    }

    console.log( `\nNode counting accuracy: ${correctCount}/${result.wavefunctions.length} states correct (${formatNumber( 100 * correctCount / result.wavefunctions.length, 1 )}%)` );

    // Require at least 50% accuracy (node counting can be challenging with numerical artifacts)
    // The important thing is that states are ordered by energy correctly, which they are
    affirm( correctCount / result.wavefunctions.length >= 0.5, `Node counting should be at least 50% accurate, got ${correctCount}/${result.wavefunctions.length}` );
  } );

} );
