import { z } from 'zod';

import { CONTEXT_PARAM_FULL_MATCH_REGEXP } from '../const';

import { plainStringSchema } from './common';

export const contextParamSchema = z
  .string()
  .regex(CONTEXT_PARAM_FULL_MATCH_REGEXP)
  .describe(
    `A Context Parameter i.e. a placeholder used within conditions and specified at the encryption time, whose value is provided at decryption time.`,
  );

const bigIntSchema = z.bigint().transform((val) =>
  // convert bigints to regular numbers whenever we can
  val <= BigInt(Number.MAX_SAFE_INTEGER) &&
  val >= BigInt(Number.MIN_SAFE_INTEGER)
    ? Number(val)
    : `${val.toString()}`,
);

const paramSchema = z.union([
  plainStringSchema,
  z.boolean(),
  z.number(),
  bigIntSchema,
]);

const blockchainBigIntSchema = z
  .bigint()
  .refine((val) => {
    if (
      val >
      BigInt(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      )
    ) {
      // uint256 max
      return false;
    } else if (
      val <
      BigInt(
        '-57896044618658097711785492504343953926634992332820282019728792003956564819968',
      )
    ) {
      // int256 min
      return false;
    }
    return true;
  })
  .transform((val) =>
    // convert bigints to regular numbers whenever we can
    val <= BigInt(Number.MAX_SAFE_INTEGER) &&
    val >= BigInt(Number.MIN_SAFE_INTEGER)
      ? Number(val)
      : `${val.toString()}`,
  );

const nonFloatParamSchema = z
  .union([
    plainStringSchema,
    z.boolean(),
    z.number().int(),
    blockchainBigIntSchema,
  ])
  .describe(
    'Non-floating point (string, boolean, or integer, or bigint(range [-2^255, 2^256-1]). Used for parameters passed to blockchain RPC endpoints and Smart Contracts functions',
  );

export const paramOrContextParamSchema: z.ZodSchema = z.union([
  paramSchema,
  contextParamSchema,
  z.lazy(() => z.array(paramOrContextParamSchema)),
]);

export const nonFloatParamOrContextParamSchema: z.ZodSchema = z.union([
  nonFloatParamSchema,
  contextParamSchema,
  z.lazy(() => z.array(nonFloatParamOrContextParamSchema)),
]);
