from __future__ import annotations

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from common.pagination import StandardCursorPagination
from common.responses import api_response


class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Reusable ModelViewSet providing:
    - CursorPagination (`StandardCursorPagination`)
    - Filtering (`DjangoFilterBackend`), Search (`SearchFilter`), and Sorting (`OrderingFilter`)
    - Standardized `{success, message, data}` responses across CRUD actions
    """

    pagination_class = StandardCursorPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    entity_name: str = "Record"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_response(
            data=serializer.data,
            message=f"{self.entity_name} created successfully.",
            success=True,
            status_code=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(
            data=serializer.data,
            message=f"{self.entity_name} retrieved successfully.",
            success=True,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_response(
            data=serializer.data,
            message=f"{self.entity_name} updated successfully.",
            success=True,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        deleted_id = str(instance.pk)
        self.perform_destroy(instance)
        return api_response(
            data={"id": deleted_id},
            message=f"{self.entity_name} deleted successfully.",
            success=True,
            status_code=status.HTTP_200_OK,
        )

