// Copyright 2026, University of Colorado Boulder

/**
 * Analytical solution for the finite square well.
 *
 * The finite square well extends the infinite well by allowing the potential to be
 * finite outside the well. Particles can penetrate into the classically forbidden
 * regions, demonstrating quantum tunneling.
 *
 * POTENTIAL:
 *   V(x) = -V₀   for |x| < L/2
 *   V(x) = 0     for |x| > L/2
 *
 * ENERGY EIGENVALUES:
 *   Energy eigenvalues are found by solving transcendental equations:
 *   - Even parity: tan(ξ) = η/ξ
 *   - Odd parity: -cot(ξ) = η/ξ
 *   where ξ = (L/2)√(2m(E+V₀)/ℏ²) and η = (L/2)√(-2mE/ℏ²)
 *
 * WAVEFUNCTIONS:
 *   Inside the well (|x| < L/2):
 *   - Even: ψ(x) = A cos(kx)
 *   - Odd: ψ(x) = A sin(kx)
 *   Outside the well (|x| > L/2):
 *   - Even: ψ(x) = B exp(-κ|x|)
 *   - Odd: ψ(x) = B sign(x) exp(-κ|x|)
 *   where k = √(2m(E+V₀)/ℏ²) and κ = √(-2mE/ℏ²)
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../../quantumBoundStates.js';
import { BoundStateResult, GridConfig, PotentialFunction } from '../PotentialFunction.js';
import FundamentalConstants from '../FundamentalConstants.js';

/**
 * Parity of the wavefunction (even or odd symmetry).
 */
type Parity = 'even' | 'odd';

/**
 * Create the potential function for a finite square well.
 * V(x) = -V₀ for |x| < L/2, V(x) = 0 for |x| > L/2
 *
 * @param wellWidth - Width of the well L in meters
 * @param wellDepth - Depth of the well V₀ in Joules (positive value)
 * @returns Potential function V(x) in Joules
 */
export function createFiniteSquareWellPotential(
  wellWidth: number,
  wellDepth: number
): PotentialFunction {
  return ( x: number ) => {
    // Inside well: V = -V₀
    // Outside well: V = 0
    if ( Math.abs( x ) < wellWidth / 2 ) {
      return -wellDepth;
    }
    return 0;
  };
}

/**
 * Solve the transcendental equation for even parity states.
 * Equation: tan(ξ) = η/ξ where ξ = (L/2)k and η = (L/2)κ
 *
 * @param xi - Value of ξ
 * @param z0 - Value of (L/2)√(2mV₀/ℏ²)
 * @returns Value of the transcendental equation (zero at solutions)
 */
function evenParityEquation( xi: number, z0: number ): number {
  const eta = Math.sqrt( z0 * z0 - xi * xi );
  return Math.tan( xi ) - eta / xi;
}

/**
 * Solve the transcendental equation for odd parity states.
 * Equation: -cot(ξ) = η/ξ where ξ = (L/2)k and η = (L/2)κ
 *
 * @param xi - Value of ξ
 * @param z0 - Value of (L/2)√(2mV₀/ℏ²)
 * @returns Value of the transcendental equation (zero at solutions)
 */
function oddParityEquation( xi: number, z0: number ): number {
  const eta = Math.sqrt( z0 * z0 - xi * xi );
  return -1 / Math.tan( xi ) - eta / xi;
}

/**
 * Find a root of the transcendental equation using bisection method.
 *
 * @param equation - Function to find root of
 * @param xiLeft - Left bound
 * @param xiRight - Right bound
 * @param tolerance - Convergence tolerance
 * @returns Root of the equation (or null if not found)
 */
function findRootBisection(
  equation: ( xi: number ) => number,
  xiLeft: number,
  xiRight: number,
  tolerance = 1e-10
): number | null {
  let left = xiLeft;
  let right = xiRight;
  let fLeft = equation( left );
  let fRight = equation( right );

  // Check if there's a sign change
  if ( fLeft * fRight > 0 ) {
    return null;
  }

  // Bisection iteration
  while ( right - left > tolerance ) {
    const mid = ( left + right ) / 2;
    const fMid = equation( mid );

    if ( Math.abs( fMid ) < tolerance ) {
      return mid;
    }

    if ( fLeft * fMid < 0 ) {
      right = mid;
      fRight = fMid;
    }
    else {
      left = mid;
      fLeft = fMid;
    }
  }

  return ( left + right ) / 2;
}

