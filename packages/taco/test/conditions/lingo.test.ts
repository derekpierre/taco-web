import { TEST_CHAIN_ID } from '@nucypher/test-utils';
import { describe, expect, it } from 'vitest';

import { ConditionExpression } from '../../src/conditions/condition-expr';

describe('check that valid lingo in python is valid in typescript', () => {
  const timeConditionProps = {
    conditionType: 'time',
    method: 'blocktime',
    chain: TEST_CHAIN_ID,
    returnValueTest: { value: 0, comparator: '>' },
  };

  const contractConditionProps = {
    conditionType: 'contract',
    chain: TEST_CHAIN_ID,
    method: 'isPolicyActive',
    parameters: [':hrac'],
    contractAddress: '0xA1bd3630a13D54EDF7320412B5C9F289230D260d',
    functionAbi: {
      type: 'function',
      name: 'isPolicyActive',
      stateMutability: 'view',
      inputs: [
        {
          name: '_policyID',
          type: 'bytes16',
          internalType: 'bytes16',
        },
      ],
      outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    },
    returnValueTest: {
      comparator: '==',
      value: true,
    },
  };
  const rpcConditionProps = {
    conditionType: 'rpc',
    chain: TEST_CHAIN_ID,
    method: 'eth_getBalance',
    parameters: ['0x3d2Bed3259b165EB02A7F0D0753e7a01912A68f8', 'latest'],
    returnValueTest: {
      comparator: '>=',
      value: 10000000000000,
    },
  };
  const jsonApiConditionProps = {
    conditionType: 'json-api',
    endpoint: 'https://api.example.com/data',
    query: '$.store.book[0].price',
    parameters: {
      ids: 'ethereum',
      vs_currencies: 'usd',
    },
    returnValueTest: {
      comparator: '==',
      value: 2,
    },
  };
  const jsonRpcConditionProps = {
    conditionType: 'json-rpc',
    endpoint: 'https://math.example.com/',
    method: 'subtract',
    params: [42, 23],
    query: '$.value',
    returnValueTest: {
      comparator: '==',
      value: 2,
    },
  };
  const sequentialConditionProps = {
    conditionType: 'sequential',
    conditionVariables: [
      {
        varName: 'timeValue',
        condition: timeConditionProps,
      },
      {
        varName: 'rpcValue',
        condition: rpcConditionProps,
      },
      {
        varName: 'contractValue',
        condition: contractConditionProps,
      },
      {
        varName: 'jsonValue',
        condition: jsonApiConditionProps,
      },
    ],
  };
  const ifThenElseConditionProps = {
    conditionType: 'if-then-else',
    ifCondition: jsonRpcConditionProps,
    thenCondition: jsonApiConditionProps,
    elseCondition: timeConditionProps,
  };

  const compoundConditionProps = {
    conditionType: 'compound',
    operator: 'and',
    operands: [
      contractConditionProps,
      ifThenElseConditionProps,
      sequentialConditionProps,
      rpcConditionProps,
      {
        conditionType: 'compound',
        operator: 'not',
        operands: [timeConditionProps],
      },
    ],
  };

  it.each([
    rpcConditionProps,
    timeConditionProps,
    contractConditionProps,
    jsonApiConditionProps,
    jsonRpcConditionProps,
    compoundConditionProps,
    sequentialConditionProps,
    ifThenElseConditionProps,
  ])('parsing of all condition types', (conditionProps) => {
    const conditionExprJSON = {
      version: ConditionExpression.version,
      condition: conditionProps,
    };
    const conditionExpr = ConditionExpression.fromObj(conditionExprJSON);
    expect(conditionExpr.toObj()).toBeDefined();
    expect(conditionExpr.condition.toObj()).toEqual(conditionProps);
  });
});

describe('check bigint & number serialization', () => {
  it.each([
    // quoted
    [
      BigInt(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      ),
      `:"115792089237316195423570985008687907853269984665640564039457584007913129639935"`,
      'uint256',
    ], // uint256 max
    [
      BigInt(
        '-57896044618658097711785492504343953926634992332820282019728792003956564819968',
      ),
      `:"-57896044618658097711785492504343953926634992332820282019728792003956564819968"`,
      'int256',
    ], // int256 min

    // not quoted i.e. used as regular number even if provided as bigint
    [Number.MAX_SAFE_INTEGER, `:${Number.MAX_SAFE_INTEGER}`, 'uint256'], // max safe integer
    [Number.MIN_SAFE_INTEGER, `:${Number.MIN_SAFE_INTEGER}`, 'int256'], // min safe integer
    [BigInt(214), ':214', 'uint256'], // number in safe range - not quoted
    [BigInt(-213214), ':-213214', 'uint256'], // number in safe range - not quoted
  ])(
    'checking integer value',
    (valueInCondition, expectedValueInJson, abiType) => {
      const conditionProps = {
        conditionType: 'contract',
        chain: TEST_CHAIN_ID,
        method: 'method',
        parameters: [valueInCondition],
        contractAddress: '0xA1bd3630a13D54EDF7320412B5C9F289230D260d',
        functionAbi: {
          type: 'function',
          name: 'someMethod',
          stateMutability: 'view',
          inputs: [
            {
              name: '_value',
              type: `${abiType}`,
              internalType: `${abiType}`,
            },
          ],
          outputs: [
            { name: '', type: `${abiType}`, internalType: `${abiType}` },
          ],
        },
        returnValueTest: {
          comparator: '==',
          value: valueInCondition,
        },
      };
      const conditionExprJSON = {
        version: ConditionExpression.version,
        condition: conditionProps,
      };
      const conditionExpr = ConditionExpression.fromObj(conditionExprJSON);
      expect(conditionExpr.toJson()).toContain(expectedValueInJson);
    },
  );
});
