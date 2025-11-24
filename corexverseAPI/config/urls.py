"""
URL configuration for corexverseAPI project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# Import ViewSets
from clients.views import ClientViewSet
from members.views import MemberViewSet
from projects.views import ProjectViewSet, AttachmentViewSet, CommentViewSet
from tasks.views import TaskViewSet
from activities.views import ActivityLogViewSet
from contracts.views import ContractViewSet
from ai_settings.views import AIProviderViewSet, SearchEngineConfigViewSet, AISettingsViewSet
from masters.views import CodeCategoryViewSet, CodeMasterViewSet

# Import OCR Views
from services.ocr_views import process_document_ocr, test_ocr

# DRF Router
router = routers.DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activities', ActivityLogViewSet, basename='activity')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'ai-providers', AIProviderViewSet, basename='ai-provider')
router.register(r'search-engines', SearchEngineConfigViewSet, basename='search-engine')
router.register(r'ai-settings', AISettingsViewSet, basename='ai-settings')
router.register(r'code-categories', CodeCategoryViewSet, basename='code-category')
router.register(r'codemasters', CodeMasterViewSet, basename='codemaster')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Authentication (JWT)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API Endpoints
    path('api/', include(router.urls)),
    
    # OCR API
    path('api/ocr/process/', process_document_ocr, name='ocr-process'),
    path('api/ocr/test/', test_ocr, name='ocr-test'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
