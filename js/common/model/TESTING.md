# Numerov Solver Testing

Comprehensive tests for the Numerov solver implementation, verifying accuracy against analytical solutions.

**Related Documentation:**
- [README.md](./README.md) - Quick start guide and API overview
- [NUMEROV_ARCHITECTURE.md](./NUMEROV_ARCHITECTURE.md) - Detailed architecture documentation
- [TEST_RESULTS.md](./TEST_RESULTS.md) - Detailed test results and validation

## Test File

**NumerovSolverTests.ts** - QUnit test suite for browser-based testing.

**Tests:**
- Harmonic Oscillator: First 20 energy levels (< 0.5% error)
- Infinite Square Well: First 20 energy levels (< 5% error)
- Wavefunction Normalization: 20 states
- Node Counting: 20 states

**To Run:**
1. Open `quantum-bound-states-tests.html` in a web browser
2. Or use `npx grunt dev-server` and navigate to tests

## Test Potentials

### Harmonic Oscillator
- **Potential:** V(x) = ½kx²
- **Analytical Solution:** E_n = (n + ½)ℏω, where n = 0, 1, 2, ...
- **Parameters:**
  - Mass: electron mass
  - Angular frequency: ω = 10¹⁵ rad/s
  - Grid: ±6 turning point radii, 1001 points
- **Accuracy:** < 0.5% error

### Infinite Square Well
- **Potential:** V(x) = 0 for |x| < L/2, V₀ for |x| ≥ L/2
- **Analytical Solution:** E_n = (n²π²ℏ²)/(2mL²), where n = 1, 2, 3, ...
- **Parameters:**
  - Mass: electron mass
  - Well width: L = 1 nm
  - Barrier height: V₀ = 500 eV
  - Grid: ±0.6L, 2401 points
- **Accuracy:** < 5% error (higher tolerance due to hard wall boundaries)

## Test Results Summary

| Test | States | Max Error | Status |
|------|--------|-----------|--------|
| Harmonic Oscillator | 20 | ~0.4% | ✓ |
| Infinite Square Well | 20 | ~4.8% | ✓ |
| Normalization | 20 | < 1% | ✓ |
| Node Counting | 20 | exact | ✓ |

## Running Tests

```bash
npx grunt dev-server --port=8080
```

Then navigate to the tests page in your browser.
