# Quantum Bound States - Model Architecture

This document provides an architectural overview of the model classes in `js/common/model/` for future developers maintaining this simulation.

## Purpose

The model solves the 1D time-independent Schrödinger equation (TISE):

```
-ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ
```

to find bound state energies and wavefunctions for arbitrary potential energy functions V(x).

## Architecture Overview

The implementation follows a modular, component-based architecture where specialized classes handle distinct responsibilities:

```
User API
   └── NumerovSolver.ts (exports solveNumerov function)
         └── NumerovSolverClass (orchestrator)
               ├── NumerovIntegrator (integration)
               ├── EnergyRefiner (eigenvalue refinement)
               └── WavefunctionNormalizer (probability normalization)

Supporting Classes
   ├── XGrid (spatial grid)
   ├── FundamentalConstants (physical constants)
   ├── PotentialFunction (type definitions)
   └── analytical-solutions/ (validation)
         ├── HarmonicOscillatorSolution
         ├── InfiniteSquareWellSolution
         ├── FiniteSquareWellSolution
         └── math-utilities
```

## The Numerov Method

### What It Is

The Numerov method is a specialized numerical technique for solving second-order differential equations of the form:

```
d²y/dx² = -k²(x)y(x)
```

This matches the structure of the time-independent Schrödinger equation when rewritten as:

```
d²ψ/dx² = -k²(x)ψ(x)    where k²(x) = 2m[E - V(x)]/ℏ²
```

The method uses a three-point stencil to advance the solution:

```
ψ_(j+1) = [(2 - 10f_j)ψ_j - (1 + f_(j-1))ψ_(j-1)] / (1 + f_(j+1))
```

where `f_j = (h²/12)k²(x_j)` are pre-computed factors and `h = dx` is the grid spacing.

### Why It's Used

The Numerov method is particularly well-suited for quantum mechanics problems:

**1. High Accuracy**
- Achieves O(h⁶) accuracy (6th-order) compared to O(h²) for standard finite differences
- This means we can use coarser grids for the same precision, saving memory and time

**2. Tailored for the Schrödinger Equation**
- Designed specifically for equations lacking a first derivative term. The TISE has no dψ/dx term, making Numerov optimal
- Generic Runge-Kutta methods don't exploit this structure

**3. Numerical Stability**
- Maintains amplitude correctly over many integration steps
- Doesn't introduce artificial damping or growth
- Critical for finding eigenvalues where ψ must vanish at boundaries

**4. Simplicity**
- Single formula, no complex substeps
- Easy to implement and understand
- Minimal computational overhead per step

### Trade-offs

**Advantages:**
- Superior accuracy-to-cost ratio for our problem
- Simple implementation

**Limitations:**
- Requires uniform grid spacing

Despite these limitations, Numerov is the standard choice for 1D quantum eigenvalue problems and has been extensively validated in the literature.

## Core Components

### NumerovSolver.ts
**Purpose**: Main API entry point
**Responsibility**: Provides the functional API for users

This is the top-level module that exports the `solveNumerov()` function and all component classes. It serves as the public API surface and delegates to NumerovSolverClass for the actual computation.

---

### NumerovSolverClass.ts
**Purpose**: Solution orchestrator
**Responsibility**: Coordinates the solving process using the shooting method

This class implements the shooting method algorithm:
1. Scans an energy range with a coarse step size (200 steps by default)
2. Detects eigenvalues by finding sign changes in ψ(x_max)
3. Refines each eigenvalue using bisection
4. Normalizes the corresponding wavefunction

---

### NumerovIntegrator.ts
**Purpose**: Numerov integrator
**Responsibility**: Integrates the Schrödinger equation for arbitrary potentials

This class implements forward integration from the left boundary to the right boundary. It contains the core mathematical methods:

**Mathematical Methods:**
- `calculateK2()`: Computes k²(x) = 2m(E - V(x))/ℏ²
- `calculateNumerovFactors()`: Computes f_j = (h²/12) × k²(x_j)
- `numerovStep()`: Executes one Numerov integration step
- `fillDivergent()`: Marks non-bound states

**Integration Process (three steps):**

1. **Initialization** (`setInitialConditions`): Sets ψ(x_min) = 0 and intelligently chooses ψ(x₁) based on whether the region is classically allowed (oscillatory) or forbidden (exponential decay)

2. **Integration** (`integrateForward`): Applies the Numerov formula iteratively from left to right with divergence detection

3. **Return**: Provides the full wavefunction array

The divergence threshold (1e300) is set very high to accommodate finite potential barriers that cause large but finite exponential growth.

**Note**: A symmetric solver implementation that exploits parity for symmetric potentials (V(-x) = V(x)) is available on the `symmetricSolver` branch. This optimized version integrates only half the domain, providing 2× speedup and improved accuracy for symmetric potentials.

---

### EnergyRefiner.ts
**Purpose**: Eigenvalue refinement
**Responsibility**: Finds precise energy where ψ(x_max) = 0 using bisection

After the shooting method detects a sign change indicating a bound state, this class refines the energy to high precision. It uses bisection on the interval [E_low, E_high] and stops when the bracket width falls below a tolerance.

**Key insight**: The wavefunction endpoint ψ(x_max) is a monotonic function of energy near an eigenvalue, so bisection is guaranteed to converge.

**When to modify**: When changing convergence criteria, adding alternative root-finding methods, or adjusting tolerance strategies.

---

### WavefunctionNormalizer.ts
**Purpose**: Probability normalization
**Responsibility**: Ensures ∫|ψ|² dx = 1

