# Numerov Solver Architecture

This document describes the modular architecture of the Numerov solver implementation for solving the 1D time-independent Schrödinger equation.

**Related Documentation:**
- [README.md](./README.md) - Quick start guide and API overview

## Overview

The Numerov solver has been decomposed into five specialized classes, each responsible for a specific aspect of the solution process:

```
NumerovSolver.ts (Main API)
    ├── NumerovIntegrator.ts          (Integration)
    ├── SymmetricNumerovIntegrator.ts (Symmetric integration)
    ├── EnergyRefiner.ts              (Energy refinement)
    ├── WavefunctionNormalizer.ts     (Normalization)
    └── NumerovSolverClass.ts         (Orchestration)
```

## Class Descriptions

### 1. NumerovIntegrator
**Responsibility**: Integrates the Schrödinger equation using the Numerov method.

**Key Methods**:
- `integrate(E, V, grid)` - Performs forward integration

**Features**:
- Implements 6th-order accurate Numerov formula
- Handles divergence detection
- Calculates k²(x) = 2m(E - V(x))/ℏ²

**Usage**:
```typescript
const grid = new XGrid(xMin, xMax, numPoints);
const integrator = new NumerovIntegrator(mass);
const psi = integrator.integrate(energy, potential, grid);
```

### 2. SymmetricNumerovIntegrator
**Responsibility**: Handles integration for symmetric potentials using parity.

**Key Methods**:
- `integrateFromCenter(E, V, grid, parity)` - Integrates from x=0 using symmetry

**Features**:
- Exploits V(-x) = V(x) symmetry
- Supports symmetric (even) and antisymmetric (odd) states
- Only integrates half the domain (more efficient)

**Usage**:
```typescript
const grid = new XGrid(xMin, xMax, numPoints);
const symIntegrator = new SymmetricNumerovIntegrator(mass);
const psi = symIntegrator.integrateFromCenter(energy, potential, grid, 'symmetric');
```

### 3. EnergyRefiner
**Responsibility**: Refines energy eigenvalues using bisection method.

**Key Methods**:
- `refine(E1, E2, V, grid)` - Refines energy within bounds
- `estimateIterations(E1, E2)` - Estimates refinement iterations
- `areValidBounds(E1, E2)` - Validates energy bounds

**Features**:
- Bisection method for root finding
- Configurable tolerance
- Searches for ψ(x_max) = 0 condition

**Usage**:
```typescript
const grid = new XGrid(xMin, xMax, numPoints);
const refiner = new EnergyRefiner(integrator, tolerance);
const refinedEnergy = refiner.refine(E_lower, E_upper, potential, grid);
```

### 4. WavefunctionNormalizer
**Responsibility**: Normalizes wavefunctions to ensure ∫|ψ|² dx = 1.

**Key Methods**:
- `normalize(psi, dx)` - Normalizes wavefunction
- `calculateNorm(psi, dx)` - Calculates ∫|ψ|² dx
- `isNormalized(psi, dx, tolerance)` - Checks if normalized

**Features**:
- Three normalization methods:
  - Trapezoidal rule (O(h²) accuracy)
  - Simpson's rule (O(h⁴) accuracy)
  - Max normalization (for visualization)

**Usage**:
```typescript
const normalizer = new WavefunctionNormalizer('simpson');
const normalizedPsi = normalizer.normalize(psi, dx);
```

### 5. NumerovSolverClass
**Responsibility**: Orchestrates all components to solve for bound states.

**Key Methods**:
- `solve(potential, numStates, gridConfig, energyMin, energyMax)` - Main solver
- `solveSymmetric(potential, numStates, gridConfig, energyMin, energyMax, parity)` - Symmetric solver

**Features**:
- Coordinates integration, refinement, and normalization
- Shooting method for finding eigenvalues
- Configurable normalization and tolerance
- Handles both general and symmetric potentials

**Usage**:
```typescript
const solver = new NumerovSolverClass(mass, {
  energyTolerance: 1e-24,
  normalizationMethod: 'simpson'
});

const result = solver.solve(potential, numStates, gridConfig, energyMin, energyMax);
```

## Main API (NumerovSolver.ts)

The main `NumerovSolver.ts` file provides:
1. **Functional API**: Simple function call for quick usage
2. **Class exports**: Access to all component classes
3. **Backward compatibility**: Maintains original API

### Functional API Example:
```typescript
import { solveNumerov } from './NumerovSolver.js';

const result = solveNumerov(
  potential,
  QuantumConstants.ELECTRON_MASS,
  3,  // Find first 3 states
  { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 },
  energyMin,
  energyMax
);
```

### Object-Oriented API Example:
```typescript
import { NumerovSolverClass } from './NumerovSolver.js';

const solver = new NumerovSolverClass(
  QuantumConstants.ELECTRON_MASS,
  {
    energyTolerance: 1e-24,
    normalizationMethod: 'simpson'
  }
);

const result = solver.solve(potential, 3, gridConfig, energyMin, energyMax);
```

### Component Access Example:
```typescript
import {
  NumerovIntegrator,
  EnergyRefiner,
  WavefunctionNormalizer
} from './NumerovSolver.js';

// Use individual components
const integrator = new NumerovIntegrator(mass);
const refiner = new EnergyRefiner(integrator);
const normalizer = new WavefunctionNormalizer('simpson');
```

## Benefits of Modular Architecture

1. **Separation of Concerns**: Each class has a single, well-defined responsibility
2. **Testability**: Each component can be tested independently
3. **Reusability**: Components can be used in different contexts
4. **Maintainability**: Changes to one component don't affect others
5. **Extensibility**: New integration methods or normalization schemes can be added easily
6. **Configurability**: Different components can be swapped or configured as needed

## Algorithm Flow

```
1. NumerovSolverClass.solve()
   ├─> Generate spatial grid
   ├─> Evaluate potential V(x)
   └─> For each energy in range:
       ├─> NumerovIntegrator.integrate()  (get ψ(x))
       ├─> Check for sign change in ψ(x_max)
       ├─> If sign change:
       │   ├─> EnergyRefiner.refine()  (bisection)
       │   ├─> NumerovIntegrator.integrate()  (final ψ)
       │   └─> WavefunctionNormalizer.normalize()
       └─> Return BoundStateResult
```

## Testing

Each class should be tested independently:

```typescript
// Test NumerovIntegrator
const grid = new XGrid(xMin, xMax, numPoints);
const integrator = new NumerovIntegrator(ELECTRON_MASS);
const psi = integrator.integrate(energy, potential, grid);
assert(psi.length === grid.getLength());

// Test EnergyRefiner
const refiner = new EnergyRefiner(integrator, 1e-10);
const refined = refiner.refine(E1, E2, potential, grid);
assert(Math.abs(refined - expected) < tolerance);

// Test WavefunctionNormalizer
const normalizer = new WavefunctionNormalizer('simpson');
const normalized = normalizer.normalize(psi, grid.getDx());
assert(normalizer.isNormalized(normalized, grid.getDx()));
```

## Performance Considerations

- **NumerovIntegrator**: O(N) where N is number of grid points
- **EnergyRefiner**: O(log(ΔE/ε)) iterations, each requiring O(N) integration
- **WavefunctionNormalizer**: O(N) for normalization
- **Overall**: O(M × log(ΔE/ε) × N) where M is number of states
