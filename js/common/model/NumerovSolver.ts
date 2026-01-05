// Copyright 2026, University of Colorado Boulder

/**
 * Main entry point for Numerov solver functionality.
 *
 * This file provides both functional and object-oriented APIs for solving the
 * 1D time-independent Schrödinger equation using the Numerov method.
 *
 * Architecture:
 * This file delegates to specialized classes:
 * - NumerovIntegrator: Handles integration of Schrödinger equation
 * - SymmetricNumerovIntegrator: Handles symmetric potentials with parity
 * - EnergyRefiner: Refines energy eigenvalues using bisection
 * - WavefunctionNormalizer: Normalizes wavefunctions
 * - NumerovSolverClass: Orchestrates all components
 *
 * See README.md for detailed usage examples and API documentation.
 * See NUMEROV_ARCHITECTURE.md for architecture details.
 *
 * @example
 * // Functional API (quick and simple)
 * import { solveNumerov } from './NumerovSolver.js';
 * const result = solveNumerov( potential, mass, 3, gridConfig, eMin, eMax );
 *
 * @example
 * // Object-oriented API (more control)
 * import { NumerovSolverClass } from './NumerovSolver.js';
 * const solver = new NumerovSolverClass( mass, { energyTolerance: 1e-20 } );
 * const result = solver.solve( potential, 3, gridConfig, eMin, eMax );
 *
 * @example
 * // Access individual components
 * import { NumerovIntegrator, WavefunctionNormalizer } from './NumerovSolver.js';
 * const integrator = new NumerovIntegrator( mass );
 * const normalizer = new WavefunctionNormalizer( 'simpson' );
 *
 * @author Martin Veillette
 */

import NumerovSolverClass from './NumerovSolverClass.js';
import { BoundStateResult, GridConfig, PotentialFunction } from './PotentialFunction.js';
import NumerovIntegrator from './NumerovIntegrator.js';
import SymmetricNumerovIntegrator from './SymmetricNumerovIntegrator.js';
import EnergyRefiner from './EnergyRefiner.js';
import WavefunctionNormalizer from './WavefunctionNormalizer.js';

// Export classes (OO API and components)
export { NumerovSolverClass, NumerovIntegrator, SymmetricNumerovIntegrator, EnergyRefiner, WavefunctionNormalizer };

// Export types
export type { Parity } from './SymmetricNumerovIntegrator.js';
export type { NormalizationMethod } from './WavefunctionNormalizer.js';

/**
 * Functional API: Solve the 1D Schrödinger equation using the Numerov method.
 * This is a convenience function that creates a solver and returns the results.
 *
 * @param potential - Function V(x) that returns potential energy in Joules
 * @param mass - Particle mass in kg
 * @param numStates - Number of bound states to find
 * @param gridConfig - Grid configuration
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Bound state results
 */
export function solveNumerov(
  potential: PotentialFunction,
  mass: number,
  numStates: number,
  gridConfig: GridConfig,
  energyMin: number,
  energyMax: number
): BoundStateResult {
  const solver = new NumerovSolverClass( mass );
  return solver.solve( potential, numStates, gridConfig, energyMin, energyMax );
}
