"""
プロジェクト管理ビュー

Django REST FrameworkのViewSetを使用した
プロジェクトのCRUD操作を提供します。

Author: 開発チーム
Created: 2025-11-14
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, Attachment, Comment
from .serializers import (
    ProjectSerializer, ProjectListSerializer,
    AttachmentSerializer, CommentSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    プロジェクトのCRUD操作を提供するViewSet
    
    このViewSetは以下の機能を提供します:
    - プロジェクト一覧取得(フィルタリング、検索、ページネーション対応)
    - プロジェクト詳細取得(関連データを含む)
    - プロジェクト作成(バリデーション付き)
    - プロジェクト更新(部分更新対応)
    - プロジェクト削除
    - カスタムアクション(添付ファイル、コメント、統計情報取得)
    
    Attributes:
        queryset (QuerySet): プロジェクトのクエリセット
        serializer_class (Serializer): 使用するシリアライザー
        permission_classes (list): 必要な権限
        filter_backends (list): フィルターバックエンド
        filterset_fields (list): フィルター可能なフィールド
        search_fields (list): 検索対象フィールド
        ordering_fields (list): ソート可能フィールド
    
    Endpoints:
        GET    /api/projects/              - 一覧取得
        POST   /api/projects/              - 作成
        GET    /api/projects/{id}/         - 詳細取得
        PUT    /api/projects/{id}/         - 全体更新
        PATCH  /api/projects/{id}/         - 部分更新
        DELETE /api/projects/{id}/         - 削除
        GET    /api/projects/{id}/attachments/ - 添付ファイル一覧
        GET    /api/projects/{id}/comments/ - コメント一覧
        GET    /api/projects/dashboard_stats/ - 統計情報
    
    Query Parameters:
        status (str): ステータスフィルター ('planning', 'active', など)
        priority (str): 優先度フィルター ('low', 'medium', 'high', 'urgent')
        client (str): クライアントIDフィルター
        owner (str): オーナーIDフィルター
        search (str): 検索キーワード(名前、説明)
        ordering (str): ソート順 ('-created_at', 'name', など)
    
    Examples:
        >>> # 一覧取得
        >>> GET /api/projects/
        >>> 
        >>> # フィルタリング
        >>> GET /api/projects/?status=active&priority=high
        >>> 
        >>> # 検索
        >>> GET /api/projects/?search=テスト
        >>> 
        >>> # ソート
        >>> GET /api/projects/?ordering=-created_at
        >>> 
        >>> # 作成
        >>> POST /api/projects/
        >>> {
        >>>   "name": "新規プロジェクト",
        >>>   "description": "説明",
        >>>   "client_id": "1",
        >>>   "start_date": "2025-01-01",
        >>>   "end_date": "2025-12-31",
        >>>   "status": "planning"
        >>> }
    
    Note:
        - 開発環境では認証不要(permission_classes = [])
        - 本番環境では IsAuthenticated を使用すること
        - N+1問題を避けるため、select_relatedとprefetch_relatedを使用
    
    See Also:
        - ProjectSerializer: 基本シリアライザー
        - ProjectListSerializer: 一覧用シリアライザー
        - Project: プロジェクトモデル
    """
    
    # N+1問題を回避するため、関連データをプリフェッチ
    queryset = Project.objects.select_related('client', 'owner').prefetch_related('members').all()
    serializer_class = ProjectSerializer
    permission_classes = []  # 開発環境では認証不要(本番環境では要変更)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'client', 'owner']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'progress']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        アクションに応じた適切なSerializerクラスを返す
        
        一覧取得時は軽量なProjectListSerializerを使用し、
        詳細取得・作成・更新時は完全なProjectSerializerを使用します。
        
        Returns:
            Serializer: アクションに対応するシリアライザークラス
        
        Note:
            - 一覧取得: ProjectListSerializer(関連データ最小限)
            - 詳細取得: ProjectSerializer(関連データを全て含む)
            - 作成/更新: ProjectSerializer(入力検証用)
        """
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        """
        プロジェクトの添付ファイル一覧を取得する
        
        指定されたプロジェクトに紐づく全ての添付ファイルを
        アップロード日時の降順で返します。
        
        Args:
            request (Request): HTTPリクエストオブジェクト
            pk (str): プロジェクトID
        
        Returns:
            Response: 添付ファイル一覧
        
        Examples:
            >>> GET /api/projects/123/attachments/
            >>> [
            >>>   {
            >>>     "id": "1",
            >>>     "file_name": "仕様書.pdf",
            >>>     "file_size": 1024000,
            >>>     "uploaded_at": "2025-01-01T10:00:00Z"
            >>>   }
            >>> ]
        
        Note:
            添付ファイルはアップロード日時の降順でソートされます
        """
        from services.project_service import ProjectService
        project = self.get_object()
        attachments = ProjectService.get_project_attachments(project)
        serializer = AttachmentSerializer(attachments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        プロジェクトのコメント一覧を取得する
        
        指定されたプロジェクトに紐づく全てのコメントを
        作成日時の昇順で返します。
        
        Args:
            request (Request): HTTPリクエストオブジェクト
            pk (str): プロジェクトID
        
        Returns:
            Response: コメント一覧
        
        Examples:
            >>> GET /api/projects/123/comments/
            >>> [
            >>>   {
            >>>     "id": "1",
            >>>     "content": "進捗確認をお願いします",
            >>>     "author": {"id": "1", "name": "田中太郎"},
            >>>     "created_at": "2025-01-01T10:00:00Z"
            >>>   }
            >>> ]
        
        Note:
            コメントは作成日時の昇順でソートされます(古い順)
        """
        from services.project_service import ProjectService
        project = self.get_object()
        comments = ProjectService.get_project_comments(project)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        ダッシュボード統計情報を取得する
        
        プロジェクトの総数、ステータス別の集計など、
        ダッシュボード表示に必要な統計データを計算して返します。
        
        Args:
            request (Request): HTTPリクエストオブジェクト
        
        Returns:
            Response: 統計情報オブジェクト
        
        Response Format:
            {
                "total_projects": int,      // 総プロジェクト数
                "active_projects": int,     // 進行中のプロジェクト数
                "completed_projects": int   // 完了したプロジェクト数
            }
        
        Examples:
            >>> GET /api/projects/dashboard_stats/
            >>> {
            >>>   "total_projects": 100,
            >>>   "active_projects": 45,
            >>>   "completed_projects": 50
            >>> }
        
        Note:
            - この統計はキャッシュされる可能性があります
            - 大規模データの場合はパフォーマンスに注意が必要です
        """
        from services.project_service import ProjectService
        stats = ProjectService.get_project_stats()
        return Response(stats)


class AttachmentViewSet(viewsets.ModelViewSet):
    """
    添付ファイルのCRUD操作を提供するViewSet
    
    プロジェクトに関連する添付ファイルの管理機能を提供します。
    
    Attributes:
        queryset (QuerySet): 添付ファイルのクエリセット
        serializer_class (Serializer): 使用するシリアライザー
        permission_classes (list): 必要な権限
        filter_backends (list): フィルターバックエンド
        filterset_fields (list): フィルター可能なフィールド
    
    Endpoints:
        GET    /api/attachments/           - 一覧取得
        POST   /api/attachments/           - 作成(アップロード)
        GET    /api/attachments/{id}/      - 詳細取得
        PATCH  /api/attachments/{id}/      - 部分更新
        DELETE /api/attachments/{id}/      - 削除
    
    Query Parameters:
        project (str): プロジェクトIDフィルター
        ordering (str): ソート順 ('-uploaded_at', など)
    
    Examples:
        >>> # プロジェクトの添付ファイル一覧
        >>> GET /api/attachments/?project=123
        >>> 
        >>> # 添付ファイル作成
        >>> POST /api/attachments/
        >>> {
        >>>   "project": "123",
        >>>   "file_name": "仕様書.pdf",
        >>>   "file_size": 1024000,
        >>>   "file_type": "application/pdf",
        >>>   "url": "https://storage.example.com/files/spec.pdf"
        >>> }
    
    Note:
        - 認証が必要です(IsAuthenticated)
        - N+1問題を避けるため、select_relatedを使用
        - 添付ファイルはアップロード日時の降順でソートされます
    """
    
    # N+1問題を回避するため、関連データをプリフェッチ
    queryset = Attachment.objects.select_related('project', 'uploaded_by').all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project']
    ordering = ['-uploaded_at']


class CommentViewSet(viewsets.ModelViewSet):
    """
    コメントのCRUD操作を提供するViewSet
    
    プロジェクトおよびタスクに関連するコメントの管理機能を提供します。
    
    Attributes:
        queryset (QuerySet): コメントのクエリセット
        serializer_class (Serializer): 使用するシリアライザー
        permission_classes (list): 必要な権限
        filter_backends (list): フィルターバックエンド
        filterset_fields (list): フィルター可能なフィールド
    
    Endpoints:
        GET    /api/comments/              - 一覧取得
        POST   /api/comments/              - 作成
        GET    /api/comments/{id}/         - 詳細取得
        PATCH  /api/comments/{id}/         - 部分更新
        DELETE /api/comments/{id}/         - 削除
    
    Query Parameters:
        project (str): プロジェクトIDフィルター
        task (str): タスクIDフィルター
        ordering (str): ソート順 ('created_at', '-created_at')
    
    Examples:
        >>> # プロジェクトのコメント一覧
        >>> GET /api/comments/?project=123
        >>> 
        >>> # タスクのコメント一覧
        >>> GET /api/comments/?task=456
        >>> 
        >>> # コメント作成
        >>> POST /api/comments/
        >>> {
        >>>   "project": "123",
        >>>   "task": "456",
        >>>   "content": "進捗確認をお願いします"
        >>> }
    
    Note:
        - 認証が必要です(IsAuthenticated)
        - N+1問題を避けるため、select_relatedを使用
        - コメントは作成日時の昇順でソートされます(古い順)
    """
    
    # N+1問題を回避するため、関連データをプリフェッチ
    queryset = Comment.objects.select_related('project', 'task', 'author').all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'task']
    ordering = ['created_at']
