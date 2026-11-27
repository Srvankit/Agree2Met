/**
 * SHA-256 Cryptographic Hash Utility for Tamper-Evident Audit Trails
 * Standard pure JS implementation compatible with browser crypto.subtle
 */

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256Sync(ascii) {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [];
  let k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 312; i += candidate) {
        isComposite[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1h =
        rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
      const s0h =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

/**
 * Computes hash of an audit record payload given its previousHash
 */
export function computeAuditEventHash(record, previousHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000') {
  const payload = JSON.stringify({
    agreementId: record.agreementId,
    actor: record.actor,
    action: record.action,
    details: record.details,
    timestamp: record.timestamp,
    previousHash,
  });
  return sha256Sync(payload);
}

/**
 * Verifies the integrity of a chain of audit log events
 * Returns { isValid, verifiedCount, brokenIndex, error }
 */
export function verifyAuditChain(auditRecords = []) {
  if (!auditRecords || auditRecords.length === 0) {
    return { isValid: true, verifiedCount: 0, brokenIndex: -1, error: null };
  }

  let expectedPrevHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < auditRecords.length; i++) {
    const record = auditRecords[i];

    if (record.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        verifiedCount: i,
        brokenIndex: i,
        error: `Broken link at record #${i + 1} (${record.action}): previousHash mismatch.`,
      };
    }

    const calculatedHash = computeAuditEventHash(record, record.previousHash);
    if (calculatedHash !== record.hash) {
      return {
        isValid: false,
        verifiedCount: i,
        brokenIndex: i,
        error: `Tampered content at record #${i + 1} (${record.action}): calculated hash does not match stored hash.`,
      };
    }

    expectedPrevHash = record.hash;
  }

  return {
    isValid: true,
    verifiedCount: auditRecords.length,
    brokenIndex: -1,
    error: null,
  };
}
