from __future__ import annotations

from typing import Any
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.views import APIView
from common.pagination import StandardCursorPagination
from common.responses import api_response


class BaseListCreateAPIView(APIView):
    """
    Reusable APIView for List and Create operations across models.
    Provides:
    - StandardCursorPagination
    - Filtering (DjangoFilterBackend)
    - Search (SearchFilter)
    - Ordering (OrderingFilter)
    - Standardized {success, message, data} envelope
    """

    queryset = None
    serializer_class = None
    filterset_class = None
    search_fields: list[str] = []
    ordering_fields: list[str] = []
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    pagination_class = StandardCursorPagination
    entity_name: str = "Record"

    def get_queryset(self):
        assert self.queryset is not None, f"'{self.__class__.__name__}' must define 'queryset'."
        from django.db.models import Q
        from common.middleware import get_current_tenant

        tenant = getattr(self.request, "tenant", None) or get_current_tenant()
        model = self.queryset.model
        qs = model.all_objects.all() if hasattr(model, "all_objects") else model.objects.all()
        if tenant and hasattr(model, "organization"):
            if tenant.slug == "kevin":
                qs = qs.filter(Q(organization=tenant) | Q(organization__isnull=True))
            else:
                qs = qs.filter(organization=tenant)
        return qs

    def filter_queryset(self, queryset):
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs.setdefault("context", self.get_serializer_context())
        return serializer_class(*args, **kwargs)

    def get_serializer_class(self):
        assert self.serializer_class is not None, f"'{self.__class__.__name__}' must define 'serializer_class'."
        return self.serializer_class

    def get_serializer_context(self) -> dict[str, Any]:
        return {"request": self.request, "view": self}

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return api_response(
            data={"results": serializer.data},
            message=f"{self.entity_name} records retrieved successfully.",
            success=True,
        )

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return api_response(
            data=self.get_serializer(instance).data,
            message=f"{self.entity_name} created successfully.",
            success=True,
            status_code=status.HTTP_201_CREATED,
        )


class BaseDetailAPIView(APIView):
    """
    Reusable APIView for Retrieve, Update (PUT/PATCH), and Destroy (DELETE) operations.
    Provides:
    - Safe lookup with UUID / string pk
    - Not Found error handling via DRF exception handler
    - Standardized {success, message, data} envelope
    """

    queryset = None
    serializer_class = None
    entity_name: str = "Record"
    lookup_field: str = "pk"

    def get_queryset(self):
        assert self.queryset is not None, f"'{self.__class__.__name__}' must define 'queryset'."
        from django.db.models import Q
        from common.middleware import get_current_tenant

        tenant = getattr(self.request, "tenant", None) or get_current_tenant()
        model = self.queryset.model
        qs = model.all_objects.all() if hasattr(model, "all_objects") else model.objects.all()
        if tenant and hasattr(model, "organization"):
            if tenant.slug == "kevin":
                qs = qs.filter(Q(organization=tenant) | Q(organization__isnull=True))
            else:
                qs = qs.filter(organization=tenant)
        return qs

    def get_object(self, pk: str):
        queryset = self.get_queryset()
        try:
            obj = queryset.filter(**{self.lookup_field: pk}).first()
        except (ValueError, ValidationError):
            obj = None

        if obj is None:
            raise NotFound(detail=f"{self.entity_name} with id '{pk}' was not found.")
        return obj

    def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs.setdefault("context", self.get_serializer_context())
        return serializer_class(*args, **kwargs)

    def get_serializer_class(self):
        assert self.serializer_class is not None, f"'{self.__class__.__name__}' must define 'serializer_class'."
        return self.serializer_class

    def get_serializer_context(self) -> dict[str, Any]:
        return {"request": self.request, "view": self}

    def get(self, request, pk: str, *args, **kwargs):
        instance = self.get_object(pk)
        serializer = self.get_serializer(instance)
        return api_response(
            data=serializer.data,
            message=f"{self.entity_name} retrieved successfully.",
            success=True,
        )

    def put(self, request, pk: str, *args, **kwargs):
        instance = self.get_object(pk)
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return api_response(
            data=self.get_serializer(updated).data,
            message=f"{self.entity_name} updated successfully.",
            success=True,
        )

    def patch(self, request, pk: str, *args, **kwargs):
        instance = self.get_object(pk)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return api_response(
            data=self.get_serializer(updated).data,
            message=f"{self.entity_name} updated successfully.",
            success=True,
        )

    def delete(self, request, pk: str, *args, **kwargs):
        instance = self.get_object(pk)
        deleted_id = str(instance.pk)
        instance.delete()
        return api_response(
            data={"id": deleted_id},
            message=f"{self.entity_name} deleted successfully.",
            success=True,
            status_code=status.HTTP_200_OK,
        )

