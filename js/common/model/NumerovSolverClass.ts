// Copyright 2026, University of Colorado Boulder

/**
 * NumerovSolver orchestrates the solution of the 1D time-independent Schrödinger equation
 * using the Numerov method. This is the main solver class that coordinates the integration,
 * energy refinement, and normalization components.
 *
 * Architecture:
 * - NumerovIntegrator: Handles forward integration
 * - SymmetricNumerovIntegrator: Handles symmetric potentials with parity
 * - EnergyRefiner: Refines energy eigenvalues using bisection
 * - WavefunctionNormalizer: Normalizes wavefunctions
 *
 * The TISE is: -ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ
 *
 * @example
 * // Basic usage with default configuration
 * const solver = new NumerovSolverClass( FundamentalConstants.ELECTRON_MASS );
 * const result = solver.solve(
 *   potential,
 *   3,  // Find first 3 states
 *   { xMin: -5e-9, xMax: 5e-9, numPoints: 501 },
 *   0,
 *   10 * FundamentalConstants.EV_TO_JOULES
 * );
 *
 * @example
 * // Advanced usage with custom configuration
 * const solver = new NumerovSolverClass(
 *   FundamentalConstants.ELECTRON_MASS,
 *   {
 *     energyTolerance: 1e-12,
 *     normalizationMethod: 'simpson'
 *   }
 * );
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import { BoundStateResult, GridConfig, PotentialFunction } from './PotentialFunction.js';
import NumerovIntegrator from './NumerovIntegrator.js';
import SymmetricNumerovIntegrator, { Parity } from './SymmetricNumerovIntegrator.js';
import EnergyRefiner from './EnergyRefiner.js';
import WavefunctionNormalizer, { NormalizationMethod } from './WavefunctionNormalizer.js';

/**
 * Configuration options for the solver.
 */
export type NumerovSolverConfig = {
  energyTolerance?: number;  // Tolerance for energy refinement (default: 1e-20 J)
  normalizationMethod?: NormalizationMethod;  // Method for normalization (default: 'trapezoidal')
  useSymmetry?: boolean;  // Whether to use symmetric integration for symmetric potentials (default: false)
};

export default class NumerovSolverClass {

  private readonly integrator: NumerovIntegrator;
  private readonly symmetricIntegrator: SymmetricNumerovIntegrator;
  private readonly energyRefiner: EnergyRefiner;
  private readonly normalizer: WavefunctionNormalizer;
  private readonly useSymmetry: boolean;

  /**
   * @param mass - Particle mass in kg
   * @param config - Optional solver configuration
   */
  public constructor( mass: number, config?: NumerovSolverConfig ) {
    // Create component instances
    this.integrator = new NumerovIntegrator( mass );
    this.symmetricIntegrator = new SymmetricNumerovIntegrator( mass );
    this.energyRefiner = new EnergyRefiner(
      this.integrator,
      config?.energyTolerance ?? 1e-20
    );
    this.normalizer = new WavefunctionNormalizer(
      config?.normalizationMethod ?? 'trapezoidal'
    );
    this.useSymmetry = config?.useSymmetry ?? false;
  }

  /**
   * Solve the 1D Schrödinger equation using the Numerov method.
   * Main public API that finds multiple bound states.
   *
   * Uses the shooting method: scans energy range looking for energies where
   * the wavefunction satisfies boundary conditions (ψ → 0 at boundaries).
   * Detects eigenvalues by finding sign changes in ψ(x_max).
   *
   * @param potential - Function V(x) that returns potential energy in Joules
   * @param numStates - Number of bound states to find
   * @param gridConfig - Grid configuration {xMin, xMax, numPoints}
   * @param energyMin - Minimum energy to search (Joules)
   * @param energyMax - Maximum energy to search (Joules)
   * @returns Bound state results containing energies, wavefunctions, and grid
   *
   * @example
   * // Solve harmonic oscillator
   * const omega = 1e15;  // rad/s
   * const mass = FundamentalConstants.ELECTRON_MASS;
   * const potential = ( x: number ) => 0.5 * mass * omega * omega * x * x;
   *
   * const solver = new NumerovSolverClass( mass );
   * const result = solver.solve(
   *   potential,
   *   5,  // Find first 5 states
   *   { xMin: -6e-9, xMax: 6e-9, numPoints: 1001 },
   *   0,  // Ground state is above 0
   *   20 * FundamentalConstants.EV_TO_JOULES
   * );
   *
   * // Access results
   * console.log( 'Ground state energy:', result.energies[ 0 ] );
   * console.log( 'First excited energy:', result.energies[ 1 ] );
   */
  public solve(
    potential: PotentialFunction,
    numStates: number,
    gridConfig: GridConfig,
    energyMin: number,
    energyMax: number
  ): BoundStateResult {
    const { xMin, xMax, numPoints } = gridConfig;
    const dx = ( xMax - xMin ) / ( numPoints - 1 );

    // Generate grid
    const xGrid = this.generateGrid( xMin, xMax, numPoints );

    // Evaluate potential on grid
    const V = this.evaluatePotential( potential, xGrid );

    // Find bound states
    const { energies, wavefunctions } = this.findBoundStates(
      potential,
      V,
      xGrid,
      dx,
      numStates,
      energyMin,
      energyMax
    );

    return {
      energies: energies,
      wavefunctions: wavefunctions,
      xGrid: xGrid,
      method: 'numerov'
    };
  }

