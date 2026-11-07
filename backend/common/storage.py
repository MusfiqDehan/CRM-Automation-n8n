from __future__ import annotations

import logging
import os
import re
import uuid
from urllib.parse import urlparse
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from storages.backends.s3boto3 import S3Boto3Storage

logger = logging.getLogger(__name__)


class BeamlineR2StorageMixin:
    """
    Configuration mixin for Cloudflare R2 object storage targeting bucket 'root'
    with public CDN domain 'cdn.musfiqdehan.com'.
    """

    bucket_name = getattr(settings, "R2_BUCKET_NAME", "root")
    custom_domain = getattr(settings, "R2_PUBLIC_DOMAIN", "cdn.musfiqdehan.com")
    endpoint_url = getattr(settings, "R2_ENDPOINT_URL", "")
    access_key = getattr(settings, "R2_ACCESS_KEY_ID", "")
    secret_key = getattr(settings, "R2_SECRET_ACCESS_KEY", "")
    file_overwrite = False
    default_acl = None  # Cloudflare R2 does not support S3 canned ACLs
    signature_version = "s3v4"
    querystring_auth = False  # Custom domain URLs should be clean without AWS auth query params
    object_parameters = {
        "CacheControl": "max-age=31536000, public",
    }


class BeamlineR2MediaStorage(BeamlineR2StorageMixin, S3Boto3Storage):
    """Media storage backend placing platform admin media under 'beamline/platform/media'."""

    location = f"{getattr(settings, 'R2_KEY_PREFIX', 'beamline')}/platform/media"


class BeamlineR2StaticStorage(BeamlineR2StorageMixin, S3Boto3Storage):
    """Static asset storage backend placing platform compiled statics under 'beamline/platform/static'."""

    location = f"{getattr(settings, 'R2_KEY_PREFIX', 'beamline')}/platform/static"