/**
 * Find all bound state energies for a finite square well.
 *
 * @param wellWidth - Width of the well L in meters
 * @param wellDepth - Depth of the well V₀ in Joules (positive value)
 * @param mass - Particle mass in kg
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Arrays of energies and parities
 */
function findBoundStateEnergies(
  wellWidth: number,
  wellDepth: number,
  mass: number,
  energyMin: number,
  energyMax: number
): { energies: number[]; parities: Parity[] } {
  const { HBAR } = FundamentalConstants;

  // All bound states have energies between -V₀ and 0
  const actualEnergyMin = Math.max( energyMin, -wellDepth );
  const actualEnergyMax = Math.min( energyMax, 0 );

  if ( actualEnergyMin >= actualEnergyMax ) {
    return { energies: [], parities: [] };
  }

  // Calculate z0 = (L/2)√(2mV₀/ℏ²)
  const z0 = ( wellWidth / 2 ) * Math.sqrt( 2 * mass * wellDepth / ( HBAR * HBAR ) );

  const energies: number[] = [];
  const parities: Parity[] = [];

  // Maximum number of bound states (approximate)
  const maxStates = Math.floor( z0 / ( Math.PI / 2 ) ) + 1;

  // Search for states systematically, alternating even/odd by state index
  let evenCount = 0;
  let oddCount = 0;

  for ( let stateIndex = 0; stateIndex < maxStates; stateIndex++ ) {
    let xi: number | null = null;
    let parity: Parity;

    // Alternate between even (stateIndex=0,2,4,...) and odd (stateIndex=1,3,5,...)
    if ( stateIndex % 2 === 0 ) {
      // Even parity state: search in interval [evenCount*π, (evenCount+1/2)*π]
      const xiMin = evenCount * Math.PI + 0.001;
      const xiMax = Math.min( evenCount * Math.PI + Math.PI / 2 - 0.001, z0 - 0.001 );

      if ( xiMin < xiMax && xiMin < z0 ) {
        const equation = ( xiVal: number ) => evenParityEquation( xiVal, z0 );
        xi = findRootBisection( equation, xiMin, xiMax, 1e-10 );

        // Validate the root (allow slightly larger tolerance for validation)
        if ( xi !== null && Math.abs( equation( xi ) ) > 1e-6 ) {
          xi = null;
        }
      }

      parity = 'even';
      evenCount++;
    }
    else {
      // Odd parity state: search in interval [(oddCount+1/2)*π, (oddCount+1)*π]
      const xiMin = oddCount * Math.PI + Math.PI / 2 + 0.001;
      const xiMax = Math.min( ( oddCount + 1 ) * Math.PI - 0.001, z0 - 0.001 );

      if ( xiMin < xiMax && xiMin < z0 ) {
        const equation = ( xiVal: number ) => oddParityEquation( xiVal, z0 );
        xi = findRootBisection( equation, xiMin, xiMax, 1e-10 );

        // Validate the root (allow slightly larger tolerance for validation)
        if ( xi !== null && Math.abs( equation( xi ) ) > 1e-6 ) {
          xi = null;
        }
      }

      parity = 'odd';
      oddCount++;
    }

    // Skip if state could not be found
    if ( xi === null ) {
      continue;
    }

    // Convert ξ back to energy: ξ = (L/2)√(2m(E+V₀)/ℏ²)
    // E = ξ²ℏ²/(2m(L/2)²) - V₀
    const energy = ( xi * xi * HBAR * HBAR ) / ( 2 * mass * ( wellWidth / 2 ) * ( wellWidth / 2 ) ) - wellDepth;

    // Check if energy is within requested bounds
    if ( energy >= actualEnergyMin && energy <= actualEnergyMax ) {
      energies.push( energy );
      parities.push( parity );
    }
  }

  return { energies: energies, parities: parities };
}

/**
 * Calculate normalized wavefunction for a finite square well state.
 *
 * @param energy - Energy of the state in Joules
 * @param parity - Parity of the state (even or odd)
 * @param wellWidth - Width of the well L in meters
 * @param wellDepth - Depth of the well V₀ in Joules (positive value)
 * @param mass - Particle mass in kg
 * @param xGridArray - Array of x positions in meters
 * @returns Normalized wavefunction array
 */
