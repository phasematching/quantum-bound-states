// Copyright 2025, University of Colorado Boulder

/**
 * Types and interfaces for potential functions and bound state results.
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';

/**
 * Potential energy function V(x) that returns energy in eV, where x is in nm.
 *
 * The potential function defines the quantum system and determines
 * the allowed energy levels and wavefunctions. Common examples include:
 *
 * @example
 * // Harmonic oscillator: V(x) = (1/2)kx²
 * const harmonicOscillator = ( x: number ) => {
 *   const k = 1e3;  // Spring constant in eV/nm²
 *   return 0.5 * k * x * x;
 * };
 *
 * @example
 * // Infinite square well: V(x) = 0 for |x| < L/2, V₀ otherwise
 * const infiniteWell = ( x: number ) => {
 *   const L = 1;  // 1 nm well width
 *   const V0 = 500;  // 500 eV barrier
 *   return Math.abs( x ) < L / 2 ? 0 : V0;
 * };
 *
 * @example
 * // Finite square well: V(x) = -V₀ for |x| < L/2, 0 otherwise
 * const finiteWell = ( x: number ) => {
 *   const L = 1;  // 1 nm well width
 *   const V0 = 10;  // 10 eV well depth
 *   return Math.abs( x ) < L / 2 ? -V0 : 0;
 * };
 */
export type PotentialFunction = ( x: number ) => number;

/**
 * Grid configuration for numerical integration.
 *
 * Defines the spatial domain and resolution for solving the Schrödinger equation.
 * The grid should:
 * - Extend to regions where ψ ≈ 0 (typically 3-5 classical turning points)
 * - Have sufficient resolution (10-20 points per wavelength)
 * - Be symmetric around x=0 for symmetric potentials
 *
 * @example
 * // Grid for harmonic oscillator (±6 nm)
 * const gridConfig: GridConfig = {
 *   xMin: -6,        // -6 nm
 *   xMax: 6,         // +6 nm
 *   numPoints: 1001  // ~0.012 nm spacing
 * };
 *
 * @example
 * // High-resolution grid for sharp features
 * const fineGrid: GridConfig = {
 *   xMin: -1,       // -1 nm
 *   xMax: 1,        // +1 nm
 *   numPoints: 2401  // ~0.0008 nm spacing
 * };
 */
export type GridConfig = {
  xMin: number;      // Minimum x value in nm
  xMax: number;      // Maximum x value in nm
  numPoints: number; // Number of grid points (odd recommended for symmetric potentials)
};

/**
 * Result from a bound state calculation.
 *
 * Contains all information about the computed quantum states including
 * energy eigenvalues, normalized wavefunctions, and the spatial grid.
 *
 * @example
 * // Access computed results
 * const result: BoundStateResult = solver.solve( ... );
 *
 * // Get ground state energy
 * const E0 = result.energies[ 0 ];
 *
 * // Get ground state wavefunction
 * const psi0 = result.wavefunctions[ 0 ];
 *
 * // Plot wavefunction
 * for ( let i = 0; i < result.xGrid.length; i++ ) {
 *   plot( result.xGrid[ i ], psi0[ i ] );
 * }
 *
 * // Calculate probability density
 * const probability = psi0.map( psi => psi * psi );
 */
export type BoundStateResult = {
  energies: number[];       // Energy eigenvalues in eV (sorted from lowest to highest)
  wavefunctions: number[][]; // Normalized wavefunctions (each row is one state)
  xGridArray: number[];          // Spatial grid points in nm
  method: string;           // Name of the numerical method used ('numerov' or 'numerov-symmetric')
};

quantumBoundStates.register( 'PotentialFunction', {} );