class R2AssetLifecycleService:
    """
    Service responsible for uploading, validating, and deleting media assets
    (logos, social covers, profile pictures, videos) inside Cloudflare R2 ('root' bucket,
    'beamline/' key prefix) and ensuring old assets are safely purged upon replacement or deletion.
    """

    ALLOWED_IMAGE_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        "image/gif",
    }
    ALLOWED_VIDEO_TYPES = {
        "video/mp4",
        "video/webm",
        "video/quicktime",
    }
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

    @classmethod
    def get_s3_client(cls):
        access_key = getattr(settings, "R2_ACCESS_KEY_ID", "")
        secret_key = getattr(settings, "R2_SECRET_ACCESS_KEY", "")
        endpoint_url = getattr(settings, "R2_ENDPOINT_URL", "")
        if not (access_key and secret_key and endpoint_url):
            return None
        return boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    @classmethod
    def extract_key_from_url(cls, url_or_key: str) -> str:
        """
        Extracts the relative storage key (starting with 'beamline/') from a URL or key string.
        Examples:
          https://cdn.musfiqdehan.com/beamline/tenants/kevin/branding/logo.png -> beamline/tenants/kevin/branding/logo.png
          http://localhost:8017/media/beamline/platform/cover.png -> beamline/platform/cover.png
          /media/beamline/users/1/avatar.png -> beamline/users/1/avatar.png
        """
        if not url_or_key:
            return ""
        s = url_or_key.strip()
        if "://" in s:
            parsed = urlparse(s)
            path = parsed.path.lstrip("/")
        else:
            path = s.lstrip("/")

        # Strip /media/ prefix if present
        if path.startswith("media/"):
            path = path[len("media/"):]

        prefix = getattr(settings, "R2_KEY_PREFIX", "beamline").strip("/")
        idx = path.find(prefix)
        if idx != -1:
            return path[idx:]
        return path

    @classmethod
    def delete_asset(cls, url_or_key: str) -> bool:
        """
        Deletes the object directly from Cloudflare R2 ('root' bucket) and/or local storage.
        """
        if not url_or_key:
            return False

        key = cls.extract_key_from_url(url_or_key)
        if not key:
            return False

        deleted_somewhere = False
        bucket = getattr(settings, "R2_BUCKET_NAME", "root")

        # 1. Try deleting via S3/R2 client if credentials exist
        s3 = cls.get_s3_client()
        if s3:
            try:
                s3.delete_object(Bucket=bucket, Key=key)
                logger.info(f"Deleted Cloudflare R2 object: bucket={bucket}, key={key}")
                deleted_somewhere = True
            except ClientError as e:
                logger.warning(f"Cloudflare R2 delete_object failed for key={key}: {e}")

        # 2. Try deleting via Django default_storage
        try:
            if default_storage.exists(key):
                default_storage.delete(key)
                deleted_somewhere = True
        except Exception as e:
            logger.debug(f"default_storage.delete skipped or failed for {key}: {e}")

        # 3. Try deleting via local MEDIA_ROOT fallback
        try:
            local_path = os.path.join(settings.MEDIA_ROOT, key)
            if os.path.exists(local_path):
                os.remove(local_path)
                deleted_somewhere = True
        except Exception as e:
            logger.debug(f"Local file removal failed for {key}: {e}")

        return deleted_somewhere

    @classmethod
    def ensure_tenant_folders(cls, tenant_slug: str) -> None:
        """
        Creates standard folder markers (.keep) on Cloudflare R2 under beamline/tenants/<tenant_slug>/
        (branding, social, media, users).
        """
        if not tenant_slug:
            return
        s3 = cls.get_s3_client()
        bucket = getattr(settings, "R2_BUCKET_NAME", "root")
        prefix = getattr(settings, "R2_KEY_PREFIX", "beamline").strip("/")
        folders = ["branding", "social", "media", "users"]
        for f in folders:
            key = f"{prefix}/tenants/{tenant_slug}/{f}/.keep"
            if s3:
                try:
                    s3.put_object(
                        Bucket=bucket,
                        Key=key,
                        Body=f"# {tenant_slug} {f}\n".encode("utf-8"),
                        ContentType="text/plain",
                    )
                except Exception as exc:
                    logger.warning(f"Failed to create tenant R2 folder {key}: {exc}")
            else:
                try:
                    if not default_storage.exists(key):
                        default_storage.save(key, ContentFile(f"# {tenant_slug} {f}\n".encode("utf-8")))
                except Exception as exc:
                    logger.debug(f"Failed to create local tenant folder marker {key}: {exc}")

    @classmethod
    def upload_asset(
        cls,
        file_obj,
        category: str,
        scope_id: str,
        original_name: str | None = None,
        previous_url: str | None = None,
        folder: str | None = None,
    ) -> dict:
        """
        Validates and uploads an asset to Cloudflare R2.
        Hierarchical folder structure:
          - Platform: beamline/platform/<category>/<uuid>_<filename>
          - Tenants:  beamline/tenants/<tenant_slug>/<category>/<uuid>_<filename>
        Automatically purges previous_url if provided.
        Returns a dict with: url, key, filename, content_type, size.
        """
        filename = original_name or getattr(file_obj, "name", "file")
        content_type = getattr(file_obj, "content_type", "")
        file_size = getattr(file_obj, "size", None)

        if file_size and file_size > cls.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed limit of {cls.MAX_FILE_SIZE // (1024 * 1024)}MB.")

        # Sanitize filename
        clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename).lstrip(".")
        if not clean_name:
            clean_name = "asset.png"

        unique_id = uuid.uuid4().hex[:12]
        prefix = getattr(settings, "R2_KEY_PREFIX", "beamline").strip("/")

        # Determine hierarchical key based on platform vs. tenant
        if folder:
            clean_folder = folder.strip("/")
            clean_cat = category.strip("/")
            if clean_cat:
                key = f"{prefix}/{clean_folder}/{clean_cat}/{unique_id}_{clean_name}"
            else:
                key = f"{prefix}/{clean_folder}/{unique_id}_{clean_name}"
        elif scope_id == "platform":
            key = f"{prefix}/platform/{category.strip('/')}/{unique_id}_{clean_name}"
        elif category.startswith("tenants/") or category.startswith("platform/"):
            key = f"{prefix}/{category.strip('/')}/{scope_id}/{unique_id}_{clean_name}"
        elif scope_id and not scope_id.isdigit():
            # scope_id is a tenant slug (e.g., "kevin", "apex")
            key = f"{prefix}/tenants/{scope_id.strip('/')}/{category.strip('/')}/{unique_id}_{clean_name}"
        else:
            key = f"{prefix}/{category.strip('/')}/{scope_id}/{unique_id}_{clean_name}"

        # If previous_url was set, clean it up
        if previous_url:
            cls.delete_asset(previous_url)

        # Read content bytes
        if hasattr(file_obj, "read"):
            content = file_obj.read()
            if hasattr(file_obj, "seek"):
                file_obj.seek(0)
        else:
            content = bytes(file_obj)

        s3 = cls.get_s3_client()
        bucket = getattr(settings, "R2_BUCKET_NAME", "root")
        custom_domain = getattr(settings, "R2_PUBLIC_DOMAIN", "cdn.musfiqdehan.com")

        if s3:
            # Upload directly to Cloudflare R2 bucket 'root'
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type
            extra_args["CacheControl"] = "max-age=31536000, public"

            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=content,
                **extra_args,
            )
            public_url = f"https://{custom_domain}/{key}"
            logger.info(f"Uploaded asset to Cloudflare R2: {public_url}")
        else:
            # Local development fallback
            saved_name = default_storage.save(key, ContentFile(content))
            public_url = default_storage.url(saved_name)
            if not public_url.startswith("http"):
                public_base = getattr(settings, "PUBLIC_BASE_URL", "http://localhost:8017")
                public_url = f"{public_base.rstrip('/')}/{public_url.lstrip('/')}"
            logger.info(f"Uploaded asset to local storage fallback: {public_url}")

        return {
            "url": public_url,
            "key": key,
            "filename": clean_name,
            "content_type": content_type,
            "size": len(content),
        }

