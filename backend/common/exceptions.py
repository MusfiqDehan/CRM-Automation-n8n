from __future__ import annotations

from typing import Any
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def _extract_first_error_message(detail: Any) -> str:
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list) and detail:
        return _extract_first_error_message(detail[0])
    if isinstance(detail, dict) and detail:
        first_key = next(iter(detail))
        msg = _extract_first_error_message(detail[first_key])
        if first_key == "non_field_errors" or first_key == "detail":
            return msg
        return f"{first_key}: {msg}"
    return "Validation or request error occurred."


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, DjangoValidationError):
        exc = DRFValidationError(detail=exc.message_dict if hasattr(exc, "message_dict") else exc.messages)

    response = exception_handler(exc, context)
    if response is not None:
        raw_data = response.data
        message = _extract_first_error_message(raw_data)
        response.data = {
            "success": False,
            "message": message,
            "data": {
                "errors": raw_data,
                "status_code": response.status_code,
            },
        }
        return response

    return Response(
        {
            "success": False,
            "message": f"Internal server error: {str(exc)}",
            "data": {"errors": {"detail": str(exc)}, "status_code": 500},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

