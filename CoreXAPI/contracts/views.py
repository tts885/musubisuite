"""
契約管理 Views

Author: 開発チーム
Created: 2025-11-16
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Contract
from .serializers import ContractSerializer, ContractListSerializer


class ContractViewSet(viewsets.ModelViewSet):
    """
    契約管理のViewSet
    
    CRUD操作と検索・フィルタリング機能を提供
    """
    queryset = Contract.objects.select_related('client').all()
    serializer_class = ContractSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'contract_type', 'client', 'auto_renewal']
    search_fields = ['contract_number', 'contract_name', 'client__company_name']
    ordering_fields = ['start_date', 'end_date', 'contract_amount', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザーを切り替え"""
        if self.action == 'list':
            return ContractListSerializer
        return ContractSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """契約中の契約一覧を取得"""
        contracts = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """期限が近い契約一覧を取得（30日以内に更新が必要）"""
        contracts = [c for c in self.get_queryset() if c.needs_renewal_soon]
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_client(self, request):
        """特定クライアントの契約一覧を取得"""
        client_id = request.query_params.get('client_id')
        if not client_id:
            return Response(
                {'error': 'client_id パラメータが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contracts = self.get_queryset().filter(client_id=client_id)
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)
