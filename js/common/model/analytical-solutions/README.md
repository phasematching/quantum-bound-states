# Analytical Solutions for Quantum Bound States

This directory contains analytical solutions for quantum mechanical potentials that can be solved exactly. These solutions provide exact energy eigenvalues and wavefunctions, which can be used as:

1. **Benchmarks** for validating numerical solvers
2. **Fast alternatives** to numerical methods when exact solutions exist
3. **Reference implementations** for understanding quantum mechanical systems

## Available Solutions

All analytical solutions use the same API as `NumerovSolver.solve()`, taking energy bounds (energyMin, energyMax) and returning all states within that range.

### 1. Harmonic Oscillator

The quantum harmonic oscillator is one of the most important exactly solvable problems in quantum mechanics.

**Potential:** `V(x) = (1/2) * k * x²`

**Energy Eigenvalues:** `E_n = ℏω(n + 1/2)` where `ω = √(k/m)`

**Wavefunctions:** `ψ_n(x) = (1/√(2^n n!)) · (mω/πℏ)^(1/4) · exp(-mωx²/(2ℏ)) · H_n(√(mω/ℏ) x)`

where `H_n` are the Hermite polynomials.

#### Usage Example

```typescript
import { solveHarmonicOscillator } from './analytical-solutions/HarmonicOscillatorSolution.js';
import FundamentalConstants from './FundamentalConstants.js';

const mass = FundamentalConstants.ELECTRON_MASS;
const omega = 1e15; // rad/s
const springConstant = mass * omega * omega;

// API matches NumerovSolver: takes energy bounds instead of number of states
const result = solveHarmonicOscillator(
  springConstant,
  mass,
  { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 },
  0, // energyMin
  20 * FundamentalConstants.EV_TO_JOULES // energyMax
);

console.log('Ground state energy:', result.energies[0]);
console.log('Number of states found:', result.energies.length);
console.log('Ground state wavefunction:', result.wavefunctions[0]);
```

#### Comparison with Numerov Solver

The analytical solution has the same API as NumerovSolver, making it a drop-in replacement for benchmarking and validation:

```typescript
import NumerovSolverClass from './NumerovSolverClass.js';
import { solveHarmonicOscillator, createHarmonicOscillatorPotential } from './analytical-solutions/HarmonicOscillatorSolution.js';
import FundamentalConstants from './FundamentalConstants.js';

const mass = FundamentalConstants.ELECTRON_MASS;
const omega = 1e15;
const k = mass * omega * omega;
const gridConfig = { xMin: -4e-9, xMax: 4e-9, numPoints: 1001 };
const energyMin = 0;
const energyMax = 20 * FundamentalConstants.EV_TO_JOULES;

// Analytical solution
const analytical = solveHarmonicOscillator(k, mass, gridConfig, energyMin, energyMax);

// Numerical solution
const potential = createHarmonicOscillatorPotential(k);
const numerovSolver = new NumerovSolverClass(mass);
const numerical = numerovSolver.solve(potential, gridConfig, energyMin, energyMax);

// Compare results
console.log('Number of states:');
console.log('  Analytical:', analytical.energies.length);
console.log('  Numerical:', numerical.energies.length);

console.log('\nEnergy comparison:');
for (let i = 0; i < Math.min(analytical.energies.length, numerical.energies.length); i++) {
  const error = Math.abs(analytical.energies[i] - numerical.energies[i]);
  const relativeError = error / analytical.energies[i];
  console.log(`  State ${i}: ${(relativeError * 100).toExponential(2)}% error`);
}
```

## Implementation Details

### BoundStateResult Format

All analytical solutions return a `BoundStateResult` object with the following structure:

```typescript
{
  energies: number[];        // Energy eigenvalues in Joules (sorted lowest to highest)
  wavefunctions: number[][]; // Normalized wavefunctions (each row is one state)
  xGridArray: number[];      // Spatial grid points in meters
  method: string;            // 'analytical' for exact solutions
}
```

