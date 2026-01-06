// Copyright 2026, University of Colorado Boulder

/**
 * Base class for Numerov integrators containing shared functionality.
 * Provides common methods for calculating k², Numerov factors, and the Numerov step.
 * See NumerovIntegrator and SymmetricNumerovIntegrator for specific implementations.
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import FundamentalConstants from './FundamentalConstants.js';

const HBAR = FundamentalConstants.HBAR;
const VERY_LARGE_VALUE = 1e300;

export default abstract class NumerovBase {

  protected readonly mass: number;

  /**
   * @param mass - Particle mass in kg
   */
  protected constructor( mass: number ) {
    this.mass = mass;
  }

  /**
   * Calculate k²(x) = 2m(E - V(x))/ℏ² for all grid points.
   *
   * @param E - Energy eigenvalue (Joules)
   * @param V - Potential energy array (Joules)
   * @returns Array of k² values
   */
  protected calculateK2( E: number, V: number[] ): number[] {
    return V.map( v => ( 2 * this.mass * ( E - v ) ) / ( HBAR * HBAR ) );
  }

  /**
   * Calculate Numerov factors f_j = (h²/12) * k²(x_j) for all grid points.
   *
   * @param k2 - Array of k² values
   * @param dx - Grid spacing (meters)
   * @returns Array of Numerov factors
   */
  protected calculateNumerovFactors( k2: number[], dx: number ): number[] {
    const factor = ( dx * dx ) / 12;
    return k2.map( k => factor * k );
  }

  /**
   * Single Numerov integration step.
   * ψ_(j+1) = [(2 - 10f_j)ψ_j - (1+f_(j-1))ψ_(j-1)] / (1+f_(j+1))
   *
   * @param psi_j - Wavefunction at current point
   * @param psi_jMinus1 - Wavefunction at previous point
   * @param f_j - Numerov factor at current point
   * @param f_jMinus1 - Numerov factor at previous point
   * @param f_jPlus1 - Numerov factor at next point
   * @returns Wavefunction at next point
   */
  protected numerovStep(
    psi_j: number,
    psi_jMinus1: number,
    f_j: number,
    f_jMinus1: number,
    f_jPlus1: number
  ): number {
    const numerator = ( 2 - 10 * f_j ) * psi_j - ( 1 + f_jMinus1 ) * psi_jMinus1;
    const denominator = 1 + f_jPlus1;
    return numerator / denominator;
  }

  /**
   * Fill array with divergent value from given index onwards.
   * Used to mark non-bound states that diverge.
   *
   * @param psi - Wavefunction array to fill
   * @param startIndex - Index to start filling from
   * @param value - Value to fill with (defaults to 1e300)
   */
  protected fillDivergent( psi: number[], startIndex: number, value = VERY_LARGE_VALUE ): void {
    for ( let k = startIndex; k < psi.length; k++ ) {
      psi[ k ] = value;
    }
  }
}

quantumBoundStates.register( 'NumerovBase', NumerovBase );
