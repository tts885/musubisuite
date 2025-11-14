"""
タスク管理ビューモジュール

このモジュールは、タスク情報のCRUD操作を提供するAPIビューセットを定義します。

Classes:
    TaskViewSet: タスク管理のためのViewSet
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Task
from .serializers import TaskSerializer, TaskListSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    タスク管理ViewSet
    
    タスク情報のCRUD操作を提供します。
    リスト表示、詳細表示、作成、更新、削除の全操作をサポートします。
    
    Attributes:
        queryset (QuerySet): Taskクエリセット(project, assignee, created_byをselect_related)
        serializer_class (Serializer): デフォルトシリアライザー
        permission_classes (list): 認証必須
        filter_backends (list): フィルター、検索、ソートをサポート
        filterset_fields (list): project, status, priority, assigneeでフィルター可能
        search_fields (list): title, descriptionで検索可能
        ordering_fields (list): created_at, due_date, priorityでソート可能
        ordering (list): デフォルトソート順(created_at降順)
    
    Endpoints:
        GET /api/tasks/ - タスク一覧取得
        GET /api/tasks/:id/ - タスク詳細取得
        POST /api/tasks/ - タスク作成
        PUT /api/tasks/:id/ - タスク更新
        PATCH /api/tasks/:id/ - タスク部分更新
        DELETE /api/tasks/:id/ - タスク削除
    
    Examples:
        >>> # タスク一覧取得(プロジェクトでフィルター)
        >>> GET /api/tasks/?project=123
        
        >>> # タスク検索(タイトルで検索)
        >>> GET /api/tasks/?search=実装
        
        >>> # タスク一覧取得(ステータスでフィルター、期限でソート)
        >>> GET /api/tasks/?status=in-progress&ordering=due_date
    
    Note:
        - 全てのエンドポイントで認証が必要です
        - N+1問題回避のためproject, assignee, created_byをselect_related
        - list時は軽量なTaskListSerializerを使用
        - detail時は完全なTaskSerializerを使用
    """
    
    queryset = Task.objects.select_related('project', 'assignee', 'created_by').all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'priority', 'assignee']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        アクションに応じてシリアライザークラスを切り替えます
        
        Returns:
            Serializer: list時はTaskListSerializer、それ以外はTaskSerializer
        
        Note:
            - list時は必要最小限のフィールドのみを返します
            - retrieve/create/update時は全フィールドを返します
        """
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer
