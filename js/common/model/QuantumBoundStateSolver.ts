// Copyright 2026, University of Colorado Boulder

/**
 * ⚠️ DEPRECATED - DO NOT USE ⚠️
 *
 * This file contains an older, more complex implementation of the quantum bound state solver
 * using inward-outward shooting with matching. It has been superseded by the modular
 * Numerov solver architecture.
 *
 * ✅ USE INSTEAD: NumerovSolver.ts and its modular components
 *
 * The new implementation provides:
 * - Better separation of concerns (modular architecture)
 * - Easier testing and maintenance
 * - Clearer API (functional and object-oriented)
 * - Comprehensive documentation
 * - Validated accuracy (< 0.5% error on harmonic oscillator)
 *
 * See README.md for the new API and NUMEROV_ARCHITECTURE.md for architecture details.
 *
 * This file is kept for historical reference only and is NOT imported anywhere in the codebase.
 *
 * ---
 *
 * Advanced Quantum Bound State Solver for the Time-Independent Schrodinger Equation
 *
 * Features:
 * - Inward-Outward shooting method with adaptive energy bracketing
 * - 6th-order accurate Numerov integration
 * - Automatic symmetry detection and parity-based eigenvalue finding
 * - Node counting for eigenstate identification
 *
 * Algorithm improvements:
 * 1. Inward-outward integration: Integrates from both boundaries and matches at x_m
 * 2. Symmetry exploitation: For symmetric potentials, uses parity (even/odd) to improve convergence
 * 3. Node counting: Ground state has 0 nodes, first excited has 1 node, etc.
 *
 * The TISE is: -ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ
 * Rearranged as: d²ψ/dx² = -k²(x)ψ where k²(x) = 2m(E - V(x))/ℏ²
 *
 * @author Martin Veillette
 * @deprecated Use NumerovSolver.ts instead
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import FundamentalConstants from './FundamentalConstants.js';
import { BoundStateResult, GridConfig, PotentialFunction } from './PotentialFunction.js';

// Numerical constants
const DEFAULT_MAX_ITERATIONS = 100;
const DEFAULT_CONVERGENCE_TOLERANCE = 1e-10;
const DEFAULT_ENERGY_TOLERANCE = 1e-12;
const DEFAULT_WAVE_FUNCTION_TOLERANCE = 1e-8;
const NUMEROV_C3OEFFICIENT = 1.0 / 12.0;
const MATCHING_POINT_FRACTION = 0.45;
const BOUNDARY_PSI_INITIAL = 0.0;
const BOUNDARY_PSI_DERIVATIVE = 1.0;
const SYMMETRY_TOLERANCE = 1e-10;

/**
 * Integration result with detailed metrics
 */
class IntegrationResult {
  public constructor(
    public readonly nodeCount: number,
    public readonly logDerivativeMismatch: number,
    public readonly matchingAmplitude = 0
  ) {}

  public hasTooManyNodes( desiredNodes: number ): boolean {
    return (
      this.nodeCount > desiredNodes ||
      ( this.nodeCount === desiredNodes && this.logDerivativeMismatch < 0.0 )
    );
  }

  public get isConverged(): boolean {
    return Math.abs( this.logDerivativeMismatch ) < DEFAULT_CONVERGENCE_TOLERANCE;
  }
}

/**
 * Detailed quantum state information
 */
type QuantumState = {
  energy: number;
  waveFunction: number[];
  nodes: number;
  normalizationConstant: number;
  matchingPoint: number;
  convergenceMetric: number;
};

/**
 * Solver configuration options
 */
type SolverConfig = {
  maxIterations?: number;
  convergenceTolerance?: number;
  energyTolerance?: number;
  waveFunctionTolerance?: number;
  adaptiveMatching?: boolean;
  normalizationMethod?: 'max' | 'l2';
};

export default class QuantumBoundStateSolver {

  // Configuration
  private readonly maxIterations: number;
  private readonly convergenceTolerance: number;
  private readonly energyTolerance: number;
  private readonly waveFunctionTolerance: number;
  private readonly adaptiveMatching: boolean;
  private readonly normalizationMethod: 'max' | 'l2';

