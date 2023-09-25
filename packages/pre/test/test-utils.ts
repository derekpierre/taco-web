// Disabling some of the eslint rules for convenience.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Capsule,
  EncryptedTreasureMap,
  PublicKey,
  reencrypt,
  SecretKey,
  VerifiedCapsuleFrag,
  VerifiedKeyFrag,
} from '@nucypher/nucypher-core';
import { SpyInstance, vi } from 'vitest';

import {
  Alice,
  BlockchainPolicy,
  Bob,
  PreEnactedPolicy,
  RemoteBob,
  toBytes,
} from '../src';

export const fakeBob = (): Bob => {
  const secretKey = SecretKey.fromBEBytes(
    toBytes('fake-secret-key-32-bytes-bob-xxx'),
  );
  return Bob.fromSecretKey(secretKey);
};

export const fakeRemoteBob = (): RemoteBob => {
  const { decryptingKey, verifyingKey } = fakeBob();
  return RemoteBob.fromKeys(decryptingKey, verifyingKey);
};

export const fakeAlice = (aliceKey = 'fake-secret-key-32-bytes-alice-x') => {
  const secretKey = SecretKey.fromBEBytes(toBytes(aliceKey));
  return Alice.fromSecretKey(secretKey);
};

export const mockPublishToBlockchain = (): SpyInstance => {
  const txHash = '0x1234567890123456789012345678901234567890';
  return vi
    .spyOn(PreEnactedPolicy.prototype as any, 'publish')
    .mockImplementation(async () => Promise.resolve(txHash));
};

export const mockGenerateKFrags = (withValue?: {
  delegatingKey: PublicKey;
  verifiedKFrags: VerifiedKeyFrag[];
}): SpyInstance => {
  const spy = vi.spyOn(Alice.prototype as any, 'generateKFrags');
  if (withValue) {
    return spy.mockImplementation(() => withValue);
  }
  return spy;
};

export const mockEncryptTreasureMap = (
  withValue?: EncryptedTreasureMap,
): SpyInstance => {
  const spy = vi.spyOn(BlockchainPolicy.prototype as any, 'encryptTreasureMap');
  if (withValue) {
    return spy.mockImplementation(() => withValue);
  }
  return spy;
};

export const reencryptKFrags = (
  kFrags: readonly VerifiedKeyFrag[],
  capsule: Capsule,
): {
  verifiedCFrags: VerifiedCapsuleFrag[];
} => {
  if (!kFrags) {
    throw new Error('Pass at least one kFrag.');
  }
  const verifiedCFrags = kFrags.map((kFrag) => reencrypt(capsule, kFrag));
  return { verifiedCFrags };
};

export const mockMakeTreasureMap = (): SpyInstance => {
  return vi.spyOn(BlockchainPolicy.prototype as any, 'makeTreasureMap');
};