function calculateWavefunction(
  energy: number,
  parity: Parity,
  wellWidth: number,
  wellDepth: number,
  mass: number,
  xGridArray: number[]
): number[] {
  const { HBAR } = FundamentalConstants;

  // Calculate wave numbers
  const k = Math.sqrt( 2 * mass * ( energy + wellDepth ) / ( HBAR * HBAR ) );
  const kappa = Math.sqrt( -2 * mass * energy / ( HBAR * HBAR ) );

  const wavefunction: number[] = [];

  // Calculate wavefunction at each grid point
  for ( const x of xGridArray ) {
    let value: number;

    if ( Math.abs( x ) < wellWidth / 2 ) {
      // Inside the well
      if ( parity === 'even' ) {
        value = Math.cos( k * x );
      }
      else {
        value = Math.sin( k * x );
      }
    }
    else {
      // Outside the well - exponentially decaying
      if ( parity === 'even' ) {
        // Even: symmetric exponential decay
        const xEdge = wellWidth / 2;
        const amplitude = Math.cos( k * xEdge );
        value = amplitude * Math.exp( -kappa * ( Math.abs( x ) - xEdge ) );
      }
      else {
        // Odd: antisymmetric exponential decay
        const xEdge = wellWidth / 2;
        const amplitude = Math.sin( k * xEdge );
        const sign = x > 0 ? 1 : -1;
        value = sign * amplitude * Math.exp( -kappa * ( Math.abs( x ) - xEdge ) );
      }
    }

    wavefunction.push( value );
  }

  // Normalize the wavefunction
  const dx = xGridArray.length > 1 ? xGridArray[ 1 ] - xGridArray[ 0 ] : 0;
  let integral = 0;
  for ( let i = 0; i < wavefunction.length - 1; i++ ) {
    integral += ( wavefunction[ i ] * wavefunction[ i ] + wavefunction[ i + 1 ] * wavefunction[ i + 1 ] ) * dx / 2;
  }

  const normalization = 1 / Math.sqrt( integral );
  return wavefunction.map( psi => psi * normalization );
}

/**
 * Analytical solution for the finite square well.
 *
 * This function returns a BoundStateResult compatible with NumerovSolver output.
 * The API matches NumerovSolver.solve() by taking energy bounds.
 *
 * @param wellWidth - Width of the well L in meters
 * @param wellDepth - Depth of the well V₀ in Joules (positive value)
 * @param mass - Particle mass in kg
 * @param gridConfig - Grid configuration for wavefunction evaluation
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Bound state results with energies and wavefunctions
 *
 * @example
 * // Solve for states within energy range
 * const L = 2e-9; // 2 nm well
 * const V0 = 10 * FundamentalConstants.EV_TO_JOULES; // 10 eV deep
 * const mass = FundamentalConstants.ELECTRON_MASS;
 *
 * const result = solveFiniteSquareWell(
 *   L,
 *   V0,
 *   mass,
 *   { xMin: -3e-9, xMax: 3e-9, numPoints: 1001 },
 *   -V0,
 *   0
 * );
 *
 * console.log( 'Number of bound states:', result.energies.length );
 */
export function solveFiniteSquareWell(
  wellWidth: number,
  wellDepth: number,
  mass: number,
  gridConfig: GridConfig,
  energyMin: number,
  energyMax: number
): BoundStateResult {
  // Find all bound state energies
  const { energies, parities } = findBoundStateEnergies(
    wellWidth,
    wellDepth,
    mass,
    energyMin,
    energyMax
  );

  // Generate grid
  const numPoints = gridConfig.numPoints;
  const xGridArray: number[] = [];
  const dx = ( gridConfig.xMax - gridConfig.xMin ) / ( numPoints - 1 );
  for ( let i = 0; i < numPoints; i++ ) {
    xGridArray.push( gridConfig.xMin + i * dx );
  }

  // Calculate wavefunctions for each state
  const wavefunctions: number[][] = [];
  for ( let i = 0; i < energies.length; i++ ) {
    const wavefunction = calculateWavefunction(
      energies[ i ],
      parities[ i ],
      wellWidth,
      wellDepth,
      mass,
      xGridArray
    );
    wavefunctions.push( wavefunction );
  }

  return {
    energies: energies,
    wavefunctions: wavefunctions,
    xGridArray: xGridArray,
    method: 'analytical'
  };
}

quantumBoundStates.register( 'FiniteSquareWellSolution', {
  solveFiniteSquareWell: solveFiniteSquareWell,
  createFiniteSquareWellPotential: createFiniteSquareWellPotential
} );
