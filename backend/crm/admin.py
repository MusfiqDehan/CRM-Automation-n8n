from django.contrib import admin
from crm.models import (
    ConstructionProject,
    Contact,
    EmailCommunicationLog,
    MaterialOrder,
    Opportunity,
    ProjectCost,
    ProjectTask,
    SalesActivity,
)

admin.site.register(Contact)
admin.site.register(Opportunity)
admin.site.register(SalesActivity)
admin.site.register(ConstructionProject)
admin.site.register(ProjectTask)
admin.site.register(MaterialOrder)
admin.site.register(ProjectCost)
admin.site.register(EmailCommunicationLog)

