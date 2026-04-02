import * as forge from 'node-forge';

/**
 * Standard HKDF using HMAC-SHA256
 * Matches Python's cryptography.hazmat.primitives.kdf.hkdf.HKDF
 */
function hkdf_sha256(ikm: string, salt: string, info: string, length: number): string {
  // Extract
  const prkHmac = forge.hmac.create();
  prkHmac.start('sha256', salt);
  prkHmac.update(ikm);
  const prk = prkHmac.digest().getBytes();

  // Expand
  let okm = '';
  let t = '';
  let i = 1;

  while (okm.length < length) {
    const expandHmac = forge.hmac.create();
    expandHmac.start('sha256', prk);
    // Explicitly update string representations similar to Python byte concatenations
    expandHmac.update(t + info + String.fromCharCode(i));
    t = expandHmac.digest().getBytes();
    okm += t;
    i++;
  }

  return okm.substring(0, length);
}

export function decryptSharedReportPayload(
  share_id: string,
  pin: string,
  encrypted_payload_b64: string,
  nonce_b64: string,
  key_part_a_b64: string
) {
  try {
    // 1. Decode payloads from Base64 into forge byte strings
    const part_a = forge.util.decode64(key_part_a_b64);
    const ciphertextBytes = forge.util.decode64(encrypted_payload_b64);
    const nonce = forge.util.decode64(nonce_b64);

    // 2. Derive part_b using HKDF (SHA256, 6 bytes, salt=share_id, info="hackhorizon-share-v1")
    // Note: Ensuring pin and share_id are evaluated as utf-8 byte strings like in python.
    const part_b = hkdf_sha256(
      forge.util.encodeUtf8(pin), 
      forge.util.encodeUtf8(share_id), 
      forge.util.encodeUtf8("hackhorizon-share-v1"), 
      6
    );

    // 3. Construct Full 32-Byte Key (AES-256 requires 32 bytes: 26 + 6)
    const full_key = part_a + part_b;

    // 4. In AES-GCM (Python Cryptography), the 16-byte auth tag is appended at the very end
    const tagLength = 16;
    const ciphertext = ciphertextBytes.slice(0, ciphertextBytes.length - tagLength);
    const authTag = ciphertextBytes.slice(ciphertextBytes.length - tagLength);

    // 5. Decrypt
    const decipher = forge.cipher.createDecipher('AES-GCM', full_key);
    decipher.start({
      iv: nonce,
      tagLength: 128,
      tag: forge.util.createBuffer(authTag)
    });
    decipher.update(forge.util.createBuffer(ciphertext));
    const pass = decipher.finish();

    if (pass) {
      const jsonUtf8 = decipher.output.getBytes();
      return JSON.parse(forge.util.decodeUtf8(jsonUtf8));
    } else {
      throw new Error("Decryption failed. Incorrect PIN or manipulated payload.");
    }
  } catch (error: any) {
     throw new Error(error.message || "Cryptographic process failed");
  }
}
