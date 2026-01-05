// Copyright 2026, University of Colorado Boulder

/**
 * WavefunctionNormalizer normalizes wavefunctions using various numerical 
 * integration methods. Ensures that the probability density integrates to unity:
 * that is ∫|ψ|² dx = 1
 *
 * Note that we implicitly assume that the wavefunction is real-valued, the grid is 
 * equally spaced, and that the wavefunction is zero outside the bounds of the 
 * spatial grid. The last point is the most likely to fail. It is usually valid 
 * for bound states, but may not hold for high energy states that have large
 * probability outside (although the errors  would normally be small). 
 * Since the purpose of the normalization is to ensure correct relative
 * probabilities when superposing states, small errors in normalization are not 
 * usually critical.
 * 
 * Supports multiple normalization methods:
 * - Trapezoidal rule: O(h²) accuracy
 * - Simpson's rule: O(h⁴) accuracy
 * - Max normalization: Sets maximum AMPLITUDE to 1 (useful for visualization)
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';

export type NormalizationMethod = 'trapezoidal' | 'simpson' | 'max';

export default class WavefunctionNormalizer {

  private readonly method: NormalizationMethod;

  /**
   * @param method - Normalization method to use (default: 'trapezoidal')
   */
  public constructor( method: NormalizationMethod = 'trapezoidal' ) {
    this.method = method;
  }

  /**
   * Normalize a wavefunction according to the selected method.
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing (meters)
   * @returns Normalized wavefunction
   */
  public normalize( psi: number[], dx: number ): number[] {
    switch( this.method ) {
      case 'trapezoidal':
        return this.normalizeTrapezoidal( psi, dx );
      case 'simpson':
        return this.normalizeSimpson( psi, dx );
      case 'max':
        return this.normalizeMax( psi );
      default:
        return this.normalizeTrapezoidal( psi, dx );
    }
  }

  /**
   * Normalize using trapezoidal rule.
   * Calculates ∫|ψ|² dx ≈ Σ[(ψᵢ² + ψᵢ₊₁²)/2] * dx
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing
   * @returns Normalized wavefunction
   */
  private normalizeTrapezoidal( psi: number[], dx: number ): number[] {
    const integral = this.calculateTrapezoidalIntegral( psi, dx );
    const normalization = Math.sqrt( integral );

    return this.scaleWavefunction( psi, normalization );
  }

  /**
   * Normalize using Simpson's rule.
   * Calculates ∫|ψ|² dx ≈ (dx/3) * Σ[ψᵢ² + 4ψᵢ₊₁² + ψᵢ₊₂²]
   * More accurate than trapezoidal rule for smooth functions.
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing
   * @returns Normalized wavefunction
   */
  private normalizeSimpson( psi: number[], dx: number ): number[] {
    const integral = this.calculateSimpsonIntegral( psi, dx );
    const normalization = Math.sqrt( integral );

    return this.scaleWavefunction( psi, normalization );
  }

  /**
   * Normalize by maximum value.
   * Sets max|ψ| = 1, useful for visualization.
   *
   * @param psi - Wavefunction array
   * @returns Normalized wavefunction
   */
  private normalizeMax( psi: number[] ): number[] {
    const maxAbs = this.findMaxAbsoluteValue( psi );
    return this.scaleWavefunction( psi, maxAbs );
  }

  /**
   * Calculate integral using trapezoidal rule.
   * ∫|ψ|² dx ≈ Σ[(ψᵢ² + ψᵢ₊₁²)/2] * dx
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing
   * @returns Integral value
   */
  private calculateTrapezoidalIntegral( psi: number[], dx: number ): number {
    let integral = 0;

    for ( let i = 0; i < psi.length - 1; i++ ) {
      const term = ( psi[ i ] * psi[ i ] + psi[ i + 1 ] * psi[ i + 1 ] ) / 2;
      integral += term;
    }

    return integral * dx;
  }

  /**
   * Calculate integral using Simpson's rule.
   * ∫|ψ|² dx ≈ (dx/3) * Σ[ψᵢ² + 4ψᵢ₊₁² + ψᵢ₊₂²]
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing
   * @returns Integral value
   */
  private calculateSimpsonIntegral( psi: number[], dx: number ): number {
    let sum = 0;
    const N = psi.length;

    // Simpson's rule requires even number of intervals
    // If odd number of points, use trapezoidal for last interval
    const limit = N % 2 === 1 ? N - 2 : N - 1;

    for ( let i = 0; i < limit; i += 2 ) {
      sum += psi[ i ] ** 2 + 4 * psi[ i + 1 ] ** 2 + psi[ i + 2 ] ** 2;
    }

    let integral = ( sum * dx ) / 3.0;

    // Handle odd case with trapezoidal rule for last interval
    if ( N % 2 === 1 ) {
      const lastTerm = ( psi[ N - 2 ] ** 2 + psi[ N - 1 ] ** 2 ) / 2;
      integral += lastTerm * dx;
    }

    return integral;
  }

  /**
   * Find maximum absolute value in wavefunction.
   *
   * @param psi - Wavefunction array
   * @returns Maximum absolute value
   */
  private findMaxAbsoluteValue( psi: number[] ): number {
    let maxAbs = 0;

    for ( const value of psi ) {
      maxAbs = Math.max( maxAbs, Math.abs( value ) );
    }

    return maxAbs;
  }

  /**
   * Scale wavefunction by dividing all values by the normalization factor.
   *
   * @param psi - Wavefunction array
   * @param normalization - Normalization factor
   * @returns Scaled wavefunction
   */
  private scaleWavefunction( psi: number[], normalization: number ): number[] {
    // Avoid division by zero
    if ( normalization === 0 || !isFinite( normalization ) ) {
      return psi.slice(); // Return copy of original
    }

    return psi.map( value => value / normalization );
  }

  /**
   * Get the normalization method being used.
   */
  public getMethod(): NormalizationMethod {
    return this.method;
  }

  /**
   * Calculate the norm (integral of |ψ|²) without normalizing.
   * Useful for checking if a wavefunction is already normalized.
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing
   * @returns Integral of |ψ|² dx
   */
  public calculateNorm( psi: number[], dx: number ): number {
    return this.method === 'simpson'
      ? this.calculateSimpsonIntegral( psi, dx )
      : this.calculateTrapezoidalIntegral( psi, dx );
  }

  /**
   * Check if a wavefunction is approximately normalized.
   *
   * @param psi - Wavefunction array
   * @param dx - Grid spacing
   * @param tolerance - Tolerance for checking (default: 1e-6)
   * @returns True if |∫|ψ|² dx - 1| < tolerance
   */
  public isNormalized( psi: number[], dx: number, tolerance = 1e-6 ): boolean {
    const norm = this.calculateNorm( psi, dx );
    return Math.abs( norm - 1.0 ) < tolerance;
  }
}

quantumBoundStates.register( 'WavefunctionNormalizer', WavefunctionNormalizer );
