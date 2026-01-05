// Copyright 2026, University of Colorado Boulder

/**
 * NumerovIntegrator integrates the Schrödinger equation using the Numerov method.
 * Uses the higher-order Numerov formula with O(h^6) error.
 *
 * The Numerov formula is:
 * ψ_(j+1) = [(2 - 10f_j)ψ_j - (1+f_(j-1))ψ_(j-1)] / (1+f_(j+1))
 * where f_j = (h²/12) k²(x_j) and k²(x) = 2m(E - V(x))/ℏ²
 *
 * See https://arxiv.org/abs/2203.15262 or similar references for details.
 *  
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import FundamentalConstants from './FundamentalConstants.js';

export default class NumerovIntegrator {

  private readonly mass: number;
  private readonly HBAR: number;

  /**
   * @param mass - Particle mass in kg
   */
  public constructor( mass: number ) {
    this.mass = mass;
    this.HBAR = FundamentalConstants.HBAR;
  }

  /**
   * Integrate the Schrödinger equation using Numerov formula.
   *
   * @param E - Energy eigenvalue to test (Joules)
   * @param V - Potential energy array (Joules)
   * @param xGrid - Spatial grid (meters)
   * @param dx - Grid spacing (meters)
   * @returns Wavefunction array
   */
  public integrate( E: number, V: number[], xGrid: number[], dx: number ): number[] {
    const N = xGrid.length;
    const psi = new Array( N ).fill( 0 );

    // Calculate k²(x) = 2m(E - V(x))/ℏ²
    const k2 = this.calculateK2( E, V );

    // Calculate f_j = (h²/12) * k²(x_j)
    const f = this.calculateNumerovFactors( k2, dx );

    // Initial conditions (boundary condition: ψ(x_min) = 0)
    psi[ 0 ] = 0;
    psi[ 1 ] = dx; // Small non-zero value

    // Numerov forward integration
    for ( let j = 1; j < N - 1; j++ ) {
      psi[ j + 1 ] = this.numerovStep( psi[ j ], psi[ j - 1 ], f[ j ], f[ j - 1 ], f[ j + 1 ] );

      // Check for divergence (not a bound state)
      if ( Math.abs( psi[ j + 1 ] ) > 1e10 ) {
        // Force large value to indicate divergence
        this.fillDivergent( psi, j + 1, psi[ j + 1 ] );
        break;
      }
    }

    return psi;
  }

  /**
   * Calculate k²(x) = 2m(E - V(x))/ℏ² for all grid points.
   *
   * @param E - Energy eigenvalue (Joules)
   * @param V - Potential energy array (Joules)
   * @returns Array of k² values
   */
  private calculateK2( E: number, V: number[] ): number[] {
    return V.map( v => ( 2 * this.mass * ( E - v ) ) / ( this.HBAR * this.HBAR ) );
  }

  /**
   * Calculate Numerov factors f_j = (h²/12) * k²(x_j) for all grid points.
   *
   * @param k2 - Array of k² values
   * @param dx - Grid spacing (meters)
   * @returns Array of Numerov factors
   */
  private calculateNumerovFactors( k2: number[], dx: number ): number[] {
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
  private numerovStep(
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
   *
   * @param psi - Wavefunction array to fill
   * @param startIndex - Index to start filling from
   * @param value - Value to fill with
   */
  private fillDivergent( psi: number[], startIndex: number, value: number ): void {
    for ( let k = startIndex; k < psi.length; k++ ) {
      psi[ k ] = value;
    }
  }
}

quantumBoundStates.register( 'NumerovIntegrator', NumerovIntegrator );
