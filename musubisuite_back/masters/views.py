"""
コードマスタ管理のビューセット
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import CodeCategory, CodeMaster
from .serializers import (
    CodeCategorySerializer,
    CodeCategoryListSerializer,
    CodeMasterSerializer
)


class CodeCategoryViewSet(viewsets.ModelViewSet):
    """
    コードカテゴリのCRUD操作
    
    list: カテゴリ一覧取得
    retrieve: カテゴリ詳細取得（所属するコードも含む）
    create: 新規カテゴリ作成
    update: カテゴリ更新
    destroy: カテゴリ削除
    codes: 特定カテゴリのコード一覧取得
    """
    queryset = CodeCategory.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_system', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['sort_order', 'code', 'created_at']
    ordering = ['sort_order', 'code']
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザを切り替え"""
        if self.action == 'list':
            return CodeCategoryListSerializer
        return CodeCategorySerializer
    
    @action(detail=True, methods=['get'])
    def codes(self, request, pk=None):
        """
        特定カテゴリのコード一覧を取得
        
        GET /api/code-categories/{category_code}/codes/
        """
        category = self.get_object()
        codes = category.codes.filter(is_active=True).order_by('sort_order', 'code')
        serializer = CodeMasterSerializer(codes, many=True)
        return Response(serializer.data)


class CodeMasterViewSet(viewsets.ModelViewSet):
    """
    コードマスタのCRUD操作
    
    list: コード一覧取得
    retrieve: コード詳細取得
    create: 新規コード作成
    update: コード更新
    destroy: コード削除
    by_category: カテゴリコードでフィルタリング
    bulk: 複数カテゴリのコードを一括取得
    """
    queryset = CodeMaster.objects.select_related('category').all()
    serializer_class = CodeMasterSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'category__code', 'is_active', 'parent_code']
    search_fields = ['code', 'name', 'name_en', 'description']
    ordering_fields = ['sort_order', 'code', 'created_at']
    ordering = ['category', 'sort_order', 'code']
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        カテゴリコードでフィルタリング
        
        GET /api/codemasters/by_category/?category=PROJECT_STATUS
        """
        category_code = request.query_params.get('category')
        if not category_code:
            return Response(
                {'error': 'category parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        codes = self.get_queryset().filter(
            category__code=category_code,
            is_active=True
        ).order_by('sort_order', 'code')
        
        serializer = self.get_serializer(codes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def bulk(self, request):
        """
        複数カテゴリのコードを一括取得
        
        GET /api/codemasters/bulk/?categories=PROJECT_STATUS,PROJECT_PRIORITY,INDUSTRY
        
        Returns:
            {
                "PROJECT_STATUS": [...],
                "PROJECT_PRIORITY": [...],
                "INDUSTRY": [...]
            }
        """
        categories_param = request.query_params.get('categories', '')
        if not categories_param:
            return Response(
                {'error': 'categories parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        categories = [c.strip() for c in categories_param.split(',') if c.strip()]
        result = {}
        
        for category_code in categories:
            codes = self.get_queryset().filter(
                category__code=category_code,
                is_active=True
            ).order_by('sort_order', 'code')
            
            serializer = self.get_serializer(codes, many=True)
            result[category_code] = serializer.data
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        コードの並び順を一括更新
        
        POST /api/codemasters/reorder/
        Body: {
            "codes": [
                {"id": 1, "sort_order": 0},
                {"id": 2, "sort_order": 10},
                ...
            ]
        }
        """
        codes_data = request.data.get('codes', [])
        if not codes_data:
            return Response(
                {'error': 'codes parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for item in codes_data:
            code_id = item.get('id')
            sort_order = item.get('sort_order')
            
            if code_id is not None and sort_order is not None:
                CodeMaster.objects.filter(id=code_id).update(sort_order=sort_order)
                updated_count += 1
        
        return Response({
            'success': True,
            'updated_count': updated_count
        })