  // Grid properties
  private readonly deltaX: number;
  private readonly gridPositions: number[];
  private readonly potentialEnergies: number[];
  private readonly hbarSquaredOver2m: number;
  private readonly gridPoints: number;

  // Cached properties
  private readonly optimalMatchPoint: number;
  private readonly maxPotential: number;
  private readonly isSymmetric: boolean;
  private readonly symmetryCenter: number;
  private nodeTransitionEnergies: number[] | null = null;

  public constructor(
    mass: number,
    xMin: number,
    xMax: number,
    numPoints: number,
    private readonly potentialFunction: PotentialFunction,
    config?: SolverConfig
  ) {
    const { HBAR } = FundamentalConstants;
    this.hbarSquaredOver2m = ( HBAR * HBAR ) / ( 2 * mass );
    this.gridPoints = numPoints;

    // Set configuration with defaults
    this.maxIterations = config?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    this.convergenceTolerance = config?.convergenceTolerance ?? DEFAULT_CONVERGENCE_TOLERANCE;
    this.energyTolerance = config?.energyTolerance ?? DEFAULT_ENERGY_TOLERANCE;
    this.waveFunctionTolerance = config?.waveFunctionTolerance ?? DEFAULT_WAVE_FUNCTION_TOLERANCE;
    this.adaptiveMatching = config?.adaptiveMatching ?? true;
    this.normalizationMethod = config?.normalizationMethod ?? 'l2';

    // Pre-calculate grid properties
    this.deltaX = ( xMax - xMin ) / ( numPoints - 1 );
    this.gridPositions = this.calculateGridPositions( xMin, xMax, numPoints );
    this.potentialEnergies = this.calculatePotentialOnGrid();

    // Cache maximum potential
    this.maxPotential = Math.max( ...this.potentialEnergies );

    // Compute optimal matching point
    this.optimalMatchPoint = this.computeOptimalMatchPoint();

    // Detect potential symmetry
    const symmetryInfo = this.detectSymmetry();
    this.isSymmetric = symmetryInfo.isSymmetric;
    this.symmetryCenter = symmetryInfo.center;
  }

  /**
   * Finds the nth eigenstate (energy and wavefunction)
   */
  public findEigenstate( n: number ): QuantumState {
    const desiredNodes = n - 1; // nth state has n-1 nodes

    // Find energy
    const energy = this.findEnergyEigenvalue( desiredNodes );

    // Validate bound state
    assert && assert( energy < this.maxPotential, 'Energy must be below maximum potential for bound state' );

    // Calculate wavefunction
    const waveFunction = this.calculateNormalizedWaveFunction( energy );

    // Determine matching point
    const matchingPoint = this.adaptiveMatching
      ? this.findOptimalMatchingPoint( energy )
      : Math.floor( this.gridPoints * MATCHING_POINT_FRACTION );

    // Calculate normalization constant
    const normalizationConstant = this.calculateNormalizationConstant( waveFunction );

    // Verify solution quality
    const convergenceMetric = this.calculateConvergenceMetric( energy );

    return {
      energy: energy,
      waveFunction: waveFunction,
      nodes: desiredNodes,
      normalizationConstant: normalizationConstant,
      matchingPoint: matchingPoint,
      convergenceMetric: convergenceMetric
    };
  }

  /**
   * Finds multiple eigenstates efficiently
   */
  public findMultipleEigenstates( nStates: number ): QuantumState[] {
    const states: QuantumState[] = [];

    for ( let n = 1; n <= nStates; n++ ) {
      try {
        states.push( this.findEigenstate( n ) );
      }
      catch( error ) {
        // Stop when bound states are exhausted
        break;
      }
    }

    // Sort by energy
    states.sort( ( a, b ) => a.energy - b.energy );

    return states;
  }

  /**
   * Returns the maximum potential energy
   */
  public getMaxPotential(): number {
    return this.maxPotential;
  }

  /**
   * Returns the grid positions
   */
  public getGridPositions(): number[] {
    return this.gridPositions.slice();
  }

