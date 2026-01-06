// Copyright 2026, University of Colorado Boulder

/**
 * EnergyRefiner refines energy eigenvalues using the bisection method.
 * Used to find the precise energy where the wavefunction satisfies boundary conditions.
 *
 * The shooting method looks for energies where ψ(x_max) = 0. We search for sign changes
 * in the end value of the wavefunction, then refine using bisection to achieve the desired tolerance.
 *
 * This is a very robust method in root finding, but it generates a lot of iterations, so it is not the most efficient.
 * This approach could be refined if performance is needed.
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import NumerovIntegrator from './NumerovIntegrator.js';
import XGrid from './XGrid.js';

// Default relative precision of 10^-4 gives absolute tolerance = 10^-4 × (bracket width)
const DEFAULT_RELATIVE_TOLERANCE = 1e-4;

/**
 * Configuration options for EnergyRefiner.
 */
export type EnergyRefinerOptions = {
  tolerance?: number;   // Tolerance value (default: 1e-4)
  isRelative?: boolean; // If true, tolerance is relative to bracket width; if false, absolute in Joules (default: true)
};

export default class EnergyRefiner {

  private readonly integrator: NumerovIntegrator;
  private readonly tolerance: number;
  private readonly isRelative: boolean;

  /**
   * Physical motivation for tolerance:
   * The eigenvalue should be resolved to much better precision than the level spacing.
   * Typical quantum systems have level spacing ΔE, and we want tolerance << ΔE.
   *
   * The initial bracket width (E2 - E1) is typically a fraction of the level spacing
   * (from the energy scan that detected the sign change). A relative precision of
   * 10^-4 ensures the eigenvalue is accurate to ~4 significant figures relative to
   * the bracket width.
   *
   * @param integrator - The Numerov integrator to use
   * @param options - Configuration options
   *   - tolerance: Energy tolerance value. If isRelative is true, this is a dimensionless
   *                relative tolerance. If isRelative is false, this is an absolute tolerance in Joules.
   *                Default: 1e-4
   *   - isRelative: If true, tolerance is relative to the energy bracket width.
   *                 If false, tolerance is an absolute value in Joules. Default: true
   */
  public constructor( integrator: NumerovIntegrator, options?: EnergyRefinerOptions ) {
    this.integrator = integrator;
    this.tolerance = options?.tolerance ?? DEFAULT_RELATIVE_TOLERANCE;
    this.isRelative = options?.isRelative ?? true;
  }

  /**
   * Refine energy eigenvalue using bisection method.
   * Searches for the energy where ψ(x_max) = 0 within the given bounds.
   *
   * @param E1 - Lower energy bound (Joules)
   * @param E2 - Upper energy bound (Joules)
   * @param V - Potential energy array (Joules)
   * @param grid - Spatial grid configuration
   * @returns Refined energy eigenvalue (Joules)
   */
  public refine(
    E1: number,
    E2: number,
    V: number[],
    grid: XGrid
  ): number {
    const N = grid.getNumberOfPoints();
    let energyLow = E1;
    let energyHigh = E2;

    // Convert tolerance to absolute value if it's relative
    const absoluteTolerance = this.isRelative ?
      this.tolerance * Math.abs( E2 - E1 ) :
      this.tolerance;

    // Bisection loop
    while ( energyHigh - energyLow > absoluteTolerance ) {
      const energyMid = this.calculateMidpoint( energyLow, energyHigh );

      // Integrate at midpoint and boundary energies
      const psiMid = this.integrator.integrate( energyMid, V, grid );
      const psiLow = this.integrator.integrate( energyLow, V, grid );

      const endValueMid = this.getEndValue( psiMid, N );
      const endValueLow = this.getEndValue( psiLow, N );

      // Update bounds based on sign change
      if ( this.haveSameSign( endValueMid, endValueLow ) ) {
        energyLow = energyMid;
      }
      else {
        energyHigh = energyMid;
      }
    }

    return this.calculateMidpoint( energyLow, energyHigh );
  }

  /**
   * Calculate the midpoint between two energies.
   */
  private calculateMidpoint( E1: number, E2: number ): number {
    return ( E1 + E2 ) / 2;
  }

  /**
   * Get the wavefunction value at the end of the grid.
   */
  private getEndValue( psi: number[], N: number ): number {
    return psi[ N - 1 ];
  }

  /**
   * Check if two values have the same sign.
   */
  private haveSameSign( value1: number, value2: number ): boolean {
    return Math.sign( value1 ) === Math.sign( value2 );
  }
}

quantumBoundStates.register( 'EnergyRefiner', EnergyRefiner );