After finding an eigenstate, the wavefunction must be normalized so its integral equals unity (unit probability). This class supports multiple numerical integration methods:

- **Trapezoidal** (default): Simple and robust, O(h²) accuracy
- **Simpson's**: Higher accuracy O(h⁴), requires odd number of points
- **Max**: Sets max|ψ| = 1 (not true normalization, used for visualization)

The class also provides validation through `isNormalized()` to verify normalization within a tolerance.

---

### XGrid.ts
**Purpose**: Spatial discretization
**Responsibility**: Manages the spatial grid x[0], x[1], ..., x[N-1]

The grid is uniform with spacing dx = (xMax - xMin) / (numPoints - 1).

---

### FundamentalConstants.ts
**Purpose**: Physical constants
**Responsibility**: Provides SI unit constants

All calculations in the model use SI units internally.

---

### PotentialFunction.ts
**Purpose**: Type definitions
**Responsibility**: TypeScript interfaces for inputs and outputs

Key types:
- `PotentialFunction`: (x: number) => number
- `GridConfig`: {xMin, xMax, numPoints}
- `BoundStateResult`: {energies, wavefunctions, xGrid, method}
- `Parity`: 'symmetric' | 'antisymmetric'

---

## Analytical Solutions (analytical-solutions/)

This subdirectory contains exact analytical solutions for quantum systems that can be solved mathematically. These modules serve two purposes:

1. **Validation**: Test the numerical solver against known exact solutions
2. **Reference**: Provide baseline for comparison in tests

### HarmonicOscillatorSolution.ts
**Purpose**: Exact solutions for the quantum harmonic oscillator
**Key formulas**:
- Energy eigenvalues: E_n = ℏω(n + ½) for n = 0, 1, 2, ...
- Wavefunctions: Hermite polynomials × Gaussian envelope
- All states are bound (infinite tower of levels)

Used to validate the Numerov solver for a symmetric, smooth potential.

---

### InfiniteSquareWellSolution.ts
**Purpose**: Exact solutions for particle in a box
**Key formulas**:
- Energy eigenvalues: E_n = n²π²ℏ²/(2mL²) for n = 1, 2, 3, ...
- Wavefunctions: ψ_n(x) = √(2/L) sin(nπ(x-L/2)/L)
- Hard boundary conditions (ψ = 0 at walls)

Used to validate the solver for discontinuous potentials and hard boundaries.

---

### FiniteSquareWellSolution.ts
**Purpose**: Exact solutions for finite square well
**Key formulas**:
- Transcendental equations for bound states (must be solved numerically)
- Exponentially decaying tails in classically forbidden regions
- Finite number of bound states (depends on well depth)

Used to validate the solver for potentials with both bound and unbound regions.

---

### math-utilities.ts
**Purpose**: Mathematical helper functions
**Contents**:
- Special functions (Hermite polynomials, factorials)
- Numerical utilities for analytical solutions
- Shared mathematical operations

---

## Algorithm Flow

The complete solution process follows this sequence:

1. **Setup Phase**
   - Create spatial grid (XGrid)
   - Evaluate V(x) at all grid points
   - Initialize solver components

2. **Scanning Phase** (NumerovSolverClass)
   - Scan energy range with step ΔE = (E_max - E_min) / 1000
   - For each energy E:
     - Integrate TISE to get ψ(x)
     - Check sign of ψ(x_max)
     - If sign changes from previous step → eigenvalue detected

3. **Refinement Phase** (EnergyRefiner)
   - Use bisection on [E_prev, E_current] interval
   - Iterate until |E_high - E_low| < tolerance
   - Return refined eigenvalue

4. **Finalization Phase**
   - Integrate at refined energy to get final ψ(x)
   - Normalize using WavefunctionNormalizer
   - Add to results

5. **Return**
   - Package energies, wavefunctions, and grid into BoundStateResult

## Performance Characteristics

**Time Complexity**: O(M × log(ΔE/ε) × N)
- M = number of states to find
- ΔE = energy range width
- ε = energy tolerance
- N = number of grid points

**Memory**: O(N) per wavefunction, O(M × N) total for M states

## Common Maintenance Tasks

### Adding a New Potential Type
1. Define the potential function V(x)
2. Determine appropriate energy range [E_min, E_max]
3. Choose grid resolution (rule of thumb: 10-20 points per de Broglie wavelength)
4. Call solveNumerov() with parameters

### Changing Boundary Conditions
1. For left boundary: Modify `setInitialConditions()` in NumerovIntegrator.ts
2. For symmetric potentials: Modify `setInitialConditions()` in SymmetricNumerovIntegrator.ts
3. Ensure new conditions satisfy the Schrödinger equation
4. Add tests for new boundary scenarios

## Testing Strategy

The model is validated against analytical solutions found in `js/common/model/analytical-solutions/`:

- **Harmonic Oscillator** (HarmonicOscillatorSolution.ts): E_n = ℏω(n + ½) for n = 0, 1, 2, ...
- **Infinite Square Well** (InfiniteSquareWellSolution.ts): E_n = n²π²ℏ²/(2mL²) for n = 1, 2, 3, ...
- **Finite Square Well** (FiniteSquareWellSolution.ts): Transcendental equations for bound states
- **Wavefunction Normalization**: ∫|ψ|² dx = 1 for all states
- **Node Counting**: nth excited state has n nodes

Tests are in `test/NumerovSolver.test.js` using Node.js test runner. Each test compares numerical results from the Numerov solver against exact analytical solutions, ensuring accuracy within acceptable tolerances (typically <0.1% for energies).

