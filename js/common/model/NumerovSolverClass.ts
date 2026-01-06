// Copyright 2026, University of Colorado Boulder

/**
 * NumerovSolver orchestrates the solution of the 1D time-independent Schrödinger equation
 * using the Numerov method. This is the main solver class that coordinates the integration,
 * energy refinement, and normalization components.
 *
 * Architecture:
 * - NumerovIntegrator: Handles forward integration
 * - SymmetricNumerovIntegrator: Handles symmetric potentials with parity
 * - EnergyRefiner: Refines energy eigenvalues using bisection
 * - WavefunctionNormalizer: Normalizes wavefunctions
 *
 * The TISE is: -ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ
 *
 *
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';
import { BoundStateResult, GridConfig, PotentialFunction } from './PotentialFunction.js';
import NumerovIntegrator from './NumerovIntegrator.js';
import SymmetricNumerovIntegrator, { Parity } from './SymmetricNumerovIntegrator.js';
import EnergyRefiner from './EnergyRefiner.js';
import WavefunctionNormalizer, { NormalizationMethod } from './WavefunctionNormalizer.js';
import XGrid from './XGrid.js';

/**
 * Configuration options for the solver.
 */
export type NumerovSolverClassOptions = {
    energyTolerance?: number;  // Optional tolerance for energy refinement (Joules).
                               // If not provided, uses relative tolerance × (bracket width)
    normalizationMethod?: NormalizationMethod;  // Method for normalization (default: 'trapezoidal')
    useSymmetry?: boolean;  // Whether to use symmetric integration for symmetric potentials (default: false)
};

export default class NumerovSolverClass {

    // Number of energy steps for scanning in the shooting method
    // This is a parameter that affect strongly the performance. A larger value make the energy search moe  robust
    private static readonly ENERGY_SCAN_STEPS = 200;

    private readonly integrator: NumerovIntegrator;
    private readonly symmetricIntegrator: SymmetricNumerovIntegrator;
    private readonly energyRefiner: EnergyRefiner;
    private readonly normalizer: WavefunctionNormalizer;
    private readonly useSymmetry: boolean;
    private readonly energyToleranceOverride?: number;

    /**
     * @param mass - Particle mass in kg
     * @param options - Optional solver configuration
     */
    public constructor( mass: number, options?: NumerovSolverClassOptions ) {
        // Create component instances
        this.integrator = new NumerovIntegrator( mass );
        this.symmetricIntegrator = new SymmetricNumerovIntegrator( mass );
        this.energyToleranceOverride = options?.energyTolerance;

        // If energyTolerance is provided, it's absolute (in Joules); otherwise use default relative tolerance
        const energyRefinerOptions = options?.energyTolerance !== undefined ?
            { tolerance: options.energyTolerance, isRelative: false }
            : {};
        this.energyRefiner = new EnergyRefiner( this.integrator, energyRefinerOptions );

        this.normalizer = new WavefunctionNormalizer(
            options?.normalizationMethod ?? 'trapezoidal'
        );
        this.useSymmetry = options?.useSymmetry ?? false;
    }

    /**
     * Solve the 1D Schrödinger equation using the Numerov method.
     * Main public API that finds all bound states within the energy bounds.
     *
     * Uses the shooting method: scans energy range looking for energies where
     * the wavefunction satisfies boundary conditions (ψ → 0 at boundaries).
     * Detects eigenvalues by finding sign changes in ψ(x_max).
     *
     * @param potential - Function V(x) that returns potential energy in Joules
     * @param gridConfig - Grid configuration {xMin, xMax, numPoints}
     * @param energyMin - Minimum energy to search (Joules)
     * @param energyMax - Maximum energy to search (Joules)
     * @returns Bound state results containing energies, wavefunctions, and grid
     *
     * @example
     * // Solve harmonic oscillator
     * const omega = 1e15;  // rad/s
     * const mass = FundamentalConstants.ELECTRON_MASS;
     * const potential = ( x: number ) => 0.5 * mass * omega * omega * x * x;
     *
     * const solver = new NumerovSolverClass( mass );
     * const result = solver.solve(
     *   potential,
     *   { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 },
     *   0,  // Ground state is above 0
     *   20 * FundamentalConstants.EV_TO_JOULES
     * );
     *
     * // Access results
     * console.log( 'Ground state energy:', result.energies[ 0 ] );
     * console.log( 'First excited energy:', result.energies[ 1 ] );
     */
    public solve(
        potential: PotentialFunction,
        gridConfig: GridConfig,
        energyMin: number,
        energyMax: number
    ): BoundStateResult {
        const { xMin, xMax, numPoints } = gridConfig;

        // Create grid
        const grid = new XGrid( xMin, xMax, numPoints );

        // Generate grid array and evaluate potential
        const xGridArray = grid.getArray();
        const V = this.evaluatePotential( potential, xGridArray );

        // Find bound states
        const { energies, wavefunctions } = this.findBoundStates(
            V,
            grid,
            energyMin,
            energyMax
        );

        return {
            energies: energies,
            wavefunctions: wavefunctions,
            xGridArray: xGridArray,
            method: 'numerov'
        };
    }

