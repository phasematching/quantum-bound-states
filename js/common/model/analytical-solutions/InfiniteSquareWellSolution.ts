// Copyright 2026, University of Colorado Boulder

/**
 * Analytical solution for the infinite square well (particle in a box).
 *
 * The infinite square well is the simplest quantum mechanical system where a particle
 * is confined to a region with impenetrable walls.
 *
 * POTENTIAL:
 *   V(x) = 0     for -L/2 < x < L/2
 *   V(x) = ∞     otherwise
 *
 * ENERGY EIGENVALUES:
 *   E_n = (n² π² ℏ²) / (2mL²)    for n = 1, 2, 3, ...
 *
 * WAVEFUNCTIONS:
 *   ψ_n(x) = √(2/L) sin(nπ(x + L/2)/L),  -L/2 ≤ x ≤ L/2
 *   ψ_n(x) = 0,  |x| > L/2
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../../quantumBoundStates.js';
import { BoundStateResult, GridConfig, PotentialFunction } from '../PotentialFunction.js';
import FundamentalConstants from '../FundamentalConstants.js';

/**
 * Create the potential function for an infinite square well.
 * V(x) = 0 for -L/2 < x < L/2, V(x) = ∞ otherwise
 *
 * @param wellWidth - Width of the well L in meters
 * @param barrierHeight - Height to use for "infinite" barrier (default: 1000 eV)
 * @returns Potential function V(x) in Joules
 */
export function createInfiniteSquareWellPotential(
  wellWidth: number,
  barrierHeight = 1000 * FundamentalConstants.EV_TO_JOULES
): PotentialFunction {
  const halfWidth = wellWidth / 2;
  return ( x: number ) => {
    // Inside well: V = 0
    // Outside well: V = very large (representing infinity)
       if ( x >= -halfWidth && x <= halfWidth ) {
        return 0;
      }
 else {
        return barrierHeight;
      }
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

  // Calculate wavefunctions: ψ_n(x) = √(2/L) sin(nπ(x + L/2)/L)
  // This is the shifted sine function for a centered well [-L/2, L/2]
  const wavefunctions: number[][] = [];
  const normalization = Math.sqrt( 2 / wellWidth );
  const halfWidth = wellWidth / 2;

  for ( const n of quantumNumbers ) {
    const wavefunction: number[] = [];

    for ( const x of xGridArray ) {
      // Wavefunction is zero outside the well [-L/2, L/2]
      if ( x <= -halfWidth || x >= halfWidth ) {
        wavefunction.push( 0 );
      }
      else {
        // Inside the well: ψ_n(x) = √(2/L) sin(nπ(x + L/2)/L)
        // This shifts the [0,L] solution to be centered at x=0
        const value = normalization * Math.sin( n * Math.PI * ( x + halfWidth ) / wellWidth );
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
  solveInfiniteSquareWell: solveInfiniteSquareWell,
  createInfiniteSquareWellPotential: createInfiniteSquareWellPotential
} );
