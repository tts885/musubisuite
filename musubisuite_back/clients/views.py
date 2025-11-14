from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer, ClientListSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """クライアントのCRUD API"""
    
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = []  # 開発環境では認証不要
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry']
    search_fields = ['name', 'company_name', 'email']
    ordering_fields = ['created_at', 'company_name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザーを切り替え"""
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer
