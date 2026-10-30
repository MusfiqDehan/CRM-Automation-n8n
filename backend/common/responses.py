from __future__ import annotations

from typing import Any
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response


def api_response(
    data: Any = None,
    message: str = "Operation completed successfully.",
    success: bool = True,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    """Standardized helper returning the {success, message, data} envelope."""
    return Response(
        {
            "success": bool(success),
            "message": message,
            "data": data,
        },
        status=status_code,
    )


class EnvelopeJSONRenderer(JSONRenderer):
    """
    Ensures every JSON response across DRF ViewSets and APIViews is consistently
    wrapped in {"success": bool, "message": str, "data": ...}.
    """

    def render(
        self,
        data: Any,
        accepted_media_type: str | None = None,
        renderer_context: dict[str, Any] | None = None,
    ) -> bytes:
        renderer_context = renderer_context or {}
        response = renderer_context.get("response")
        status_code = getattr(response, "status_code", 200)
        is_success = 200 <= status_code < 400

        if isinstance(data, dict) and {"success", "message", "data"}.issubset(data.keys()):
            envelope = data
        else:
            default_message = (
                "Request processed successfully."
                if is_success
                else "Request could not be processed."
            )
            envelope = {
                "success": is_success,
                "message": default_message,
                "data": data,
            }

        return super().render(envelope, accepted_media_type, renderer_context)

