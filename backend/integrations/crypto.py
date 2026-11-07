from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from typing import Any
from django.conf import settings


class CredentialVault:
    """
    Authenticated symmetric encryption & secret masking vault for third-party credentials.
    Derives a 256-bit key from Django's SECRET_KEY and encrypts secret values at rest
    using an authenticated CTR-HMAC envelope (`enc:v1:<nonce_b64>:<cipher_b64>:<mac_b64>`).
    """

    PREFIX = "enc:v1:"

    @classmethod
    def _derive_keys(cls) -> tuple[bytes, bytes]:
        raw_secret = getattr(settings, "SECRET_KEY", "beamline-default-secret-key-2026").encode("utf-8")
        enc_key = hashlib.pbkdf2_hmac("sha256", raw_secret, b"beamline-vault-enc-v1", 10000, dklen=32)
        mac_key = hashlib.pbkdf2_hmac("sha256", raw_secret, b"beamline-vault-mac-v1", 10000, dklen=32)
        return enc_key, mac_key

    @classmethod
    def _keystream(cls, enc_key: bytes, nonce: bytes, length: int) -> bytes:
        blocks = []
        counter = 0
        while sum(len(b) for b in blocks) < length:
            counter_bytes = counter.to_bytes(4, "big")
            block = hmac.new(enc_key, nonce + counter_bytes, hashlib.sha256).digest()
            blocks.append(block)
            counter += 1
        return b"".join(blocks)[:length]

    @classmethod
    def is_encrypted(cls, value: Any) -> bool:
        return isinstance(value, str) and value.startswith(cls.PREFIX)

    @classmethod
    def encrypt_value(cls, plaintext: str) -> str:
        if not plaintext:
            return ""
        if cls.is_encrypted(plaintext):
            return plaintext
        enc_key, mac_key = cls._derive_keys()
        nonce = secrets.token_bytes(16)
        raw_bytes = plaintext.encode("utf-8")
        stream = cls._keystream(enc_key, nonce, len(raw_bytes))
        ciphertext = bytes(a ^ b for a, b in zip(raw_bytes, stream))
        mac = hmac.new(mac_key, nonce + ciphertext, hashlib.sha256).digest()
        nonce_b64 = base64.urlsafe_b64encode(nonce).decode("ascii")
        cipher_b64 = base64.urlsafe_b64encode(ciphertext).decode("ascii")
        mac_b64 = base64.urlsafe_b64encode(mac).decode("ascii")
        return f"{cls.PREFIX}{nonce_b64}:{cipher_b64}:{mac_b64}"

    @classmethod
    def decrypt_value(cls, token: str) -> str:
        if not token:
            return ""
        if not cls.is_encrypted(token):
            return str(token)
        try:
            body = token[len(cls.PREFIX) :]
            nonce_b64, cipher_b64, mac_b64 = body.split(":", 2)
            nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
            ciphertext = base64.urlsafe_b64decode(cipher_b64.encode("ascii"))
            expected_mac = base64.urlsafe_b64decode(mac_b64.encode("ascii"))

            enc_key, mac_key = cls._derive_keys()
            actual_mac = hmac.new(mac_key, nonce + ciphertext, hashlib.sha256).digest()
            if not hmac.compare_digest(expected_mac, actual_mac):
                return ""
            stream = cls._keystream(enc_key, nonce, len(ciphertext))
            plaintext_bytes = bytes(a ^ b for a, b in zip(ciphertext, stream))
            return plaintext_bytes.decode("utf-8")
        except Exception:
            return ""

    @classmethod
    def mask_secret(cls, value: str) -> str:
        plain = cls.decrypt_value(value) if cls.is_encrypted(value) else str(value or "")
        if not plain:
            return ""
        if len(plain) <= 4:
            return "••••••••"
        return f"••••••••{plain[-4:]}"

    @classmethod
    def encrypt_credentials_dict(
        cls,
        incoming: dict[str, Any],
        existing_encrypted: dict[str, Any] | None = None,
        secret_keys: set[str] | None = None,
    ) -> dict[str, Any]:
        """
        Merges incoming credential updates with existing encrypted credentials.
        - If a secret key is omitted, empty, or starts with '••••', preserves the existing encrypted value.
        - If a secret key is explicitly set to '__CLEAR__', clears the secret.
        - Otherwise encrypts secret keys and stores non-secret keys as strings.
        """
        result = dict(existing_encrypted or {})
        secret_keys = secret_keys or set()

        for k, v in (incoming or {}).items():
            if v is None:
                continue
            str_val = str(v).strip()
            if k in secret_keys:
                if str_val == "__CLEAR__":
                    result[k] = ""
                elif not str_val or str_val.startswith("••••"):
                    # Preserve existing encrypted value
                    result.setdefault(k, "")
                else:
                    result[k] = cls.encrypt_value(str_val)
            else:
                result[k] = v
        return result

    @classmethod
    def decrypt_credentials_dict(cls, encrypted_dict: dict[str, Any] | None) -> dict[str, Any]:
        if not isinstance(encrypted_dict, dict):
            return {}
        decrypted: dict[str, Any] = {}
        for k, v in encrypted_dict.items():
            if isinstance(v, str) and cls.is_encrypted(v):
                decrypted[k] = cls.decrypt_value(v)
            else:
                decrypted[k] = v
        return decrypted

    @classmethod
    def mask_credentials_dict(
        cls,
        encrypted_dict: dict[str, Any] | None,
        secret_keys: set[str] | None = None,
    ) -> tuple[dict[str, Any], dict[str, bool]]:
        """
        Returns (masked_credentials, has_secret_flags) safe for API responses.
        """
        decrypted = cls.decrypt_credentials_dict(encrypted_dict)
        secret_keys = secret_keys or set()
        masked: dict[str, Any] = {}
        has_secrets: dict[str, bool] = {}

        for k, v in decrypted.items():
            if k in secret_keys:
                has_val = bool(str(v or "").strip())
                has_secrets[k] = has_val
                masked[k] = cls.mask_secret(str(v)) if has_val else ""
            else:
                masked[k] = v
        for sk in secret_keys:
            has_secrets.setdefault(sk, False)
            masked.setdefault(sk, "")
        return masked, has_secrets