    /**
     * Solve using symmetric integration for a symmetric potential.
     * Uses parity to integrate only half the domain, improving both efficiency and accuracy.
     *
     * For symmetric potentials V(-x) = V(x), all eigenstates have definite parity:
     * - Symmetric (even): ψ(-x) = ψ(x), so ψ'(0) = 0
     * - Antisymmetric (odd): ψ(-x) = -ψ(x), so ψ(0) = 0
     *
     * Ground state is always symmetric, first excited is antisymmetric, etc.
     *
     * @param potential - Symmetric potential function V(x) where V(-x) = V(x)
     * @param gridConfig - Grid configuration (should be symmetric around x=0)
     * @param energyMin - Minimum energy to search
     * @param energyMax - Maximum energy to search
     * @param parity - Symmetry type ('symmetric' for even, 'antisymmetric' for odd)
     * @returns Bound state results
     *
     * @example
     * // Find even states of harmonic oscillator (n=0,2,4,...)
     * const evenStates = solver.solveSymmetric(
     *   harmonicPotential,
     *   { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 },
     *   0,
     *   20 * FundamentalConstants.EV_TO_JOULES,
     *   'symmetric'
     * );
     *
     * // Find odd states (n=1,3,5,...)
     * const oddStates = solver.solveSymmetric(
     *   harmonicPotential,
     *   { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 },
     *   0,
     *   20 * FundamentalConstants.EV_TO_JOULES,
     *   'antisymmetric'
     * );
     */
    public solveSymmetric(
        potential: PotentialFunction,
        gridConfig: GridConfig,
        energyMin: number,
        energyMax: number,
        parity: Parity
    ): BoundStateResult {
        const { xMin, xMax, numPoints } = gridConfig;

        // Create grid
        const grid = new XGrid( xMin, xMax, numPoints );

        // Generate grid array and evaluate potential
        const xGridArray = grid.getArray();
        const V = this.evaluatePotential( potential, xGridArray );

        const { energies, wavefunctions } = this.findBoundStatesSymmetric(
            V,
            grid,
            energyMin,
            energyMax,
            parity
        );

        return {
            energies: energies,
            wavefunctions: wavefunctions,
            xGridArray: xGridArray,
            method: 'numerov-symmetric'
        };
    }

    /**
     * Find bound states using standard shooting method.
     */
    private findBoundStates(
        V: number[],
        grid: XGrid,
        energyMin: number,
        energyMax: number
    ): { energies: number[]; wavefunctions: number[][] } {
        const energies: number[] = [];
        const wavefunctions: number[][] = [];

        // Scan energy range looking for sign changes
        const energyStep = ( energyMax - energyMin ) / NumerovSolverClass.ENERGY_SCAN_STEPS;

        // Initialize prevSign by integrating at energyMin
        const psi0 = this.integrator.integrate( energyMin, V, grid );
        const endValue0 = this.getEndValue( psi0 );
        let prevSign = Math.sign( endValue0 );
        let prevEnergy = energyMin;

        for (
            let E = energyMin + energyStep;
            E <= energyMax;
            E += energyStep
        ) {
            const psi = this.integrator.integrate( E, V, grid );
            const endValue = this.getEndValue( psi );

            // Check for sign change (indicates bound state)
            const currentSign = Math.sign( endValue );

            if ( currentSign !== 0 && prevSign !== 0 && currentSign !== prevSign ) {
                // Refine energy
                const refinedEnergy = this.energyRefiner.refine(
                    prevEnergy,
                    E,
                    V,
                    grid
                );
                energies.push( refinedEnergy );

                // Calculate and normalize wavefunction
                const refinedPsi = this.integrator.integrate( refinedEnergy, V, grid );
                const normalizedPsi = this.normalizer.normalize( refinedPsi, grid.getDx() );
                wavefunctions.push( normalizedPsi );
            }

            if ( currentSign !== 0 ) {
                prevSign = currentSign;
                prevEnergy = E;
            }
        }

        return { energies: energies, wavefunctions: wavefunctions };
    }

