// This file tests various multi-line import patterns

// Standard multi-line named imports
import {
  enableCodeChecks,
  enableVercelConformance,
  enableMonorecents,
} from '#/app/(flags)/server';

// Multi-line with default and named imports
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';

// Multi-line with aliases
import {
  validateUser as validateUserData,
  validateProduct as validateProductData,
  validateOrder as validateOrderData,
  validatePayment as validatePaymentData
} from '@utils/validators';

// Multi-line with trailing comma
import {
  Logger,
  FileLogger,
  ConsoleLogger,
  RemoteLogger,
} from '~/utils/logging';

// Multi-line with comments
import {
  // Authentication utilities
  authenticate,
  authorize,
  // Token management
  generateToken,
  validateToken,
  refreshToken,
  // User session
  createSession,
  destroySession
} from '@/auth/utils';

// Multi-line dynamic import
const dynamicMultiLine = import(
  './dynamic-module'
);

// Multi-line dynamic import with options
const dynamicWithOptions = import(
  /* webpackChunkName: "my-chunk" */
  './another-dynamic-module'
);

// Multi-line require (CommonJS)
const {
  readFile,
  writeFile,
  appendFile,
  deleteFile
} = require('fs/promises');

// Very long single line that might be formatted as multi-line
import { ComponentA, ComponentB, ComponentC, ComponentD, ComponentE, ComponentF, ComponentG, ComponentH } from './components';

// Multi-line with type imports (should be ignored)
import type {
  UserType,
  ProductType,
  OrderType
} from './types';

// Mixed imports with multi-line
import DefaultExport, {
  namedExport1,
  namedExport2,
  namedExport3
} from './mixed-exports';

// Export functions to ensure this is a module
export function testMultiLineImports() {
  console.log('Testing multi-line imports');
  return {
    enableCodeChecks,
    React,
    Logger,
    authenticate,
    readFile
  };
}