  /**
   * Returns whether the potential is symmetric
   */
  public isPotentialSymmetric(): boolean {
    return this.isSymmetric;
  }

  // Private methods

  private findEnergyEigenvalue( desiredNodes: number ): number {
    const { lowerBound, upperBound } = this.findEnergyBounds( desiredNodes );

    assert && assert( lowerBound < upperBound, 'Invalid energy bounds' );
    assert && assert( lowerBound < this.maxPotential, 'Lower bound must be below maximum potential' );

    // Binary search
    const energy = this.findEnergyWithBinarySearch( lowerBound, upperBound, desiredNodes );

    // Fine-tune with secant method
    return this.refineEnergyWithSecant( energy );
  }

  private findEnergyBounds( desiredNodes: number ): { lowerBound: number; upperBound: number } {
    if ( !this.nodeTransitionEnergies || this.nodeTransitionEnergies.length <= desiredNodes + 1 ) {
      this.nodeTransitionEnergies = this.findNodeTransitionEnergies( desiredNodes + 5 );
    }

    const minPotential = Math.min( ...this.potentialEnergies );

    let lowerBound: number;
    let upperBound: number;

    if ( this.nodeTransitionEnergies.length > desiredNodes + 1 ) {
      lowerBound = this.nodeTransitionEnergies[ desiredNodes ];
      upperBound = this.nodeTransitionEnergies[ desiredNodes + 1 ];
    }
    else if ( this.nodeTransitionEnergies.length > desiredNodes ) {
      lowerBound = this.nodeTransitionEnergies[ desiredNodes ];
      upperBound = this.maxPotential;
    }
    else {
      lowerBound = this.maxPotential;
      upperBound = this.maxPotential;
    }

    if ( lowerBound < minPotential ) {
      lowerBound = minPotential;
    }

    return { lowerBound: lowerBound, upperBound: upperBound };
  }

  private findNodeTransitionEnergies( maxNodes: number ): number[] {
    const boxLength = this.gridPositions[ this.gridPoints - 1 ] - this.gridPositions[ 0 ];
    const minPotential = Math.min( ...this.potentialEnergies );
    const energyScale = ( this.hbarSquaredOver2m * Math.PI * Math.PI ) / ( boxLength * boxLength );
    const energyRange = this.maxPotential - minPotential;
    const numSteps = Math.max( 1000, maxNodes * 100 );
    const energyStep = energyRange / numSteps;
    const fixedMatchPoint = this.optimalMatchPoint;

    let energy = minPotential - energyScale * 10;
    let test = this.integrateSchrodinger( energy, fixedMatchPoint );
    while ( test.nodeCount > 0 && energy > minPotential - energyScale * 1000 ) {
      energy -= energyScale * 10;
      test = this.integrateSchrodinger( energy, fixedMatchPoint );
    }

    const transitions: number[] = [ energy ];
    let currentNodes = 0;
    let prevEnergy = energy;

    for ( let iter = 0; iter < numSteps * 2 && currentNodes <= maxNodes; iter++ ) {
      energy += energyStep;

      if ( energy >= this.maxPotential ) {
        break;
      }

      test = this.integrateSchrodinger( energy, fixedMatchPoint );
      const nodeCount = test.nodeCount;

      if ( nodeCount > currentNodes ) {
        let lo = prevEnergy;
        let hi = energy;
        for ( let j = 0; j < 40; j++ ) {
          const mid = ( lo + hi ) / 2;
          const midTest = this.integrateSchrodinger( mid, fixedMatchPoint );
          if ( midTest.nodeCount > currentNodes ) {
            hi = mid;
          }
          else {
            lo = mid;
          }
        }
        const transitionEnergy = ( lo + hi ) / 2;

        while ( transitions.length <= nodeCount ) {
          transitions.push( transitionEnergy );
        }
        currentNodes = nodeCount;
      }

      prevEnergy = energy;
    }

    transitions.push( this.maxPotential );

    return transitions;
  }

