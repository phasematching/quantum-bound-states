# Numerov Solver Test Results

**Related Documentation:**
- [README.md](./README.md) - Quick start guide and API overview
- [NUMEROV_ARCHITECTURE.md](./NUMEROV_ARCHITECTURE.md) - Architecture documentation
- [TESTING.md](./TESTING.md) - How to run the tests

## Overview

The Numerov solver has been validated against analytical solutions for two standard quantum potentials:
- Harmonic Oscillator (20 states)
- Infinite Square Well (20 states)

## Harmonic Oscillator Results

**Physical System:**
- Mass: electron (9.109×10⁻³¹ kg)
- Angular frequency: ω = 10¹⁵ rad/s
- Potential: V(x) = ½kx² where k = mω²

**Grid:**
- Range: ±6 classical turning points
- Points: 1001
- Step size: ~4 pm

**Accuracy:**
- All 20 states: < 0.5% error
- Maximum error: ~0.4%
- Status: ✓ PASS

## Infinite Square Well Results

**Physical System:**
- Mass: electron
- Well width: L = 1 nm
- Barrier height: V₀ = 500 eV

**Grid:**
- Range: ±0.6L
- Points: 2401
- Higher resolution needed for sharp boundaries

**Accuracy:**
- All 20 states: < 5% error
- Maximum error: ~4.8%
- Status: ✓ PASS

**Note:** Higher error tolerance is expected due to numerical challenges with hard wall boundaries.

## Wavefunction Validation

**Normalization:**
- All 20 states properly normalized
- ∫|ψ|² dx ≈ 1.0 (within 1%)
- Status: ✓ PASS

**Node Counting:**
- All 20 states have correct number of nodes
- State n has exactly n nodes
- Status: ✓ PASS

## Summary

| Test | States | Result |
|------|--------|--------|
| Harmonic Oscillator Energy | 20 | ✓ |
| Infinite Square Well Energy | 20 | ✓ |
| Normalization | 20 | ✓ |
| Node Counting | 20 | ✓ |
| **Total** | **80** | **✓** |

## Conclusion

✓ The Numerov implementation is validated and ready for use in PhET simulations.

The modular architecture provides:
- `NumerovIntegrator`: Forward integration
- `SymmetricNumerovIntegrator`: Symmetric potentials
- `EnergyRefiner`: Bisection refinement
- `WavefunctionNormalizer`: Normalization
- `NumerovSolverClass`: Orchestration
