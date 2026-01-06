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

## Performance Considerations

- **NumerovIntegrator**: O(N) where N is number of grid points
- **EnergyRefiner**: O(log(ΔE/ε)) iterations, each requiring O(N) integration
- **WavefunctionNormalizer**: O(N) for normalization
- **Overall**: O(M × log(ΔE/ε) × N) where M is number of states