### Mathematical Utilities

The `math-utilities.ts` file provides common mathematical functions:

- `factorial(n)`: Computes n!
- `hermitePolynomial(n, x)`: Evaluates the nth Hermite polynomial at x using recurrence relations

## References

- Griffiths, D. J., & Schroeter, D. F. (2018). "Introduction to Quantum Mechanics" (3rd ed.). Cambridge University Press.
- Shankar, R. (1994). "Principles of Quantum Mechanics" (2nd ed.). Springer.

### 2. Infinite Square Well

The infinite square well (particle in a box) is the simplest quantum mechanical system where a particle is confined to a region with impenetrable walls.

**Potential:** `V(x) = 0` for `0 < x < L`, `V(x) = ∞` otherwise

**Energy Eigenvalues:** `E_n = (n² π² ℏ²) / (2mL²)` for `n = 1, 2, 3, ...`

**Wavefunctions:** `ψ_n(x) = √(2/L) sin(nπx/L)` for `0 < x < L`

**Physical Significance:**
- Demonstrates quantization of energy
- Shows zero-point energy (E₁ > 0)
- Models quantum dots and nanowires

#### Usage Example

```typescript
import { solveInfiniteSquareWell } from './analytical-solutions/InfiniteSquareWellSolution.js';
import FundamentalConstants from './FundamentalConstants.js';

const L = 1e-9; // 1 nm well
const mass = FundamentalConstants.ELECTRON_MASS;

const result = solveInfiniteSquareWell(
  L,
  mass,
  { xMin: -0.5e-9, xMax: 1.5e-9, numPoints: 1001 },
  0,
  50 * FundamentalConstants.EV_TO_JOULES
);

console.log('Ground state energy:', result.energies[0]);
console.log('Number of states found:', result.energies.length);
```

### 3. Finite Square Well

The finite square well extends the infinite well by allowing the potential to be finite outside the well, demonstrating quantum tunneling.

**Potential:** `V(x) = -V₀` for `|x| < L/2`, `V(x) = 0` for `|x| > L/2`

**Energy Eigenvalues:** Found by solving transcendental equations:
- Even parity: `tan(ξ) = η/ξ`
- Odd parity: `-cot(ξ) = η/ξ`

where `ξ = (L/2)√(2m(E+V₀)/ℏ²)` and `η = (L/2)√(-2mE/ℏ²)`

**Wavefunctions:**
- Inside (`|x| < L/2`): `A cos(kx)` (even) or `A sin(kx)` (odd)
- Outside (`|x| > L/2`): `B exp(-κ|x|)` with appropriate symmetry

where `k = √(2m(E+V₀)/ℏ²)` and `κ = √(-2mE/ℏ²)`

**Physical Significance:**
- Models quantum wells in semiconductors
- Demonstrates quantum tunneling and evanescent waves
- Wavefunctions penetrate into classically forbidden regions

#### Usage Example

```typescript
import { solveFiniteSquareWell } from './analytical-solutions/FiniteSquareWellSolution.js';
import FundamentalConstants from './FundamentalConstants.js';

const L = 2e-9; // 2 nm well
const V0 = 10 * FundamentalConstants.EV_TO_JOULES; // 10 eV deep
const mass = FundamentalConstants.ELECTRON_MASS;

const result = solveFiniteSquareWell(
  L,
  V0,
  mass,
  { xMin: -3e-9, xMax: 3e-9, numPoints: 1001 },
  -V0, // energyMin (bound states are between -V₀ and 0)
  0    // energyMax
);

console.log('Number of bound states:', result.energies.length);
console.log('Ground state energy:', result.energies[0]);
```

## Future Extensions

Additional exactly solvable potentials that could be added:

- Hydrogen atom (3D Coulomb potential)
- Morse potential
- Pöschl-Teller potential
- Delta function potential
- Kronig-Penney model (periodic potential)
