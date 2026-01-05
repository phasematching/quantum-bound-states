// Copyright 2025, University of Colorado Boulder

/**
 * Physical constants for quantum mechanics calculations. 
 * Note that we use SI units throughout this simulation. 
 * For 64 bits IEEE 754, the maximum value is approximately 10³⁰⁸ while for 
 * 32-bit IEEE 754, the maximum value is approximately 10³⁸. 
 * As a result for 64 bit computation, we have the luxury of being able to 
 * keep everything with SI units, without having to worry about overflow 
 * when using these constants.
 * 
 * @author Martin Veillette
 */

import quantumBoundStates from '../../quantumBoundStates.js';

  // Elementary charge in coulombs
const ELEMENTARY_CHARGE = 1.602176634e-19;

const FundamentalConstants = {

  // Reduced Planck constant (hbar) in J⋅s
  HBAR: 1.054571817e-34,

  // Electron mass in kg
  ELECTRON_MASS: 9.1093837015e-31,

  // Elementary charge in coulombs
  ELEMENTARY_CHARGE: ELEMENTARY_CHARGE,

  // Electron volt to joules conversion
  EV_TO_JOULES: ELEMENTARY_CHARGE,

  // Joules to electron volt conversion
  JOULES_TO_EV: 1.0 / ELEMENTARY_CHARGE,

  // Nanometers to meters conversion
  NM_TO_METERS: 1e-9,

  // Meters to nanometers conversion
  METERS_TO_NM: 1e9
};

quantumBoundStates.register( 'FundamentalConstants', FundamentalConstants );
export default FundamentalConstants;