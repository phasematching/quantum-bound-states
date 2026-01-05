// Copyright 2026, University of Colorado Boulder

/**
 * XGrid represents a uniformly-spaced 1D spatial grid for quantum mechanics calculations.
 * Encapsulates grid parameters and provides utilities for grid operations.
 *
 * This class eliminates redundancy by computing derived properties (dx, array values)
 * from the fundamental grid parameters (xMin, xMax, numPoints).
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';

export default class XGrid {

  public readonly xMin: number;
  public readonly xMax: number;
  public readonly numPoints: number;

  /**
   * @param xMin - Minimum x value (meters)
   * @param xMax - Maximum x value (meters)
   * @param numPoints - Number of grid points
   */
  public constructor( xMin: number, xMax: number, numPoints: number ) {
    assert && assert( numPoints >= 2, 'Grid must have at least 2 points' );
    assert && assert( xMax > xMin, 'xMax must be greater than xMin' );

    this.xMin = xMin;
    this.xMax = xMax;
    this.numPoints = numPoints;
  }

  /**
   * Get the grid spacing (distance between adjacent points).
   */
  public getDx(): number {
    return ( this.xMax - this.xMin ) / ( this.numPoints - 1 );
  }

  /**
   * Get the length (number of points) of the grid.
   */
  public getLength(): number {
    return this.numPoints;
  }

  /**
   * Generate the array of x values.
   * @returns Array of spatial positions [x_0, x_1, ..., x_N-1]
   */
  public getArray(): number[] {
    const xArray: number[] = [];
    const dx = this.getDx();

    for ( let i = 0; i < this.numPoints; i++ ) {
      xArray.push( this.xMin + i * dx );
    }

    return xArray;
  }

  /**
   * Get the x value at a specific index.
   * @param index - Grid point index (0 to numPoints-1)
   * @returns x value at that index
   */
  public getValueAt( index: number ): number {
    assert && assert( index >= 0 && index < this.numPoints, 'Index out of bounds' );
    return this.xMin + index * this.getDx();
  }

  /**
   * Find the index of the grid point closest to x=0.
   * Useful for symmetric potentials centered at the origin.
   * @returns Index of center point
   */
  public findCenterIndex(): number {
    // For a grid from xMin to xMax, the index closest to x=0 is:
    // index = -xMin / (xMax - xMin) * (numPoints - 1)
    const index = Math.round( -this.xMin * ( this.numPoints - 1 ) / ( this.xMax - this.xMin ) );

    // Clamp to valid range
    return Math.max( 0, Math.min( this.numPoints - 1, index ) );
  }

  /**
   * Check if the grid is symmetric around x=0.
   * @param tolerance - Relative tolerance for symmetry check (default: 1e-10)
   * @returns True if |xMin + xMax| < tolerance * max(|xMin|, |xMax|)
   */
  public isSymmetric( tolerance = 1e-10 ): boolean {
    const maxAbs = Math.max( Math.abs( this.xMin ), Math.abs( this.xMax ) );
    return Math.abs( this.xMin + this.xMax ) < tolerance * maxAbs;
  }

  /**
   * Get the grid range (xMax - xMin).
   */
  public getRange(): number {
    return this.xMax - this.xMin;
  }

  /**
   * Create a copy of this grid with different parameters.
   * @param options - Partial parameters to override
   * @returns New XGrid instance
   */
  public withOptions( options: Partial<{ xMin: number; xMax: number; numPoints: number }> ): XGrid {
    return new XGrid(
      options.xMin ?? this.xMin,
      options.xMax ?? this.xMax,
      options.numPoints ?? this.numPoints
    );
  }

  /**
   * Check if two grids are equivalent.
   */
  public equals( other: XGrid, tolerance = 1e-15 ): boolean {
    return Math.abs( this.xMin - other.xMin ) < tolerance &&
           Math.abs( this.xMax - other.xMax ) < tolerance &&
           this.numPoints === other.numPoints;
  }

  /**
   * Get a string representation for debugging.
   */
  public toString(): string {
    return `XGrid(xMin=${this.xMin}, xMax=${this.xMax}, N=${this.numPoints}, dx=${this.getDx()})`;
  }
}

quantumBoundStates.register( 'XGrid', XGrid );
