from __future__ import annotations

from urllib.parse import parse_qs, urlparse
from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


def _extract_cursor_token(url: str | None, param: str = "cursor") -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    values = parse_qs(parsed.query).get(param)
    return values[0] if values else None


class StandardCursorPagination(CursorPagination):
    """
    Reusable CursorPagination across all backend tables.
    Supports ?cursor=..., ?page_size=... (up to 100), and custom ?ordering=...
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
    cursor_query_param = "cursor"
    ordering = ("-created_at", "-id")

    def get_ordering(self, request, queryset, view):
        ordering_param = request.query_params.get("ordering")
        allowed_fields = getattr(view, "ordering_fields", None)
        if ordering_param:
            candidate = ordering_param.split(",")[0].strip()
            raw_field = candidate.lstrip("-")
            if allowed_fields == "__all__" or (
                allowed_fields and raw_field in allowed_fields
            ):
                if raw_field == "id":
                    return (candidate,)
                return (candidate, "-id")
        return self.ordering

    def get_paginated_response(self, data) -> Response:
        next_link = self.get_next_link()
        prev_link = self.get_previous_link()
        next_cursor = _extract_cursor_token(next_link, self.cursor_query_param)
        prev_cursor = _extract_cursor_token(prev_link, self.cursor_query_param)

        return Response(
            {
                "success": True,
                "message": "Records retrieved successfully.",
                "data": {
                    "next": next_link,
                    "previous": prev_link,
                    "next_cursor": next_cursor,
                    "previous_cursor": prev_cursor,
                    "has_next": bool(next_link),
                    "has_previous": bool(prev_link),
                    "page_size": self.get_page_size(self.request),
                    "results": data,
                },
            }
        )

