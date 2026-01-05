// Copyright 2026, University of Colorado Boulder

/**
 * SymmetricNumerovIntegrator integrates the Schrödinger equation for symmetric potentials.
 * Uses parity (even/odd symmetry) to integrate only half the domain, improving efficiency and accuracy.
 *
 * For symmetric potentials V(-x) = V(x), quantum mechanics guarantees that all eigenstates
 * have definite parity (either even or odd). This class exploits this symmetry:
 *
 * - Symmetric states: ψ(-x) = ψ(x), so ψ'(0) = 0
 *   Examples: Ground state of harmonic oscillator (n=0), second excited state (n=2), etc.
 *
 * - Antisymmetric states: ψ(-x) = -ψ(x), so ψ(0) = 0
 *   Examples: First excited state of harmonic oscillator (n=1), third excited state (n=3), etc.
 *
 * Benefits:
 * - 2× faster (only integrates half the domain)
 * - More accurate (enforces symmetry exactly)
 * - Better for finding specific parity states
 *
 * @example
 * // Find even states of infinite square well
 * const integrator = new SymmetricNumerovIntegrator( mass );
 * const psi = integrator.integrateFromCenter( energy, V, grid, 'symmetric' );
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import FundamentalConstants from './FundamentalConstants.js';
import XGrid from './XGrid.js';

export type Parity = 'symmetric' | 'antisymmetric';

export default class SymmetricNumerovIntegrator {

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
   * Integrate from center using parity to exploit symmetry.
   * Integrates from x=0 to x_max and uses parity to fill the left half.
   *
   * @param E - Energy eigenvalue (Joules)
   * @param V - Potential energy array (Joules)
   * @param grid - Spatial grid configuration (should be symmetric around x=0)
   * @param parity - 'symmetric' or 'antisymmetric'
   * @returns Wavefunction array
   */
  public integrateFromCenter(
    E: number,
    V: number[],
    grid: XGrid,
    parity: Parity
  ): number[] {
    const N = grid.getLength();
    const dx = grid.getDx();
    const psi = new Array( N ).fill( 0 );

    // Find center index (closest to x=0)
    const centerIdx = grid.findCenterIndex();

    // Calculate k²(x) and Numerov factors
    const k2 = this.calculateK2( E, V );
    const f = this.calculateNumerovFactors( k2, dx );

    // Set initial conditions based on parity
    this.setInitialConditions( psi, f, centerIdx, dx, parity );

    // Integrate from center to right boundary
    this.integrateForward( psi, f, centerIdx );

    // Use parity to fill left half
    this.applyParity( psi, centerIdx, parity );

    return psi;
  }

  /**
   * Calculate k²(x) = 2m(E - V(x))/ℏ².
   */
  private calculateK2( E: number, V: number[] ): number[] {
    return V.map( v => ( 2 * this.mass * ( E - v ) ) / ( this.HBAR * this.HBAR ) );
  }

  /**
   * Calculate Numerov factors f_j = (h²/12) * k²(x_j).
   */
  private calculateNumerovFactors( k2: number[], dx: number ): number[] {
    const factor = ( dx * dx ) / 12;
    return k2.map( k => factor * k );
  }

  /**
   * Set initial conditions at x=0 based on parity.
   *
   * @param psi - Wavefunction array (modified in place)
   * @param f - Numerov factors
   * @param centerIdx - Center index
   * @param dx - Grid spacing
   * @param parity - Symmetry type
   */
  private setInitialConditions(
    psi: number[],
    f: number[],
    centerIdx: number,
    dx: number,
    parity: Parity
  ): void {
    if ( parity === 'symmetric' ) {
      // Symmetric state: ψ(-x) = ψ(x)
      // At x=0: ψ'(0) = 0 (derivative must be zero)
      // Use Taylor expansion: ψ(dx) ≈ ψ(0) + ψ''(0)·dx²/2
      // From Schrödinger equation: ψ'' = -k²ψ
      // So ψ(dx) = ψ(0)·(1 - k²·dx²/2) = ψ(0)·(1 - 6f) where f = k²·dx²/12
      psi[ centerIdx ] = 1.0;
      psi[ centerIdx + 1 ] = 1.0 * ( 1 - 6 * f[ centerIdx ] );
    }
    else {
      // Antisymmetric state: ψ(-x) = -ψ(x)
      // At x=0: ψ(0) = 0 (wavefunction must be zero)
      // ψ(dx) ≈ ψ'(0)*dx (linear start)
      psi[ centerIdx ] = 0.0;
      psi[ centerIdx + 1 ] = dx;
    }
  }

  /**
   * Integrate forward from center to right boundary with periodic renormalization.
   *
   * @param psi - Wavefunction array (modified in place)
   * @param f - Numerov factors
   * @param centerIdx - Center index
   */
  private integrateForward( psi: number[], f: number[], centerIdx: number ): void {
    const N = psi.length;

    for ( let j = centerIdx + 1; j < N - 1; j++ ) {
      const numerator = ( 2 - 10 * f[ j ] ) * psi[ j ] - ( 1 + f[ j - 1 ] ) * psi[ j - 1 ];
      const denominator = 1 + f[ j + 1 ];
      psi[ j + 1 ] = numerator / denominator;

      // Stop on catastrophic numerical failure
      if ( !isFinite( psi[ j + 1 ] ) ) {
        this.fillInfinity( psi, j + 1 );
        break;
      }
    }
  }

  /**
   * Fill remaining array with large value to indicate divergence.
   */
  private fillInfinity( psi: number[], startIdx: number ): void {
    for ( let k = startIdx; k < psi.length; k++ ) {
      psi[ k ] = 1e100;
    }
  }

  /**
   * Apply parity symmetry to fill left half of wavefunction.
   *
   * @param psi - Wavefunction array (modified in place)
   * @param centerIdx - Center index
   * @param parity - Symmetry type
   */
  private applyParity( psi: number[], centerIdx: number, parity: Parity ): void {
    const paritySign = parity === 'symmetric' ? 1 : -1;

    for ( let i = 0; i < centerIdx; i++ ) {
      const mirrorIdx = 2 * centerIdx - i;
      if ( mirrorIdx < psi.length ) {
        psi[ i ] = paritySign * psi[ mirrorIdx ];
      }
    }
  }
}

quantumBoundStates.register( 'SymmetricNumerovIntegrator', SymmetricNumerovIntegrator );