  private findEnergyWithBinarySearch( lowerBound: number, upperBound: number, desiredNodes: number ): number {
    let lower = lowerBound;
    let upper = upperBound;
    let energy = 0.5 * ( lower + upper );
    const fixedMatchPoint = this.optimalMatchPoint;

    for ( let i = 0; i < this.maxIterations; i++ ) {
      energy = 0.5 * ( lower + upper );
      const test = this.integrateSchrodinger( energy, fixedMatchPoint );

      if ( !Number.isFinite( test.logDerivativeMismatch ) ) {
        if ( test.nodeCount > desiredNodes ) {
          upper = energy;
        }
        else {
          lower = energy;
        }
        continue;
      }

      if ( test.isConverged ) { break; }

      if ( test.hasTooManyNodes( desiredNodes ) ) {
        upper = energy;
      }
      else {
        lower = energy;
      }

      if ( Math.abs( upper - lower ) < this.energyTolerance ) { break; }
    }

    return energy;
  }

  private refineEnergyWithSecant( initialEnergy: number ): number {
    let energyPrevious = initialEnergy * 0.999;
    let energyCurrent = initialEnergy * 1.001;
    const fixedMatchPoint = this.optimalMatchPoint;

    let mismatchPrevious = this.integrateSchrodinger( energyPrevious, fixedMatchPoint ).logDerivativeMismatch;
    let mismatchCurrent = this.integrateSchrodinger( energyCurrent, fixedMatchPoint ).logDerivativeMismatch;

    for ( let iteration = 0; iteration < 10; iteration++ ) {
      const mismatchDifference = mismatchCurrent - mismatchPrevious;
      if ( Math.abs( mismatchDifference ) < this.convergenceTolerance ) { break; }

      const energyNext = energyCurrent - ( mismatchCurrent * ( energyCurrent - energyPrevious ) ) / mismatchDifference;
      const mismatchNext = this.integrateSchrodinger( energyNext, fixedMatchPoint ).logDerivativeMismatch;

      if ( Math.abs( mismatchNext ) < this.convergenceTolerance ) { return energyNext; }

      energyPrevious = energyCurrent;
      mismatchPrevious = mismatchCurrent;
      energyCurrent = energyNext;
      mismatchCurrent = mismatchNext;
    }

    return energyCurrent;
  }

  private integrateSchrodinger( energy: number, useFixedMatchPoint?: number ): IntegrationResult {
    const matchPoint = useFixedMatchPoint !== undefined ? useFixedMatchPoint :
                       this.adaptiveMatching ? this.findOptimalMatchingPoint( energy ) :
                       this.optimalMatchPoint;

    const numerovFactor = this.deltaX * this.deltaX * NUMEROV_COEFFICIENT;
    const inverseHbar2Over2m = 1.0 / this.hbarSquaredOver2m;

    const effectivePotential = this.potentialEnergies.map( V => inverseHbar2Over2m * ( V - energy ) );

    const forwardResult = this.integrateForward( effectivePotential, numerovFactor, matchPoint );
    const backwardResult = this.integrateBackward( effectivePotential, numerovFactor, matchPoint );

    const nodeCount = forwardResult.nodes + backwardResult.nodes;
    const logDerivativeMismatch = forwardResult.logDerivative + backwardResult.logDerivative;
    const matchingAmplitude = Math.abs( forwardResult.psiAtMatch );

    return new IntegrationResult( nodeCount, logDerivativeMismatch, matchingAmplitude );
  }

