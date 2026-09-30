import crypto from "node:crypto";

const VERSION = "v1";
const KEY_ENV = "AUTH_ENCRYPTION_KEY";

function getKey() {
  const raw = process.env[KEY_ENV];
  if (!raw) throw new Error(`${KEY_ENV} is required for auth secret encryption.`);
  const key = Buffer.from(raw, "base64url");
  if (key.length !== 32) throw new Error(`${KEY_ENV} must decode to exactly 32 bytes.`);
  return key;
}

export function encryptSecret(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(value: string) {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded] = value.split(".");
  if (version !== VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
    throw new Error("Invalid encrypted auth secret.");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
