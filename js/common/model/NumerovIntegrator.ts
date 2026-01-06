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

import affirm from '../../../../perennial-alias/js/browser-and-node/affirm.js';
import quantumBoundStates from '../../quantumBoundStates.js';
import NumerovBase from './NumerovBase.js';
import XGrid from './XGrid.js';

export default class NumerovIntegrator extends NumerovBase {

  /**
   * @param mass - Particle mass in kg
   */
  public constructor( mass: number ) {
    super( mass );
  }

  /**
   * Integrate the Schrödinger equation using Numerov formula.
   *
   * @param E - Energy eigenvalue to test (Joules)
   * @param V - Potential energy array (Joules)
   * @param grid - Spatial grid configuration
   * @returns Wavefunction array
   */
  public integrate( E: number, V: number[], grid: XGrid ): number[] {
    const N = grid.getLength();
    const dx = grid.getDx();

    // Validate that V array matches grid length
    affirm( V.length === N, `V.length (${V.length}) must equal grid.getLength() (${N})` );

    // Initialize the wavefunction array
    const psi = new Array( N ).fill( 0 );

    // Calculate k²(x) and Numerov factors
    const k2 = this.calculateK2( E, V );
    const f = this.calculateNumerovFactors( k2, dx );

    // Set initial conditions at boundary
    this.setInitialConditions( psi, k2, dx, N );

    // Integrate from left boundary to right boundary
    this.integrateForward( psi, f );

    return psi;
  }

  /**
   * Set initial conditions at left boundary (x_min).
   * Uses physically-motivated scales based on dimensional analysis: ψ ~ 1/√L
   *
   * @param psi - Wavefunction array (modified in place)
   * @param k2 - Array of k² values
   * @param dx - Grid spacing
   * @param N - Number of grid points
   */
  private setInitialConditions(
    psi: number[],
    k2: number[],
    dx: number,
    N: number
  ): void {
    // Boundary condition: ψ(x_min) = 0
    psi[ 0 ] = 0;

    // Physical motivation for initial value at second point:
    // The wavefunction will be normalized after finding the eigenstate, so the absolute scale
    // here is arbitrary. However, choosing a physically-motivated scale helps avoid numerical
    // overflow/underflow during integration.
    //
    // For a bound state in a box of size L ≈ N·dx, dimensional analysis gives the typical
    // wavefunction scale as ψ ~ 1/√L. We use a slightly larger initial value to ensure
    // good numerical behavior: ψ(x₁) ~ 1/(N·√(dx·N))
    //
    // This gives units [1/√length] and magnitude that grows gradually from the boundary.

    const L = N * dx; // Total domain size (meters)

    // Base scale for unnormalized wavefunction during integration
    const psiScale = 1 / ( N * Math.sqrt( L ) );

    // Set second point based on whether we're in classically allowed or forbidden region
    if ( k2[ 1 ] >= 0 ) {
      // Classically allowed region: E > V(x₁)
      // Wavefunction oscillates. Start with base scale value.
      psi[ 1 ] = psiScale * Math.sin( Math.sqrt( k2[ 1 ] ) * dx );
    }
    else {
      // Classically forbidden region: E < V(x₁)
      // Wavefunction decays exponentially as ψ ~ exp(-κx) where κ = √(2m(V-E)/ℏ²)
      // Apply exponential suppression over the characteristic decay length
      const kappa = Math.sqrt( Math.abs( k2[ 1 ] ) ); // Decay constant κ = √|k²| (1/m)
      const decayLength = L / 2; // Use half the domain as characteristic scale
      psi[ 1 ] = psiScale * Math.exp( -kappa * decayLength );
    }
  }

  /**
   * Integrate forward from left boundary to right boundary.
   *
   * @param psi - Wavefunction array (modified in place)
   * @param f - Numerov factors
   */
  private integrateForward( psi: number[], f: number[] ): void {
    const N = psi.length;

    for ( let j = 1; j < N - 1; j++ ) {
      psi[ j + 1 ] = this.numerovStep( psi[ j ], psi[ j - 1 ], f[ j ], f[ j - 1 ], f[ j + 1 ] );

      // Check for divergence (not a bound state)
      // Use a very high threshold to avoid premature cutoff for finite barriers
      if ( Math.abs( psi[ j + 1 ] ) > 1e300 ) {
        // Force large value to indicate divergence
        this.fillDivergent( psi, j + 1, psi[ j + 1 ] );
        break;
      }
    }
  }
}

quantumBoundStates.register( 'NumerovIntegrator', NumerovIntegrator );