  private integrateForward(
    effectivePotential: number[],
    numerovFactor: number,
    matchPoint: number
  ): { nodes: number; logDerivative: number; psiAtMatch: number } {
    let psi_prev = BOUNDARY_PSI_INITIAL;
    let psi_current = BOUNDARY_PSI_INITIAL;
    let psi_next = BOUNDARY_PSI_DERIVATIVE;

    let nodes = 0;
    const psiValues: number[] = [ psi_current, psi_next ];
    let scaleFactor = 1.0;
    const RENORM_THRESHOLD = 1e10;

    for ( let i = 2; i <= matchPoint + 1; i++ ) {
      psi_prev = psi_current;
      psi_current = psi_next;

      psi_next = this.numerovStep(
        psi_current,
        psi_prev,
        effectivePotential[ i - 2 ],
        effectivePotential[ i - 1 ],
        effectivePotential[ i ],
        numerovFactor
      );

      if ( Math.abs( psi_next ) > RENORM_THRESHOLD ) {
        const norm = Math.abs( psi_next );
        psi_prev /= norm;
        psi_current /= norm;
        psi_next /= norm;
        scaleFactor *= norm;
        for ( let j = 0; j < psiValues.length; j++ ) {
          psiValues[ j ] /= norm;
        }
      }

      psiValues.push( psi_next );

      if ( i <= matchPoint && this.isNode( psi_current, psi_next ) ) {
        nodes++;
      }
    }

    const logDerivative = this.calculateLogDerivative(
      psiValues[ matchPoint - 1 ],
      psiValues[ matchPoint ],
      psiValues[ matchPoint + 1 ]
    );

    return { nodes: nodes, logDerivative: logDerivative, psiAtMatch: psiValues[ matchPoint ] * scaleFactor };
  }

  private integrateBackward(
    effectivePotential: number[],
    numerovFactor: number,
    matchPoint: number
  ): { nodes: number; logDerivative: number; psiAtMatch: number } {
    let psi_prev = BOUNDARY_PSI_INITIAL;
    let psi_current = BOUNDARY_PSI_INITIAL;
    let psi_next = BOUNDARY_PSI_DERIVATIVE;

    let nodes = 0;
    const psiValues: number[] = new Array( this.gridPoints ).fill( 0 );
    psiValues[ this.gridPoints - 1 ] = psi_prev;
    psiValues[ this.gridPoints - 2 ] = psi_current;
    let scaleFactor = 1.0;
    const RENORM_THRESHOLD = 1e10;

    for ( let i = this.gridPoints - 3; i >= matchPoint - 1; i-- ) {
      psi_prev = psi_current;
      psi_current = psi_next;

      psi_next = this.numerovStep(
        psi_current,
        psi_prev,
        effectivePotential[ i + 2 ],
        effectivePotential[ i + 1 ],
        effectivePotential[ i ],
        numerovFactor
      );

      if ( Math.abs( psi_next ) > RENORM_THRESHOLD ) {
        const norm = Math.abs( psi_next );
        psi_prev /= norm;
        psi_current /= norm;
        psi_next /= norm;
        scaleFactor *= norm;
        for ( let j = i + 1; j < this.gridPoints; j++ ) {
          psiValues[ j ] /= norm;
        }
      }

      psiValues[ i ] = psi_next;

      if ( i >= matchPoint && this.isNode( psi_current, psi_next ) ) {
        nodes++;
      }
    }

    const logDerivative = this.calculateLogDerivative(
      psiValues[ matchPoint + 1 ],
      psiValues[ matchPoint ],
      psiValues[ matchPoint - 1 ]
    );

    return { nodes: nodes, logDerivative: logDerivative, psiAtMatch: psiValues[ matchPoint ] * scaleFactor };
  }

  private numerovStep(
    psi_current: number,
    psi_prev: number,
    pot_prev: number,
    pot_current: number,
    pot_next: number,
    numerovFactor: number
  ): number {
    const denominator = 1.0 - numerovFactor * pot_next;

    if ( Math.abs( denominator ) < 1e-15 ) {
      return psi_current * 2.0;
    }

    const result = ( psi_current * ( 2.0 + 10.0 * numerovFactor * pot_current ) -
                     psi_prev * ( 1.0 - numerovFactor * pot_prev ) ) / denominator;

    const MAX_PSI = 1e100;
    if ( !Number.isFinite( result ) ) {
      return Math.sign( psi_current ) * MAX_PSI;
    }
    return Math.max( -MAX_PSI, Math.min( MAX_PSI, result ) );
  }