    /**
     * Find bound states for symmetric potentials using parity.
     */
    private findBoundStatesSymmetric(
        V: number[],
        grid: XGrid,
        energyMin: number,
        energyMax: number,
        parity: Parity
    ): { energies: number[]; wavefunctions: number[][] } {
        const energies: number[] = [];
        const wavefunctions: number[][] = [];

        const energyStep = ( energyMax - energyMin ) / 1000;

        // Initialize prevSign by integrating at energyMin
        const psi0 = this.symmetricIntegrator.integrateFromCenter( energyMin, V, grid, parity );
        const endValue0 = this.getEndValue( psi0 );
        let prevSign = Math.sign( endValue0 );
        let prevEnergy = energyMin;

        for (
            let E = energyMin + energyStep;
            E <= energyMax;
            E += energyStep
        ) {
            const psi = this.symmetricIntegrator.integrateFromCenter( E, V, grid, parity );
            const endValue = this.getEndValue( psi );

            const currentSign = Math.sign( endValue );
            if ( currentSign !== 0 && prevSign !== 0 && currentSign !== prevSign ) {
                // For symmetric case, we need a custom refiner that uses symmetric integration
                const refinedEnergy = this.refineEnergySymmetric(
                    prevEnergy,
                    E,
                    V,
                    grid,
                    parity,
                    this.energyToleranceOverride
                );
                energies.push( refinedEnergy );

                const refinedPsi = this.symmetricIntegrator.integrateFromCenter(
                    refinedEnergy,
                    V,
                    grid,
                    parity
                );
                const normalizedPsi = this.normalizer.normalize( refinedPsi, grid.getDx() );
                wavefunctions.push( normalizedPsi );
            }

            if ( currentSign !== 0 ) {
                prevSign = currentSign;
                prevEnergy = E;
            }
        }

        return { energies: energies, wavefunctions: wavefunctions };
    }

    /**
     * Refine energy for symmetric potentials.
     * Uses symmetric integration during bisection with adaptive tolerance.
     *
     * Physical motivation: Same as EnergyRefiner - use relative precision of 10^-8
     * times the bracket width to ensure eigenvalue accuracy to ~10 significant figures.
     */
    private refineEnergySymmetric(
        E1: number,
        E2: number,
        V: number[],
        grid: XGrid,
        parity: Parity,
        toleranceOverride?: number
    ): number {
        const N = grid.getNumberOfPoints();

        // Adaptive tolerance: 10^-8 × (bracket width) ensures high precision
        // relative to the energy scale of the problem
        const relativePrecision = 1e-8;
        const tolerance = toleranceOverride ?? relativePrecision * Math.abs( E2 - E1 );

        let Elow = E1;
        let Ehigh = E2;

        while ( Ehigh - Elow > tolerance ) {
            const Emid = ( Elow + Ehigh ) / 2;

            const psiMid = this.symmetricIntegrator.integrateFromCenter( Emid, V, grid, parity );
            const psiLow = this.symmetricIntegrator.integrateFromCenter( Elow, V, grid, parity );

            const endValueMid = psiMid[ N - 1 ];
            const endValueLow = psiLow[ N - 1 ];

            if ( Math.sign( endValueMid ) === Math.sign( endValueLow ) ) {
                Elow = Emid;
            }
 else {
                Ehigh = Emid;
            }
        }

        return ( Elow + Ehigh ) / 2;
    }

    /**
     * Evaluate potential on grid.
     */
    private evaluatePotential( potential: PotentialFunction, xGridArray: number[] ): number[] {
        return xGridArray.map( potential );
    }

    /**
     * Get the wavefunction value at the end of the grid.
     */
    private getEndValue( psi: number[] ): number {
        return psi[ psi.length - 1 ];
    }
}

/**
 * Convenience function for solving with default settings.
 * Matches the original functional API.
 *
 * @param potential - Function V(x) that returns potential energy in Joules
 * @param mass - Particle mass in kg
 * @param gridConfig - Grid configuration
 * @param energyMin - Minimum energy to search (Joules)
 * @param energyMax - Maximum energy to search (Joules)
 * @returns Bound state results
 */
export function solveNumerov(
    potential: PotentialFunction,
    mass: number,
    gridConfig: GridConfig,
    energyMin: number,
    energyMax: number
): BoundStateResult {
    const solver = new NumerovSolverClass( mass );
    return solver.solve( potential, gridConfig, energyMin, energyMax );
}

quantumBoundStates.register( 'NumerovSolverClass', NumerovSolverClass );
