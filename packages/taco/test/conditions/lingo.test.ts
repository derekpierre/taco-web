import { TEST_CHAIN_ID } from '@nucypher/test-utils';
import { describe, expect, it } from 'vitest';

import { ContractCondition } from '../../src/conditions/base/contract';
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

describe('check large numbers', () => {
  it('checking uint256 max', () => {
    const uint256ContractConditionProps = {
      conditionType: 'contract',
      chain: TEST_CHAIN_ID,
      method: 'method',
      parameters: [
        // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
        115792089237316195423570985008687907853269984665640564039457584007913129639935,
      ],
      contractAddress: '0xA1bd3630a13D54EDF7320412B5C9F289230D260d',
      functionAbi: {
        type: 'function',
        name: 'someMethod',
        stateMutability: 'view',
        inputs: [
          {
            name: '_value',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
      },
      returnValueTest: {
        comparator: '==',
        // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
        value: 115792089237316195423570985008687907853269984665640564039457584007913129639935,
      },
    };

    const contractCondition = new ContractCondition(
      uint256ContractConditionProps,
    );
    const conditionExpr = new ConditionExpression(contractCondition);
    expect(conditionExpr.toJson()).toContain(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    );
  });

  it('checking int256 min', () => {
    const int256ContractConditionProps = {
      conditionType: 'contract',
      chain: TEST_CHAIN_ID,
      method: 'method',
      parameters: [
        -57896044618658097711785492504343953926634992332820282019728792003956564819968,
      ],
      contractAddress: '0xA1bd3630a13D54EDF7320412B5C9F289230D260d',
      functionAbi: {
        type: 'function',
        name: 'someMethod',
        stateMutability: 'view',
        inputs: [
          {
            name: '_value',
            type: 'int256',
            internalType: 'int256',
          },
        ],
        outputs: [{ name: '', type: 'int256', internalType: 'int256' }],
      },
      returnValueTest: {
        comparator: '==',
        value:
          -57896044618658097711785492504343953926634992332820282019728792003956564819968,
      },
    };

    const contractCondition = new ContractCondition(
      int256ContractConditionProps,
    );
    const conditionExpr = new ConditionExpression(contractCondition);
    expect(conditionExpr.toJson()).toContain(
      '-5789604461865809771178549250434395392663499233282028201972879200395',
    );
  });
});