  private calculateNormalizedWaveFunction( energy: number ): number[] {
    const waveFunction = new Array<number>( this.gridPoints );
    const matchPoint = this.adaptiveMatching
      ? this.findOptimalMatchingPoint( energy )
      : Math.floor( this.gridPoints * MATCHING_POINT_FRACTION );

    const numerovFactor = this.deltaX * this.deltaX * NUMEROV_COEFFICIENT;
    const inverseHbar2Over2m = 1.0 / this.hbarSquaredOver2m;
    const effectivePotential = this.potentialEnergies.map( V => inverseHbar2Over2m * ( V - energy ) );

    // Forward integration
    waveFunction[ 0 ] = BOUNDARY_PSI_INITIAL;
    waveFunction[ 1 ] = BOUNDARY_PSI_DERIVATIVE;

    for ( let i = 2; i <= matchPoint; i++ ) {
      waveFunction[ i ] = this.numerovStep(
        waveFunction[ i - 1 ],
        waveFunction[ i - 2 ],
        effectivePotential[ i - 2 ],
        effectivePotential[ i - 1 ],
        effectivePotential[ i ],
        numerovFactor
      );
    }

    const psi_leftAtMatch = waveFunction[ matchPoint ];

    // Backward integration
    waveFunction[ this.gridPoints - 1 ] = BOUNDARY_PSI_INITIAL;
    waveFunction[ this.gridPoints - 2 ] = BOUNDARY_PSI_DERIVATIVE;

    for ( let i = this.gridPoints - 3; i >= matchPoint; i-- ) {
      waveFunction[ i ] = this.numerovStep(
        waveFunction[ i + 1 ],
        waveFunction[ i + 2 ],
        effectivePotential[ i + 2 ],
        effectivePotential[ i + 1 ],
        effectivePotential[ i ],
        numerovFactor
      );
    }

    // Scale to match
    const scaleFactor = psi_leftAtMatch / waveFunction[ matchPoint ];
    for ( let i = matchPoint; i < this.gridPoints; i++ ) {
      waveFunction[ i ] *= scaleFactor;
    }

    return this.normalizeWaveFunction( waveFunction );
  }

  private normalizeWaveFunction( waveFunction: number[] ): number[] {
    const norm = this.normalizationMethod === 'l2'
      ? Math.sqrt( this.calculateL2Norm( waveFunction ) )
      : Math.max( ...waveFunction.map( Math.abs ) );

    return norm === 0 ? waveFunction : waveFunction.map( psi => psi / norm );
  }

  private calculateL2Norm( waveFunction: number[] ): number {
    let sum = 0;
    for ( let i = 0; i < this.gridPoints - 2; i += 2 ) {
      sum += waveFunction[ i ] ** 2 + 4 * waveFunction[ i + 1 ] ** 2 + waveFunction[ i + 2 ] ** 2;
    }
    return ( sum * this.deltaX ) / 3.0;
  }

  private calculateNormalizationConstant( waveFunction: number[] ): number {
    const l2Norm = this.calculateL2Norm( waveFunction );
    return l2Norm > 0 ? 1.0 / Math.sqrt( l2Norm ) : 1.0;
  }

  private calculateConvergenceMetric( energy: number ): number {
    const result = this.integrateSchrodinger( energy );
    const continuity = Math.exp( -Math.abs( result.logDerivativeMismatch ) );
    const amplitude = result.matchingAmplitude;
    return continuity * amplitude;
  }

  private computeOptimalMatchPoint(): number {
    const minPotential = Math.min( ...this.potentialEnergies );
    const tolerance = ( this.maxPotential - minPotential ) * 0.01;

    let wellStart = -1;
    let wellEnd = -1;

    for ( let i = 0; i < this.gridPoints; i++ ) {
      const isInWell = this.potentialEnergies[ i ] <= minPotential + tolerance;

      if ( isInWell && wellStart === -1 ) {
        wellStart = i;
      }
      if ( !isInWell && wellStart !== -1 && wellEnd === -1 ) {
        wellEnd = i - 1;
        break;
      }
    }

    if ( wellStart !== -1 && wellEnd === -1 ) {
      wellEnd = this.gridPoints - 1;
    }

    if ( wellStart !== -1 && wellEnd !== -1 ) {
      return Math.floor( wellStart + 0.75 * ( wellEnd - wellStart ) );
    }

    return Math.floor( this.gridPoints * MATCHING_POINT_FRACTION );
  }

