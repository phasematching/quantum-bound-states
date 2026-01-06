// Copyright 2026, University of Colorado Boulder

/**
 * Analytical solution for the infinite square well (particle in a box).
 *
 * The infinite square well is the simplest quantum mechanical system where a particle
 * is confined to a region with impenetrable walls.
 *
 * POTENTIAL:
 *   V(x) = 0     for 0 < x < L
 *   V(x) = ∞     otherwise
 *
 * ENERGY EIGENVALUES:
 *   E_n = (n² π² ℏ²) / (2mL²)    for n = 1, 2, 3, ...
 *
 * WAVEFUNCTIONS:
 *   ψ_n(x) = √(2/L) sin(nπx/L)   for 0 < x < L
 *   ψ_n(x) = 0                    otherwise
 *
 * REFERENCES:
 * - Griffiths, D. J., & Schroeter, D. F. (2018). "Introduction to Quantum Mechanics" (3rd ed.).
 *   Cambridge University Press. Section 2.2, pp. 31-39.
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../../quantumBoundStates.js';
import { BoundStateResult, GridConfig, PotentialFunction } from '../PotentialFunction.js';
import FundamentalConstants from '../FundamentalConstants.js';

/**
 * Create the potential function for an infinite square well.
 * V(x) = 0 for 0 < x < L, V(x) = ∞ otherwise
 *
 * @param wellWidth - Width of the well L in meters
 * @param barrierHeight - Height to use for "infinite" barrier (default: 1000 eV)
 * @returns Potential function V(x) in Joules
 */
export function createInfiniteSquareWellPotential(
  wellWidth: number,
  barrierHeight = 1000 * FundamentalConstants.EV_TO_JOULES
): PotentialFunction {
  return ( x: number ) => {
    // Inside well: V = 0
    // Outside well: V = very large (representing infinity)
    if ( x > 0 && x < wellWidth ) {
      return 0;
    }
    return barrierHeight;
  };
}

/**
 * Analytical solution for the infinite square well (particle in a box).
 *
 * This function returns a BoundStateResult compatible with NumerovSolver output.
 * The API matches NumerovSolver.solve() by taking energy bounds.
 *
 * @param wellWidth - Width of the well L in meters
 * @param mass - Particle mass in kg
 * @param gridConfig - Grid configuration for wavefunction evaluation
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Bound state results with exact energies and wavefunctions
 *
 * @example
 * // Solve for states within energy range
 * const L = 1e-9; // 1 nm well
 * const mass = FundamentalConstants.ELECTRON_MASS;
 *
 * const result = solveInfiniteSquareWell(
 *   L,
 *   mass,
 *   { xMin: -0.5e-9, xMax: 1.5e-9, numPoints: 1001 },
 *   0,
 *   50 * FundamentalConstants.EV_TO_JOULES
 * );
 *
 * console.log( 'Ground state energy:', result.energies[ 0 ] );
 * console.log( 'Number of states found:', result.energies.length );
 */
export function solveInfiniteSquareWell(
  wellWidth: number,
  mass: number,
  gridConfig: GridConfig,
  energyMin: number,
  energyMax: number
): BoundStateResult {
  const { HBAR } = FundamentalConstants;

  // Calculate energies: E_n = (n² π² ℏ²) / (2mL²) for n = 1, 2, 3, ...
  // Find all n where energyMin <= E_n <= energyMax

  // Solve for n from E_n = (n² π² ℏ²) / (2mL²)
  // n = √(2mL² E_n / (π² ℏ²))
  const factor = 2 * mass * wellWidth * wellWidth / ( Math.PI * Math.PI * HBAR * HBAR );

  // Find minimum n: n >= √(2mL² energyMin / (π² ℏ²))
  // Important: n starts at 1, not 0!
  const nMin = Math.max( 1, Math.ceil( Math.sqrt( factor * energyMin ) ) );

  // Find maximum n: n <= √(2mL² energyMax / (π² ℏ²))
  const nMax = Math.floor( Math.sqrt( factor * energyMax ) );

  // Collect all quantum numbers within the energy range
  const quantumNumbers: number[] = [];
  const energies: number[] = [];
  for ( let n = nMin; n <= nMax; n++ ) {
    const energy = ( n * n * Math.PI * Math.PI * HBAR * HBAR ) / ( 2 * mass * wellWidth * wellWidth );
    quantumNumbers.push( n );
    energies.push( energy );
  }

  // Generate grid
  const numPoints = gridConfig.numPoints;
  const xGridArray: number[] = [];
  const dx = ( gridConfig.xMax - gridConfig.xMin ) / ( numPoints - 1 );
  for ( let i = 0; i < numPoints; i++ ) {
    xGridArray.push( gridConfig.xMin + i * dx );
  }

  // Calculate wavefunctions: ψ_n(x) = √(2/L) sin(nπx/L)
  const wavefunctions: number[][] = [];
  const normalization = Math.sqrt( 2 / wellWidth );

  for ( const n of quantumNumbers ) {
    const wavefunction: number[] = [];

    for ( const x of xGridArray ) {
      // Wavefunction is zero outside the well [0, L]
      if ( x <= 0 || x >= wellWidth ) {
        wavefunction.push( 0 );
      }
      else {
        // Inside the well: ψ_n(x) = √(2/L) sin(nπx/L)
        const value = normalization * Math.sin( n * Math.PI * x / wellWidth );
        wavefunction.push( value );
      }
    }
    wavefunctions.push( wavefunction );
  }

  return {
    energies: energies,
    wavefunctions: wavefunctions,
    xGridArray: xGridArray,
    method: 'analytical'
  };
}

quantumBoundStates.register( 'InfiniteSquareWellSolution', {
  solveInfiniteSquareWell,
  createInfiniteSquareWellPotential
} );