  /**
   * Solve using symmetric integration for a symmetric potential.
   * Uses parity to integrate only half the domain, improving both efficiency and accuracy.
   *
   * For symmetric potentials V(-x) = V(x), all eigenstates have definite parity:
   * - Symmetric (even): ψ(-x) = ψ(x), so ψ'(0) = 0
   * - Antisymmetric (odd): ψ(-x) = -ψ(x), so ψ(0) = 0
   *
   * Ground state is always symmetric, first excited is antisymmetric, etc.
   *
   * @param potential - Symmetric potential function V(x) where V(-x) = V(x)
   * @param numStates - Number of bound states to find
   * @param gridConfig - Grid configuration (should be symmetric around x=0)
   * @param energyMin - Minimum energy to search
   * @param energyMax - Maximum energy to search
   * @param parity - Symmetry type ('symmetric' for even, 'antisymmetric' for odd)
   * @returns Bound state results
   *
   * @example
   * // Find even states of harmonic oscillator (n=0,2,4,...)
   * const evenStates = solver.solveSymmetric(
   *   harmonicPotential,
   *   3,  // Find 3 even states
   *   { xMin: -6e-9, xMax: 6e-9, numPoints: 1001 },
   *   0,
   *   20 * FundamentalConstants.EV_TO_JOULES,
   *   'symmetric'
   * );
   *
   * // Find odd states (n=1,3,5,...)
   * const oddStates = solver.solveSymmetric(
   *   harmonicPotential,
   *   3,
   *   { xMin: -6e-9, xMax: 6e-9, numPoints: 1001 },
   *   0,
   *   20 * FundamentalConstants.EV_TO_JOULES,
   *   'antisymmetric'
   * );
   */
  public solveSymmetric(
    potential: PotentialFunction,
    numStates: number,
    gridConfig: GridConfig,
    energyMin: number,
    energyMax: number,
    parity: Parity
  ): BoundStateResult {
    const { xMin, xMax, numPoints } = gridConfig;
    const dx = ( xMax - xMin ) / ( numPoints - 1 );

    const xGrid = this.generateGrid( xMin, xMax, numPoints );
    const V = this.evaluatePotential( potential, xGrid );

    const { energies, wavefunctions } = this.findBoundStatesSymmetric(
      V,
      xGrid,
      dx,
      numStates,
      energyMin,
      energyMax,
      parity
    );

    return {
      energies: energies,
      wavefunctions: wavefunctions,
      xGrid: xGrid,
      method: 'numerov-symmetric'
    };
  }

  /**
   * Find bound states using standard shooting method.
   */
  private findBoundStates(
    potential: PotentialFunction,
    V: number[],
    xGrid: number[],
    dx: number,
    numStates: number,
    energyMin: number,
    energyMax: number
  ): { energies: number[]; wavefunctions: number[][] } {
    const energies: number[] = [];
    const wavefunctions: number[][] = [];

    // Scan energy range looking for sign changes
    const energyStep = ( energyMax - energyMin ) / 1000;
    let prevSign = 0;

    for (
      let E = energyMin;
      E <= energyMax && energies.length < numStates;
      E += energyStep
    ) {
      const psi = this.integrator.integrate( E, V, xGrid, dx );
      const endValue = this.getEndValue( psi );

      // Check for sign change (indicates bound state)
      const currentSign = Math.sign( endValue );
      if ( prevSign !== 0 && currentSign !== prevSign ) {
        // Refine energy
        const refinedEnergy = this.energyRefiner.refine(
          E - energyStep,
          E,
          V,
          xGrid,
          dx
        );
        energies.push( refinedEnergy );

        // Calculate and normalize wavefunction
        const refinedPsi = this.integrator.integrate( refinedEnergy, V, xGrid, dx );
        const normalizedPsi = this.normalizer.normalize( refinedPsi, dx );
        wavefunctions.push( normalizedPsi );
      }
      prevSign = currentSign;
    }

    return { energies: energies, wavefunctions: wavefunctions };
  }

