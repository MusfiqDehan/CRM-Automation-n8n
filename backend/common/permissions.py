from __future__ import annotations

from typing import Any
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class IsPlatformSuperAdmin(permissions.BasePermission):
    """Allows access only to platform superadmins (is_superuser=True)."""

    message = "Platform superadmin privileges are required for this action."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """Allows access to organization Owners, Admins, or Platform Superadmins."""

    message = "Organization Owner or Admin role required."

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True

        tenant = getattr(request, "tenant", None)
        if not tenant:
            return False

        from common.tenancy import OrganizationMember

        member = OrganizationMember.objects.filter(
            organization=tenant,
            user=request.user,
            is_active=True,
            role__in=[
                OrganizationMember.Role.OWNER,
                OrganizationMember.Role.ADMIN,
            ],
        ).first()
        return member is not None


class FeatureFlagPermission(permissions.BasePermission):
    """
    Checks that the organization has the view's required feature flag(s) enabled.
    Set `required_feature_flags = ["sub_crm_deals"]` on the APIView class.
    """

    def has_permission(self, request, view) -> bool:
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return True

        required_flags = getattr(view, "required_feature_flags", [])
        single_flag = getattr(view, "required_feature_flag", None)
        flags_to_check = list(required_flags)
        if single_flag:
            flags_to_check.append(single_flag)

        for flag in flags_to_check:
            if not tenant.is_feature_enabled(flag):
                raise PermissionDenied(
                    detail=f"The feature or sub-feature '{flag}' has been disabled by the platform administrator for this client.",
                    code="FEATURE_DISABLED",
                )
        return True
