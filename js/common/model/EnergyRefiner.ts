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
  private readonly toleranceOverride?: number; // Optional user-specified tolerance

  /**
   * @param integrator - The Numerov integrator to use
   * @param tolerance - Optional energy tolerance in Joules. If not provided, tolerance is
   *                    calculated adaptively based on the energy bracket width.
   */
  public constructor( integrator: NumerovIntegrator, tolerance?: number ) {
    this.integrator = integrator;
    this.toleranceOverride = tolerance;
  }

  /**
   * Refine energy eigenvalue using bisection method.
   * Searches for the energy where ψ(x_max) = 0 within the given bounds.
   *
   * Physical motivation for tolerance:
   * The eigenvalue should be resolved to much better precision than the level spacing.
   * Typical quantum systems have level spacing ΔE, and we want tolerance << ΔE.
   *
   * The initial bracket width (E2 - E1) is typically a fraction of the level spacing
   * (from the energy scan that detected the sign change). A relative precision of
   * 10^-8 ensures the eigenvalue is accurate to ~10 significant figures relative to
   * the bracket width, which translates to ~10^-6 of the level spacing.
   *
   * For example:
   * - Harmonic oscillator (ΔE ≈ 0.66 eV): tolerance ≈ 10^-6 eV
   * - Infinite well (ΔE ≈ 0.07 eV): tolerance ≈ 10^-7 eV
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

    // Calculate adaptive tolerance based on energy scale of the bracket
    // Relative precision of 10^-8 gives absolute tolerance = 10^-8 × (bracket width)
    // This ensures eigenvalue accuracy of ~10 significant figures
    const relativePrecision = 1e-8;
    const tolerance = this.toleranceOverride ?? relativePrecision * Math.abs( E2 - E1 );

    // Bisection loop
    while ( Ehigh - Elow > tolerance ) {
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