  /**
   * Find bound states for symmetric potentials using parity.
   */
  private findBoundStatesSymmetric(
    V: number[],
    xGrid: number[],
    dx: number,
    numStates: number,
    energyMin: number,
    energyMax: number,
    parity: Parity
  ): { energies: number[]; wavefunctions: number[][] } {
    const energies: number[] = [];
    const wavefunctions: number[][] = [];

    const energyStep = ( energyMax - energyMin ) / 1000;
    let prevSign = 0;

    for (
      let E = energyMin;
      E <= energyMax && energies.length < numStates;
      E += energyStep
    ) {
      const psi = this.symmetricIntegrator.integrateFromCenter( E, V, xGrid, dx, parity );
      const endValue = this.getEndValue( psi );

      const currentSign = Math.sign( endValue );
      if ( prevSign !== 0 && currentSign !== prevSign ) {
        // For symmetric case, we need a custom refiner that uses symmetric integration
        const refinedEnergy = this.refineEnergySymmetric(
          E - energyStep,
          E,
          V,
          xGrid,
          dx,
          parity
        );
        energies.push( refinedEnergy );

        const refinedPsi = this.symmetricIntegrator.integrateFromCenter(
          refinedEnergy,
          V,
          xGrid,
          dx,
          parity
        );
        const normalizedPsi = this.normalizer.normalize( refinedPsi, dx );
        wavefunctions.push( normalizedPsi );
      }
      prevSign = currentSign;
    }

    return { energies: energies, wavefunctions: wavefunctions };
  }

  /**
   * Refine energy for symmetric potentials.
   * Uses symmetric integration during bisection.
   */
  private refineEnergySymmetric(
    E1: number,
    E2: number,
    V: number[],
    xGrid: number[],
    dx: number,
    parity: Parity
  ): number {
    const N = xGrid.length;
    const tolerance = 1e-10;
    let Elow = E1;
    let Ehigh = E2;

    while ( Ehigh - Elow > tolerance ) {
      const Emid = ( Elow + Ehigh ) / 2;

      const psiMid = this.symmetricIntegrator.integrateFromCenter( Emid, V, xGrid, dx, parity );
      const psiLow = this.symmetricIntegrator.integrateFromCenter( Elow, V, xGrid, dx, parity );

      const endValueMid = psiMid[ N - 1 ];
      const endValueLow = psiLow[ N - 1 ];

      if ( Math.sign( endValueMid ) === Math.sign( endValueLow ) ) {
        Elow = Emid;
      }
      else {
        Ehigh = Emid;
      }
    }

    return ( Elow + Ehigh ) / 2;
  }

  /**
   * Generate spatial grid points.
   */
  private generateGrid( xMin: number, xMax: number, numPoints: number ): number[] {
    const xGrid: number[] = [];
    const dx = ( xMax - xMin ) / ( numPoints - 1 );

    for ( let i = 0; i < numPoints; i++ ) {
      xGrid.push( xMin + i * dx );
    }

    return xGrid;
  }

  /**
   * Evaluate potential on grid.
   */
  private evaluatePotential( potential: PotentialFunction, xGrid: number[] ): number[] {
    return xGrid.map( potential );
  }

  /**
   * Get the wavefunction value at the end of the grid.
   */
  private getEndValue( psi: number[] ): number {
    return psi[ psi.length - 1 ];
  }

  /**
   * Get the integrator instance (for testing or advanced use).
   */
  public getIntegrator(): NumerovIntegrator {
    return this.integrator;
  }

  /**
   * Get the energy refiner instance (for testing or advanced use).
   */
  public getEnergyRefiner(): EnergyRefiner {
    return this.energyRefiner;
  }

  /**
   * Get the normalizer instance (for testing or advanced use).
   */
  public getNormalizer(): WavefunctionNormalizer {
    return this.normalizer;
  }
}

/**
 * Convenience function for solving with default settings.
 * Matches the original functional API.
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

quantumBoundStates.register( 'NumerovSolver', { NumerovSolver: NumerovSolverClass, solveNumerov: solveNumerov } );
