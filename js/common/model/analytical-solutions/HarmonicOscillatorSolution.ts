// Copyright 2026, University of Colorado Boulder

/**
 * Analytical solution for a quantum harmonic oscillator.
 * V(x) = (1/2) * k * x^2 = (1/2) * m * ω^2 * x^2
 *
 * ENERGY EIGENVALUES:
 *   E_n = ℏω(n + 1/2),  n = 0, 1, 2, ...
 *   where ω = √(k/m)
 *
 * WAVEFUNCTIONS:
 *   ψ_n(x) = (1/√(2^n n!)) · (mω/πℏ)^(1/4) · exp(-mωx²/(2ℏ)) · H_n(√(mω/ℏ) x)
 *   where H_n are the Hermite polynomials
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../../quantumBoundStates.js';
import { BoundStateResult, GridConfig, PotentialFunction } from '../PotentialFunction.js';
import FundamentalConstants from '../FundamentalConstants.js';
import { hermitePolynomial, factorial } from './math-utilities.js';

/**
 * Create the potential function for a harmonic oscillator.
 * V(x) = (1/2) * k * x^2
 *
 * @param springConstant - Spring constant k in N/m
 * @returns Potential function V(x) in Joules
 */
export function createHarmonicOscillatorPotential(
  springConstant: number
): PotentialFunction {
  return ( x: number ) => {
    return 0.5 * springConstant * x * x;
  };
}

/**
 * Analytical solution for a quantum harmonic oscillator.
 * V(x) = (1/2) * k * x^2 = (1/2) * m * ω^2 * x^2
 *
 * This function returns a BoundStateResult compatible with NumerovSolver output,
 * allowing analytical solutions to be used interchangeably with numerical solutions.
 * The API matches NumerovSolver.solve() by taking energy bounds.
 *
 * @param springConstant - Spring constant k in N/m
 * @param mass - Particle mass in kg
 * @param gridConfig - Grid configuration for wavefunction evaluation
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Bound state results with exact energies and wavefunctions
 *
 * @example
 * // Solve for states within energy range
 * const omega = 1e15; // rad/s
 * const mass = FundamentalConstants.ELECTRON_MASS;
 * const k = mass * omega * omega;
 *
 * const result = solveHarmonicOscillator(
 *   k,
 *   mass,
 *   { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 },
 *   0,
 *   20 * FundamentalConstants.EV_TO_JOULES
 * );
 *
 * console.log( 'Ground state energy:', result.energies[ 0 ] );
 * console.log( 'Number of states found:', result.energies.length );
 */
export function solveHarmonicOscillator(
  springConstant: number,
  mass: number,
  gridConfig: GridConfig,
  energyMin: number,
  energyMax: number
): BoundStateResult {
  const { HBAR } = FundamentalConstants;
  const omega = Math.sqrt( springConstant / mass );

  // Calculate energies: E_n = ℏω(n + 1/2) for n = 0, 1, 2, ...
  // Find all n where energyMin <= E_n <= energyMax
  const energyQuantum = HBAR * omega;

  // Find the minimum n: E_n >= energyMin
  // E_n = ℏω(n + 1/2) >= energyMin
  // n >= (energyMin / ℏω) - 1/2
  const nMin = Math.max( 0, Math.ceil( ( energyMin / energyQuantum ) - 0.5 ) );

  // Find the maximum n: E_n <= energyMax
  // E_n = ℏω(n + 1/2) <= energyMax
  // n <= (energyMax / ℏω) - 1/2
  const nMax = Math.floor( ( energyMax / energyQuantum ) - 0.5 );

  // Collect all quantum numbers within the energy range
  const quantumNumbers: number[] = [];
  const energies: number[] = [];
  for ( let n = nMin; n <= nMax; n++ ) {
    const energy = energyQuantum * ( n + 0.5 );
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

  // Calculate wavefunctions using Hermite polynomials
  // ψ_n(x) = (1/√(2^n n!)) * (mω/πℏ)^(1/4) * exp(-mωx^2/(2ℏ)) * H_n(√(mω/ℏ) x)
  const wavefunctions: number[][] = [];
  const alpha = Math.sqrt( ( mass * omega ) / HBAR );

  for ( const n of quantumNumbers ) {
    const wavefunction: number[] = [];
    // Normalization: (mω/(πℏ))^(1/4) / √(2^n n!) = (α²/π)^(1/4) / √(2^n n!)
    const normalization =
      ( 1 / Math.sqrt( Math.pow( 2, n ) * factorial( n ) ) ) *
      Math.pow( ( alpha * alpha ) / Math.PI, 0.25 );

    for ( const x of xGridArray ) {
      const xi = alpha * x;
      const hermite = hermitePolynomial( n, xi );
      const value = normalization * Math.exp( ( -xi * xi ) / 2 ) * hermite;
      wavefunction.push( value );
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

quantumBoundStates.register( 'HarmonicOscillatorSolution', { solveHarmonicOscillator: solveHarmonicOscillator, createHarmonicOscillatorPotential: createHarmonicOscillatorPotential } );
