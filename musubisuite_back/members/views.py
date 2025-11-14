"""
メンバー管理ビューモジュール

このモジュールは、メンバー情報のCRUD操作を提供するAPIビューセットを定義します。

Classes:
    MemberViewSet: メンバー管理のためのViewSet
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Member
from .serializers import MemberSerializer, MemberListSerializer


class MemberViewSet(viewsets.ModelViewSet):
    """
    メンバー管理ViewSet
    
    メンバー情報のCRUD操作を提供します。
    リスト表示、詳細表示、作成、更新、削除の全操作をサポートします。
    
    Attributes:
        queryset (QuerySet): Memberクエリセット(userをselect_related)
        serializer_class (Serializer): デフォルトシリアライザー
        permission_classes (list): 認証必須
        filter_backends (list): フィルター、検索、ソートをサポート
        filterset_fields (list): role, departmentでフィルター可能
        search_fields (list): name, email, positionで検索可能
        ordering_fields (list): joined_at, nameでソート可能
        ordering (list): デフォルトソート順(name昇順)
    
    Endpoints:
        GET /api/members/ - メンバー一覧取得
        GET /api/members/:id/ - メンバー詳細取得
        POST /api/members/ - メンバー作成
        PUT /api/members/:id/ - メンバー更新
        PATCH /api/members/:id/ - メンバー部分更新
        DELETE /api/members/:id/ - メンバー削除
    
    Examples:
        >>> # メンバー一覧取得(部署でフィルター)
        >>> GET /api/members/?department=開発部
        
        >>> # メンバー検索(名前で検索)
        >>> GET /api/members/?search=佐藤
        
        >>> # メンバー一覧取得(入社日でソート)
        >>> GET /api/members/?ordering=-joined_at
    
    Note:
        - 全てのエンドポイントで認証が必要です
        - N+1問題回避のためuserをselect_related
        - list時は軽量なMemberListSerializerを使用
        - detail時は完全なMemberSerializerを使用
    """
    
    queryset = Member.objects.select_related('user').all()
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'department']
    search_fields = ['name', 'email', 'position']
    ordering_fields = ['joined_at', 'name']
    ordering = ['name']
    
    def get_serializer_class(self):
        """
        アクションに応じてシリアライザークラスを切り替えます
        
        Returns:
            Serializer: list時はMemberListSerializer、それ以外はMemberSerializer
        
        Note:
            - list時は必要最小限のフィールドのみを返します
            - retrieve/create/update時は全フィールドを返します
        """
        if self.action == 'list':
            return MemberListSerializer
        return MemberSerializer
