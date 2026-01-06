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
 *
 * @author Martin Veillette
 */

import NumerovSolverClass from './NumerovSolverClass.js';
import { BoundStateResult, GridConfig, PotentialFunction } from './PotentialFunction.js';
import NumerovBase from './NumerovBase.js';
import NumerovIntegrator from './NumerovIntegrator.js';
import SymmetricNumerovIntegrator from './SymmetricNumerovIntegrator.js';
import EnergyRefiner from './EnergyRefiner.js';
import WavefunctionNormalizer from './WavefunctionNormalizer.js';

// Export classes
export { NumerovSolverClass, NumerovBase, NumerovIntegrator, SymmetricNumerovIntegrator, EnergyRefiner, WavefunctionNormalizer };

// Export types
export type { Parity } from './SymmetricNumerovIntegrator.js';
export type { NormalizationMethod } from './WavefunctionNormalizer.js';
export type { EnergyRefinerOptions } from './EnergyRefiner.js';

/**
 * Solve the 1D Schrödinger equation using the Numerov method.
 * This is a convenience function that creates a solver and returns the results.
 *
 * @param potential - Function V(x) that returns potential energy in Joules
 * @param mass - Particle mass in kg
 * @param gridConfig - Grid configuration
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Bound state results
 */
export function solveNumerov(
  potential: PotentialFunction,
  mass: number,
  gridConfig: GridConfig,
  energyMin: number,
  energyMax: number
): BoundStateResult {
  const solver = new NumerovSolverClass( mass );
  return solver.solve( potential, gridConfig, energyMin, energyMax );
}
