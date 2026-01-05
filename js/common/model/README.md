# Quantum Bound States - Common Model

This directory contains the numerical solvers and utilities for solving the 1D time-independent Schrödinger equation (TISE) and finding quantum bound states.

## Overview

The model provides a modular, well-tested implementation of the Numerov method for solving:

```
-ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ
```

where:
- `ψ(x)` is the wavefunction
- `E` is the energy eigenvalue
- `V(x)` is the potential energy function
- `m` is the particle mass
- `ℏ` is the reduced Planck constant

## Quick Start

### Basic Usage

```typescript
import { solveNumerov } from './NumerovSolver.js';
import FundamentalConstants from './FundamentalConstants.js';

// Define a potential function (e.g., harmonic oscillator)
const potential = ( x: number ) => {
  const k = 1e3; // Spring constant
  return 0.5 * k * x * x;
};

// Solve for the first 3 bound states
const result = solveNumerov(
  potential,
  FundamentalConstants.ELECTRON_MASS,
  3,  // Number of states to find
  { xMin: -5e-9, xMax: 5e-9, numPoints: 501 },
  0,  // Minimum energy
  10 * FundamentalConstants.EV_TO_JOULES  // Maximum energy
);

// Access results
console.log( 'Energies (J):', result.energies );
console.log( 'Wavefunctions:', result.wavefunctions );
console.log( 'Grid:', result.xGrid );
```

### Advanced Usage with Configuration

```typescript
import { NumerovSolverClass } from './NumerovSolver.js';

const solver = new NumerovSolverClass(
  FundamentalConstants.ELECTRON_MASS,
  {
    energyTolerance: 1e-12,  // Energy precision
    normalizationMethod: 'simpson'  // Higher accuracy normalization
  }
);

const result = solver.solve( potential, 3, gridConfig, energyMin, energyMax );
```

### Symmetric Potentials

For symmetric potentials `V(-x) = V(x)`, you can improve efficiency and accuracy:

```typescript
import { NumerovSolverClass } from './NumerovSolver.js';

const solver = new NumerovSolverClass( mass );

// Find symmetric (even) states
const evenStates = solver.solveSymmetric(
  potential,
  numStates,
  gridConfig,
  energyMin,
  energyMax,
  'symmetric'
);

// Find antisymmetric (odd) states
const oddStates = solver.solveSymmetric(
  potential,
  numStates,
  gridConfig,
  energyMin,
  energyMax,
  'antisymmetric'
);
```

## Architecture

The solver uses a modular architecture with specialized components:

```
NumerovSolver.ts (Main API)
    ├── NumerovIntegrator.ts          (Integration)
    ├── SymmetricNumerovIntegrator.ts (Symmetric potentials)
    ├── EnergyRefiner.ts              (Energy refinement)
    ├── WavefunctionNormalizer.ts     (Normalization)
    └── NumerovSolverClass.ts         (Orchestration)
```

See [NUMEROV_ARCHITECTURE.md](./NUMEROV_ARCHITECTURE.md) for detailed architecture documentation.

## Core Components

### NumerovIntegrator
Integrates the Schrödinger equation using the 6th-order accurate Numerov method.

**Key Features:**
- Forward integration from left boundary
- Automatic divergence detection
- High numerical accuracy

**Example:**
```typescript
import NumerovIntegrator from './NumerovIntegrator.js';
import XGrid from './XGrid.js';

const grid = new XGrid( xMin, xMax, numPoints );
const integrator = new NumerovIntegrator( mass );
const psi = integrator.integrate( energy, potentialArray, grid );
```

### SymmetricNumerovIntegrator
Exploits parity symmetry for symmetric potentials to improve efficiency.

**Key Features:**
- Only integrates half the domain
- Supports even and odd states
- Improved accuracy from symmetry

**Example:**
```typescript
import SymmetricNumerovIntegrator from './SymmetricNumerovIntegrator.js';
import XGrid from './XGrid.js';

const grid = new XGrid( xMin, xMax, numPoints );
const integrator = new SymmetricNumerovIntegrator( mass );
const psi = integrator.integrateFromCenter( energy, V, grid, 'symmetric' );
```

### EnergyRefiner
Refines energy eigenvalues using bisection to find precise energies where `ψ(x_max) = 0`.

**Key Features:**
- Bisection method for root finding
- Configurable tolerance
- Iteration estimation

**Example:**
```typescript
import EnergyRefiner from './EnergyRefiner.js';
import XGrid from './XGrid.js';

const grid = new XGrid( xMin, xMax, numPoints );
const refiner = new EnergyRefiner( integrator, 1e-21 );
const refinedEnergy = refiner.refine( E_lower, E_upper, V, grid );
```

### WavefunctionNormalizer
Normalizes wavefunctions to ensure `∫|ψ|² dx = 1`.

