// Copyright 2025, University of Colorado Boulder

/**
 * Unit tests for quantum-bound-states.
 * Run with: open quantum-bound-states-tests.html in a browser
 *
 * @author Martin Veillette
 */

window.assertions.enableAssertSlow();

import qunitStart from '../../chipper/js/browser/sim-tests/qunitStart.js';
import './common/model/NumerovSolverTests.js';

// Since our tests are loaded asynchronously, we must direct QUnit to begin the tests
qunitStart();