  private detectSymmetry(): { isSymmetric: boolean; center: number } {
    const xMin = this.gridPositions[ 0 ];
    const xMax = this.gridPositions[ this.gridPoints - 1 ];
    const center = ( xMin + xMax ) / 2.0;

    let maxAsymmetry = 0;
    for ( let i = 0; i < this.gridPoints / 2; i++ ) {
      const leftIdx = i;
      const rightIdx = this.gridPoints - 1 - i;
      const asymmetry = Math.abs( this.potentialEnergies[ leftIdx ] - this.potentialEnergies[ rightIdx ] );
      maxAsymmetry = Math.max( maxAsymmetry, asymmetry );
    }

    const potentialRange = this.maxPotential - Math.min( ...this.potentialEnergies );
    const relativeAsymmetry = potentialRange > 0 ? maxAsymmetry / potentialRange : maxAsymmetry;

    return {
      isSymmetric: relativeAsymmetry < SYMMETRY_TOLERANCE,
      center: center
    };
  }

  private calculateGridPositions( xMin: number, xMax: number, numPoints: number ): number[] {
    const positions = new Array<number>( numPoints );
    const dx = ( xMax - xMin ) / ( numPoints - 1 );
    for ( let i = 0; i < numPoints; i++ ) {
      positions[ i ] = xMin + i * dx;
    }
    return positions;
  }

  private calculatePotentialOnGrid(): number[] {
    const potential = new Array<number>( this.gridPoints );
    for ( let i = 0; i < this.gridPoints; i++ ) {
      potential[ i ] = this.potentialFunction( this.gridPositions[ i ] );
    }
    return potential;
  }

  private isNode( psi1: number, psi2: number ): boolean {
    return psi1 * psi2 < 0 &&
           Math.abs( psi1 ) > this.waveFunctionTolerance &&
           Math.abs( psi2 ) > this.waveFunctionTolerance;
  }

  private calculateLogDerivative( psiBefore: number, psiAt: number, psiAfter: number ): number {
    if ( Math.abs( psiAt ) < this.waveFunctionTolerance ) {
      return 0;
    }
    return ( psiAfter - psiBefore ) / ( 2.0 * this.deltaX * psiAt );
  }

  private findOptimalMatchingPoint( energy: number ): number {
    const turningPoints: number[] = [];
    for ( let i = 1; i < this.gridPoints - 1; i++ ) {
      if ( this.potentialEnergies[ i ] <= energy && this.potentialEnergies[ i + 1 ] > energy ) {
        turningPoints.push( i );
      }
    }

    if ( turningPoints.length >= 2 ) {
      return turningPoints[ Math.floor( turningPoints.length / 2 ) ];
    }

    return Math.floor( this.gridPoints * MATCHING_POINT_FRACTION );
  }
}

/**
 * Functional API wrapper
 */
export function solveQuantumBound(
  potential: PotentialFunction,
  mass: number,
  numStates: number,
  gridConfig: GridConfig,
  energyMin?: number,
  energyMax?: number,
  config?: SolverConfig
): BoundStateResult {
  const { xMin, xMax, numPoints } = gridConfig;

  const solver = new QuantumBoundStateSolver( mass, xMin, xMax, numPoints, potential, config );
  const states = solver.findMultipleEigenstates( numStates );

  const energies: number[] = [];
  const wavefunctions: number[][] = [];

  for ( const state of states ) {
    if ( energyMin !== undefined && state.energy < energyMin ) { continue; }
    if ( energyMax !== undefined && state.energy > energyMax ) { continue; }

    energies.push( state.energy );
    wavefunctions.push( state.waveFunction );
  }

  return {
    energies: energies,
    wavefunctions: wavefunctions,
    xGrid: solver.getGridPositions(),
    method: 'numerov'
  };
}

quantumBoundStates.register( 'QuantumBoundStateSolver', { QuantumBoundStateSolver: QuantumBoundStateSolver, solveQuantumBound: solveQuantumBound } );