**Key Features:**
- Multiple normalization methods (trapezoidal, Simpson's, max)
- Configurable method selection
- Norm calculation and validation

**Example:**
```typescript
import WavefunctionNormalizer from './WavefunctionNormalizer.js';

const normalizer = new WavefunctionNormalizer( 'simpson' );
const normalized = normalizer.normalize( psi, dx );
const isNorm = normalizer.isNormalized( normalized, dx );
```

## Supporting Files

### FundamentalConstants
Physical constants in SI units:

```typescript
import FundamentalConstants from './FundamentalConstants.js';

const hbar = FundamentalConstants.HBAR;  // J⋅s
const electronMass = FundamentalConstants.ELECTRON_MASS;  // kg
const eV = FundamentalConstants.EV_TO_JOULES;  // Conversion factor
```

### PotentialFunction
Type definitions for potentials and results:

```typescript
import type { PotentialFunction, GridConfig, BoundStateResult } from './PotentialFunction.js';

const potential: PotentialFunction = ( x: number ) => /* ... */;
const grid: GridConfig = { xMin: -5e-9, xMax: 5e-9, numPoints: 501 };
```

## Testing

The solver has been extensively tested against analytical solutions:

- **Harmonic Oscillator**: 20 states, < 0.5% error
- **Infinite Square Well**: 20 states, < 5% error
- **Normalization**: All states properly normalized
- **Node Counting**: Correct node count for all states

See [TESTING.md](./TESTING.md) for testing documentation and [TEST_RESULTS.md](./TEST_RESULTS.md) for detailed results.

### Running Tests

```bash
# Start development server
npx grunt dev-server

# Navigate to test page in browser
# Or open quantum-bound-states-tests.html directly
```

## Units

All calculations use **SI units**:

- **Distance**: meters (m)
- **Energy**: joules (J)
- **Mass**: kilograms (kg)
- **Time**: seconds (s)

Use conversion factors from `FundamentalConstants` when working with other units:

```typescript
// Convert eV to Joules
const energyJ = 5.0 * FundamentalConstants.EV_TO_JOULES;

// Convert nm to meters
const positionM = 2.5 * FundamentalConstants.NM_TO_METERS;
```

## Algorithm Details

The solver uses the **shooting method** with **Numerov integration**:

1. **Grid Generation**: Create uniform spatial grid
2. **Energy Scanning**: Test energies in range [E_min, E_max]
3. **Integration**: For each energy, integrate the TISE using Numerov method
4. **Eigenvalue Detection**: Look for sign changes in `ψ(x_max)`
5. **Energy Refinement**: Use bisection to refine eigenvalue
6. **Normalization**: Normalize wavefunction to unit probability

### Numerov Formula

The 6th-order accurate Numerov formula is:

```
ψ_(j+1) = [(2 - 10f_j)ψ_j - (1+f_(j-1))ψ_(j-1)] / (1+f_(j+1))
```

where:
- `f_j = (h²/12) k²(x_j)`
- `k²(x) = 2m(E - V(x))/ℏ²`
- `h = dx` (grid spacing)

## Performance

- **Complexity**: O(M × log(ΔE/ε) × N)
  - M = number of states
  - ΔE = energy range
  - ε = energy tolerance
  - N = number of grid points

- **Typical Performance**: Finding 20 states in ~10-100ms (browser JavaScript)

## Common Potential Functions

### Harmonic Oscillator
```typescript
const harmonicOscillator = ( x: number, omega: number, mass: number ) => {
  const k = mass * omega * omega;
  return 0.5 * k * x * x;
};
```

### Infinite Square Well
```typescript
const infiniteSquareWell = ( x: number, width: number, barrierHeight: number ) => {
  return Math.abs( x ) < width / 2 ? 0 : barrierHeight;
};
```

### Finite Square Well
```typescript
const finiteSquareWell = ( x: number, width: number, depth: number ) => {
  return Math.abs( x ) < width / 2 ? -depth : 0;
};
```

### Coulomb Potential (1D approximation)
```typescript
const coulomb = ( x: number, strength: number ) => {
  const epsilon = 1e-12;  // Avoid singularity
  return -strength / ( Math.abs( x ) + epsilon );
};
```

## File Organization

```
common/model/
├── README.md                          (This file)
├── NUMEROV_ARCHITECTURE.md            (Detailed architecture)
├── TESTING.md                         (Testing guide)
├── TEST_RESULTS.md                    (Test results)
│
├── NumerovSolver.ts                   (Main API)
├── NumerovSolverClass.ts              (Orchestration)
├── NumerovIntegrator.ts               (Integration)
├── SymmetricNumerovIntegrator.ts      (Symmetric integration)
├── EnergyRefiner.ts                   (Energy refinement)
├── WavefunctionNormalizer.ts          (Normalization)
│
├── PotentialFunction.ts               (Type definitions)
├── FundamentalConstants.ts            (Physical constants)
│
├── NumerovSolverTests.ts              (QUnit tests)
└── QuantumBoundStateSolver.ts         (Deprecated - do not use)
```

## Best Practices

1. **Grid Resolution**: Use enough points to resolve the wavefunction
   - Rule of thumb: ~10-20 points per wavelength
   - For bound states: typically 500-2000 points

2. **Energy Range**:
   - Set `energyMin` below the ground state energy
   - Set `energyMax` above the highest state of interest
   - For potential wells: `energyMin` = well depth, `energyMax` = 0

3. **Boundary Conditions**:
   - Ensure grid extends to regions where `ψ ≈ 0`
   - Typically 3-5 classical turning points from center

4. **Tolerance**:
   - Default energy tolerance (1e-20 J) is suitable for most cases
   - For visualization: 'max' normalization is clearer
   - For calculations: 'simpson' normalization is more accurate

## Known Limitations

- **1D only**: This solver handles only one-dimensional problems
- **Bound states only**: Designed for bound states (E < V(±∞))
- **Numerical precision**: Limited by floating-point arithmetic
- **Hard walls**: Infinite square wells may have ~5% error due to sharp boundaries

## References

- Numerov method: [arXiv:2203.15262](https://arxiv.org/abs/2203.15262)
- Shooting method: Numerical Recipes, Press et al.
- Quantum mechanics: Griffiths, Introduction to Quantum Mechanics

## Contributing

When modifying the solver:

1. **Maintain modularity**: Keep components focused and independent
2. **Add tests**: Validate against analytical solutions
3. **Document**: Update JSDoc and markdown files
4. **Preserve API**: Maintain backward compatibility

## License

Copyright 2026, University of Colorado Boulder
