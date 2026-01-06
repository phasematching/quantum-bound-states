// Copyright 2026, University of Colorado Boulder

/**
 * NumerovSolver orchestrates the solution of the 1D time-independent Schrödinger equation
 * using the Numerov method. This is the main solver class that coordinates the integration,
 * energy refinement, and normalization components.
 *
 * Architecture:
 * - NumerovIntegrator: Handles forward integration
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
};

export default class NumerovSolverClass {

    // Number of energy steps for scanning in the shooting method
    // This is a parameter that affect strongly the performance. A larger value make the energy search moe  robust
    private static readonly ENERGY_SCAN_STEPS = 200;

    private readonly integrator: NumerovIntegrator;
    private readonly energyRefiner: EnergyRefiner;
    private readonly normalizer: WavefunctionNormalizer;

    /**
     * @param mass - Particle mass in kg
     * @param options - Optional solver configuration
     */
    public constructor( mass: number, options?: NumerovSolverClassOptions ) {
        // Create component instances
        this.integrator = new NumerovIntegrator( mass );

        // If energyTolerance is provided, it's absolute (in Joules); otherwise use default relative tolerance
        const energyRefinerOptions = options?.energyTolerance !== undefined ?
            { tolerance: options.energyTolerance, isRelative: false }
            : {};
        this.energyRefiner = new EnergyRefiner( this.integrator, energyRefinerOptions );

        this.normalizer = new WavefunctionNormalizer(
            options?.normalizationMethod ?? 'trapezoidal'
        );
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
