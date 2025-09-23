// Copyright 2025, University of Colorado Boulder
// AUTOMATICALLY GENERATED – DO NOT EDIT.
// Generated from quantum-bound-states-strings_en.yaml

/* eslint-disable */
/* @formatter:off */

import { TReadOnlyProperty } from '../../axon/js/TReadOnlyProperty.js';
import type { FluentVariable } from '../../chipper/js/browser/FluentPattern.js';
import FluentPattern from '../../chipper/js/browser/FluentPattern.js';
import FluentContainer from '../../chipper/js/browser/FluentContainer.js';
import FluentConstant from '../../chipper/js/browser/FluentConstant.js';
import FluentComment from '../../chipper/js/browser/FluentComment.js';
import quantumBoundStates from './quantumBoundStates.js';
import QuantumBoundStatesStrings from './QuantumBoundStatesStrings.js';

// This map is used to create the fluent file and link to all StringProperties.
// Accessing StringProperties is also critical for including them in the built sim.
// However, if strings are unused in Fluent system too, they will be fully excluded from
// the build. So we need to only add actually used strings.
const fluentKeyToStringPropertyMap = new Map();

const addToMapIfDefined = ( key: string, path: string ) => {
  const sp = _.get( QuantumBoundStatesStrings, path );
  if ( sp ) {
    fluentKeyToStringPropertyMap.set( key, sp );
  }
};

addToMapIfDefined( 'quantum_bound_states_title', 'quantum-bound-states.titleStringProperty' );
addToMapIfDefined( 'screen_oneWell', 'screen.oneWellStringProperty' );
addToMapIfDefined( 'screen_twoWells', 'screen.twoWellsStringProperty' );
addToMapIfDefined( 'screen_manyWells', 'screen.manyWellsStringProperty' );

// A function that creates contents for a new Fluent file, which will be needed if any string changes.
const createFluentFile = (): string => {
  let ftl = '';
  for (const [key, stringProperty] of fluentKeyToStringPropertyMap.entries()) {
    ftl += `${key} = ${stringProperty.value.replace('\n','\n ')}\n`;
  }
  return ftl;
};

const fluentSupport = new FluentContainer( createFluentFile, Array.from(fluentKeyToStringPropertyMap.values()) );

const QuantumBoundStatesFluent = {
  "quantum-bound-states": {
    _comment_0: new FluentComment( {"comment":"Strings for PhET's Quantum Bound States simulation","associatedKey":"quantum-bound-states.title"} ),
    _comment_1: new FluentComment( {"comment":"Simulation Title","associatedKey":"quantum-bound-states.title"} ),
    titleStringProperty: _.get( QuantumBoundStatesStrings, 'quantum-bound-states.titleStringProperty' )
  },
  screen: {
    _comment_0: new FluentComment( {"comment":"Screen Names","associatedKey":"screen.oneWell"} ),
    oneWellStringProperty: _.get( QuantumBoundStatesStrings, 'screen.oneWellStringProperty' ),
    twoWellsStringProperty: _.get( QuantumBoundStatesStrings, 'screen.twoWellsStringProperty' ),
    manyWellsStringProperty: _.get( QuantumBoundStatesStrings, 'screen.manyWellsStringProperty' )
  }
};

export default QuantumBoundStatesFluent;

quantumBoundStates.register('QuantumBoundStatesFluent', QuantumBoundStatesFluent);
