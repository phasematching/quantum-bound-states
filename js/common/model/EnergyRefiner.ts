// Copyright 2026, University of Colorado Boulder

/**
 * EnergyRefiner refines energy eigenvalues using the bisection method.
 * Used to find the precise energy where the wavefunction satisfies boundary conditions.
 *
 * The shooting method looks for energies where ψ(x_max) = 0. We search for sign changes
 * in the end value, then refine using bisection to achieve the desired tolerance.
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import NumerovIntegrator from './NumerovIntegrator.js';
import XGrid from './XGrid.js';

export default class EnergyRefiner {

  private readonly integrator: NumerovIntegrator;
  private readonly tolerance: number;

  /**
   * @param integrator - The Numerov integrator to use
   * @param tolerance - Energy tolerance in Joules (default: 1e-21)
   */
  public constructor( integrator: NumerovIntegrator, tolerance = 1e-21 ) {
    this.integrator = integrator;
    this.tolerance = tolerance;
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
    const N = grid.getLength();
    let Elow = E1;
    let Ehigh = E2;

    // Bisection loop
    while ( Ehigh - Elow > this.tolerance ) {
      const Emid = this.calculateMidpoint( Elow, Ehigh );

      // Integrate at midpoint and boundary energies
      const psiMid = this.integrator.integrate( Emid, V, grid );
      const psiLow = this.integrator.integrate( Elow, V, grid );

      const endValueMid = this.getEndValue( psiMid, N );
      const endValueLow = this.getEndValue( psiLow, N );

      // Update bounds based on sign change
      if ( this.haveSameSign( endValueMid, endValueLow ) ) {
        Elow = Emid;
      }
      else {
        Ehigh = Emid;
      }
    }

    return this.calculateMidpoint( Elow, Ehigh );
  }

  /**
   * Refine energy eigenvalue with a custom tolerance.
   * Useful for when different precision is needed for specific cases.
   *
   * @param E1 - Lower energy bound (Joules)
   * @param E2 - Upper energy bound (Joules)
   * @param V - Potential energy array (Joules)
   * @param grid - Spatial grid configuration
   * @param customTolerance - Custom energy tolerance (Joules)
   * @returns Refined energy eigenvalue (Joules)
   */
  public refineWithTolerance(
    E1: number,
    E2: number,
    V: number[],
    grid: XGrid,
    customTolerance: number
  ): number {
    const tempRefiner = new EnergyRefiner( this.integrator, customTolerance );
    return tempRefiner.refine( E1, E2, V, grid );
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

  /**
   * Get the current tolerance.
   */
  public getTolerance(): number {
    return this.tolerance;
  }

  /**
   * Estimate the number of iterations needed for given bounds.
   * Useful for progress tracking or performance estimation.
   *
   * @param E1 - Lower energy bound
   * @param E2 - Upper energy bound
   * @returns Estimated number of bisection iterations
   */
  public estimateIterations( E1: number, E2: number ): number {
    const range = Math.abs( E2 - E1 );
    if ( range <= this.tolerance ) {
      return 0;
    }
    // Bisection halves the range each iteration
    return Math.ceil( Math.log2( range / this.tolerance ) );
  }

  /**
   * Check if the given energy bounds are valid for refinement.
   *
   * @param E1 - Lower bound
   * @param E2 - Upper bound
   * @returns True if bounds are valid
   */
  public areValidBounds( E1: number, E2: number ): boolean {
    return E1 < E2 && isFinite( E1 ) && isFinite( E2 );
  }
}

quantumBoundStates.register( 'EnergyRefiner', EnergyRefiner );
