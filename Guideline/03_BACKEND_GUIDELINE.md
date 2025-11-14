# バックエンド開発ガイドライン

## 📋 目次
- [開発環境](#開発環境)
- [プロジェクト構造](#プロジェクト構造)
- [Django設定](#django設定)
- [モデル設計](#モデル設計)
- [Serializer設計](#serializer設計)
- [ViewSet実装](#viewset実装)
- [URL設計](#url設計)
- [認証・認可](#認証認可)
- [エラーハンドリング](#エラーハンドリング)

## 開発環境

### 必須ツール
- **Python**: 3.9以上
- **pip**: 最新版
- **Django**: 5.x
- **Django REST Framework**: 3.x

### セットアップ
```powershell
# 仮想環境作成
python -m venv venv

# 仮想環境アクティベート
.\venv\Scripts\Activate.ps1

# 依存関係インストール
pip install -r requirements.txt

# マイグレーション実行
python manage.py makemigrations
python manage.py migrate

# スーパーユーザー作成
python manage.py createsuperuser

# 開発サーバー起動
python manage.py runserver

# テスト実行
python manage.py test

# コードフォーマット (Black)
black .

# Lint (Flake8)
flake8 .
```

## プロジェクト構造

### ディレクトリ構成
```
musubisuite_back/
├── manage.py                # Django管理スクリプト
├── db.sqlite3              # SQLiteデータベース
├── requirements.txt        # Python依存関係
│
├── config/                 # プロジェクト設定
│   ├── __init__.py
│   ├── settings.py        # Django設定
│   ├── urls.py            # ルートURLconf
│   ├── wsgi.py            # WSGIエントリーポイント
│   └── asgi.py            # ASGIエントリーポイント
│
├── projects/              # プロジェクトアプリ
│   ├── __init__.py
│   ├── models.py         # データモデル
│   ├── serializers.py    # シリアライザー
│   ├── views.py          # ビューロジック
│   ├── admin.py          # Admin設定
│   ├── apps.py           # アプリ設定
│   ├── tests.py          # テスト
│   └── migrations/       # マイグレーション
│
├── members/              # メンバーアプリ
│   └── ... (同上)
│
├── clients/              # クライアントアプリ
│   └── ... (同上)
│
├── tasks/                # タスクアプリ
│   └── ... (同上)
│
└── activities/           # アクティビティアプリ
    └── ... (同上)
```

### ファイル命名規則
- **snake_case**: すべてのPythonファイル
- **PascalCase**: クラス名
- **UPPER_CASE**: 定数

## コメント記述規則

**重要: このプロジェクトでは、全てのソースコードのコメントは丁寧な日本語で記述します。**

詳細なコメント規約は [`06_CODING_STANDARDS.md`](./06_CODING_STANDARDS.md) を参照してください。

### Django/Python バックエンドのコメント例

#### モデルクラスのdocstring

```python
"""
プロジェクト管理モデル

企業のプロジェクト情報を管理します。
各プロジェクトは複数のタスク、メンバー、クライアントと
関連付けることができます。

Author: 開発チーム
Created: 2025-01-14
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from datetime import date

class Project(models.Model):
    """
    プロジェクトモデル
    
    企業のプロジェクト情報を管理します。
    各プロジェクトは複数のタスク、メンバー、クライアントと
    関連付けることができます。
    
    Attributes:
        name (str): プロジェクト名（最大200文字）
        description (str): プロジェクトの詳細説明
        start_date (date): プロジェクト開始日
        end_date (date): プロジェクト終了日（任意）
        status (str): プロジェクトのステータス
            - 'planning': 計画中
            - 'active': 進行中
            - 'completed': 完了
            - 'on_hold': 保留
        budget (Decimal): 予算（円単位）
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    
    Meta:
        db_table (str): データベースのテーブル名
        ordering (list): デフォルトの並び順
        verbose_name (str): 管理画面での表示名
        indexes (list): インデックス定義
    
    Examples:
        >>> # プロジェクト作成
        >>> project = Project.objects.create(
        ...     name="新規プロジェクト",
        ...     start_date=date.today(),
        ...     status='planning'
        ... )
        >>> 
        >>> # ステータス変更
        >>> project.activate()
        >>> 
        >>> # 期限切れチェック
        >>> if project.is_overdue:
        ...     send_notification(project)
    
    Note:
        - 削除は論理削除で実装することを推奨
        - end_dateがNoneの場合、期限なしと判断
        - budgetは必須ではない（予算未定のプロジェクトに対応）
    
    See Also:
        - Task: プロジェクトに紐づくタスク
        - Member: プロジェクトメンバー
        - Client: プロジェクトのクライアント
    """
    
    STATUS_CHOICES = [
        ('planning', '計画中'),
        ('active', '進行中'),
        ('completed', '完了'),
        ('on_hold', '保留'),
    ]
    
    name = models.CharField(
        max_length=200,
        verbose_name='プロジェクト名',
        help_text='プロジェクトの識別名（最大200文字）'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='説明',
        help_text='プロジェクトの詳細説明'
    )
    
    start_date = models.DateField(
        verbose_name='開始日',
        help_text='プロジェクト開始予定日'
    )
    
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='終了日',
        help_text='プロジェクト終了予定日'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning',
        verbose_name='ステータス',
        db_index=True,  # 検索パフォーマンス向上のためインデックス作成
    )
    
    budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='予算',
        help_text='プロジェクト予算（円）'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='作成日時'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新日時'
    )
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']  # 新しい順
        verbose_name = 'プロジェクト'
        verbose_name_plural = 'プロジェクト'
        indexes = [
            # 複合インデックス: ステータス別の新着順検索を高速化
            models.Index(fields=['status', '-created_at']),
            # 日付範囲検索を高速化
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        """文字列表現"""
        return self.name
    
    @property
    def is_overdue(self) -> bool:
        """
        プロジェクトが期限切れかどうかを判定する
        
        終了日が現在日時より前で、かつ完了していない場合に
        期限切れと判断します。
        
        Returns:
            bool: 期限切れの場合True、それ以外はFalse
        
        Examples:
            >>> project.end_date = date(2024, 12, 31)
            >>> project.status = 'active'
            >>> project.is_overdue  # 2025年の場合
            True
        
        Note:
            - 終了日が設定されていない場合はFalseを返す
            - 完了済みプロジェクトは期限切れとみなさない
        """
        if self.end_date and self.status != 'completed':
            return timezone.now().date() > self.end_date
        return False
    
    @property
    def duration_days(self) -> int | None:
        """
        プロジェクト期間を日数で取得する
        
        開始日から終了日までの日数を計算します。
        
        Returns:
            int | None: プロジェクト期間（日数）
                終了日が設定されていない場合はNone
        
        Examples:
            >>> project.start_date = date(2025, 1, 1)
            >>> project.end_date = date(2025, 1, 31)
            >>> project.duration_days
            30
        """
        if self.end_date:
            return (self.end_date - self.start_date).days
        return None
    
    def activate(self) -> None:
        """
        プロジェクトをアクティブ状態に変更する
        
        プロジェクトのステータスを'active'に変更し、
        関連するメンバーに通知を送信します。
        
        Raises:
            ValidationError: すでにアクティブな場合
            ValidationError: 開始日が未来の場合
        
        Examples:
            >>> project.status = 'planning'
            >>> project.activate()
            >>> print(project.status)
            'active'
        
        Note:
            この操作はトランザクション内で実行されます
        """
        from django.core.exceptions import ValidationError
        
        if self.status == 'active':
            raise ValidationError('既にアクティブです')
        
        if self.start_date > date.today():
            raise ValidationError('開始日が未来です')
        
        self.status = 'active'
        self.save(update_fields=['status', 'updated_at'])
        
        # メンバーに通知を送信
        self._notify_members('プロジェクトが開始されました')
    
    def complete(self) -> None:
        """
        プロジェクトを完了状態にする
        
        プロジェクトのステータスを'completed'に変更します。
        未完了のタスクがある場合は警告を表示します。
        
        Raises:
            ValidationError: 未完了のタスクがある場合
        
        Examples:
            >>> project.complete()
            >>> print(project.status)
            'completed'
        
        Note:
            - 完了時に終了日が設定されていない場合、現在日時が設定されます
            - 完了通知が関係者に自動送信されます
        """
        from django.core.exceptions import ValidationError
        
        # 未完了タスクの確認
        incomplete_tasks = self.tasks.exclude(status='done').count()
        if incomplete_tasks > 0:
            raise ValidationError(
                f'{incomplete_tasks}件の未完了タスクがあります'
            )
        
        self.status = 'completed'
        
        # 終了日が未設定の場合、現在日を設定
        if not self.end_date:
            self.end_date = date.today()
        
        self.save(update_fields=['status', 'end_date', 'updated_at'])
        
        # 完了通知を送信
        self._notify_members('プロジェクトが完了しました')
    
    def clean(self) -> None:
        """
        モデルレベルのバリデーション
        
        save()実行前に呼び出され、データの整合性をチェックします。
        
        Raises:
            ValidationError: バリデーションエラーがある場合
        
        Note:
            - 終了日が開始日より前の場合はエラー
            - 予算が負の値の場合はエラー
        """
        from django.core.exceptions import ValidationError
        
        errors = {}
        
        # 日付の整合性チェック
        if self.end_date and self.start_date:
            if self.end_date < self.start_date:
                errors['end_date'] = '終了日は開始日以降の日付を指定してください'
        
        # 予算のチェック
        if self.budget is not None and self.budget < 0:
            errors['budget'] = '予算は0以上で指定してください'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs) -> None:
        """
        保存処理
        
        保存前にバリデーションを実行します。
        
        Note:
            full_clean()を呼び出すことで、cleanメソッドと
            フィールドレベルのバリデーションが実行されます
        """
        self.full_clean()
        super().save(*args, **kwargs)
    
    def _notify_members(self, message: str) -> None:
        """
        プロジェクトメンバーに通知を送信する（内部メソッド）
        
        Args:
            message (str): 通知メッセージ
        
        Note:
            実際の通知送信はタスクキューで非同期処理することを推奨
        """
        # TODO: 通知機能の実装
        pass
```

#### ViewSetのdocstring

```python
"""
プロジェクト管理ビュー

Django REST FrameworkのViewSetを使用した
プロジェクトのCRUD操作を提供します。
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Prefetch
from .models import Project, Task
from .serializers import ProjectSerializer, ProjectDetailSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    """
    プロジェクトのCRUD操作を提供するViewSet
    
    このViewSetは以下の機能を提供します:
    - プロジェクト一覧取得（フィルタリング、検索、ページネーション対応）
    - プロジェクト詳細取得（関連データを含む）
    - プロジェクト作成（バリデーション付き）
    - プロジェクト更新（部分更新対応）
    - プロジェクト削除（論理削除）
    - カスタムアクション（完了、統計情報取得など）
    
    Attributes:
        queryset (QuerySet): プロジェクトのクエリセット
        serializer_class (Serializer): 使用するシリアライザー
        permission_classes (list): 必要な権限
        filter_backends (list): フィルターバックエンド
        search_fields (list): 検索対象フィールド
        ordering_fields (list): ソート可能フィールド
    
    Endpoints:
        GET    /api/projects/              - 一覧取得
        POST   /api/projects/              - 作成
        GET    /api/projects/{id}/         - 詳細取得
        PUT    /api/projects/{id}/         - 全体更新
        PATCH  /api/projects/{id}/         - 部分更新
        DELETE /api/projects/{id}/         - 削除
        POST   /api/projects/{id}/complete/ - 完了
        GET    /api/projects/active/       - 進行中一覧
        GET    /api/projects/{id}/statistics/ - 統計情報
    
    Query Parameters:
        status (str): ステータスフィルター ('planning', 'active', etc.)
        search (str): 検索キーワード（名前、説明）
        start_date_from (str): 開始日の範囲フィルター（開始）
        start_date_to (str): 開始日の範囲フィルター（終了）
        ordering (str): ソート順 ('-created_at', 'name', etc.)
    
    Examples:
        >>> # 一覧取得
        >>> GET /api/projects/
        >>> 
        >>> # フィルタリング
        >>> GET /api/projects/?status=active&search=テスト
        >>> 
        >>> # 作成
        >>> POST /api/projects/
        >>> {
        >>>   "name": "新規プロジェクト",
        >>>   "description": "説明",
        >>>   "start_date": "2025-01-01"
        >>> }
        >>> 
        >>> # 完了
        >>> POST /api/projects/123/complete/
    
    Note:
        - 削除は論理削除で、is_deletedフラグを立てるのみ
        - プロジェクトのオーナーのみが編集・削除可能
        - 一覧取得時はN+1問題を避けるためprefetch_relatedを使用
    
    See Also:
        - ProjectSerializer: 基本シリアライザー
        - ProjectDetailSerializer: 詳細シリアライザー
        - Project: プロジェクトモデル
    """
    
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        アクションに応じた適切なSerializerクラスを返す
        
        Returns:
            Serializer: アクションに対応するシリアライザークラス
        
        Note:
            - 詳細取得: ProjectDetailSerializer（関連データ含む）
            - 一覧取得: ProjectSerializer（軽量版）
            - 作成/更新: 入力検証用Serializer
        """
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        """
        ユーザーとクエリパラメータに応じたクエリセットを返す
        
        フィルタリング、検索、関連データのプリフェッチを行います。
        N+1問題を避けるため、select_relatedとprefetch_relatedを使用。
        
        Returns:
            QuerySet: フィルタリングとプリフェッチが適用されたクエリセット
        
        Query Parameters:
            status (str): ステータスでフィルター
            start_date_from (str): 開始日の下限
            start_date_to (str): 開始日の上限
            search (str): 名前または説明で検索
        
        Examples:
            >>> # 進行中のプロジェクトのみ取得
            >>> queryset = self.get_queryset().filter(status='active')
            >>> 
            >>> # 2025年開始のプロジェクト
            >>> queryset = self.get_queryset().filter(
            ...     start_date__year=2025
            ... )
        
        Note:
            - 論理削除されたプロジェクトは除外される
            - パフォーマンス最適化のため、必ず関連データをプリフェッチ
        """
        # 基本クエリセット（論理削除されていないもの）
        queryset = Project.objects.filter(is_deleted=False)
        
        # 関連データをプリフェッチ（N+1問題を回避）
        # select_related: 1対1、多対1の関係
        # prefetch_related: 多対多、1対多の関係
        queryset = queryset.select_related().prefetch_related(
            # メンバー情報をプリフェッチ
            'members',
            # タスク情報をプリフェッチ（完了済みタスク数の計算用）
            Prefetch(
                'tasks',
                queryset=Task.objects.filter(status='done'),
                to_attr='completed_tasks'
            )
        )
        
        # ステータスフィルター
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # 日付範囲フィルター
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        # 検索クエリ（名前または説明で部分一致）
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        プロジェクトを完了状態に変更する
        
        プロジェクトのステータスをcompletedに変更します。
        未完了のタスクがある場合はエラーを返します。
        
        Args:
            request (Request): HTTPリクエストオブジェクト
            pk (str): プロジェクトID
        
        Returns:
            Response: 更新されたプロジェクトデータ
        
        Raises:
            ValidationError: 未完了タスクがある場合
            NotFound: プロジェクトが存在しない場合
        
        Examples:
            >>> POST /api/projects/123/complete/
            >>> {
            >>>   "id": "123",
            >>>   "name": "プロジェクト",
            >>>   "status": "completed"
            >>> }
        
        Note:
            - この操作は元に戻すことができません
            - 完了時に自動で終了日が設定されます
            - メンバーに完了通知が送信されます
        """
        project = self.get_object()
        
        try:
            project.complete()
            serializer = self.get_serializer(project)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        進行中のプロジェクト一覧を取得する
        
        ステータスが'active'のプロジェクトのみを返します。
        
        Args:
            request (Request): HTTPリクエストオブジェクト
        
        Returns:
            Response: 進行中のプロジェクト配列
        
        Examples:
            >>> GET /api/projects/active/
            >>> [
            >>>   {
            >>>     "id": "123",
            >>>     "name": "プロジェクトA",
            >>>     "status": "active"
            >>>   }
            >>> ]
        
        Note:
            通常の一覧取得と同様にページネーションが適用されます
        """
        active_projects = self.get_queryset().filter(status='active')
        
        # ページネーションを適用
        page = self.paginate_queryset(active_projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(active_projects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        プロジェクトの統計情報を取得する
        
        タスク数、完了率、メンバー数、残り日数などの
        統計情報を計算して返します。
        
        Args:
            request (Request): HTTPリクエストオブジェクト
            pk (str): プロジェクトID
        
        Returns:
            Response: 統計情報オブジェクト
        
        Response Format:
            {
                "total_tasks": int,
                "completed_tasks": int,
                "completion_rate": float,
                "member_count": int,
                "days_remaining": int | null,
                "is_overdue": bool
            }
        
        Examples:
            >>> GET /api/projects/123/statistics/
            >>> {
            >>>   "total_tasks": 50,
            >>>   "completed_tasks": 35,
            >>>   "completion_rate": 70.0,
            >>>   "member_count": 5,
            >>>   "days_remaining": 10,
            >>>   "is_overdue": false
            >>> }
        
        Note:
            - 完了率は小数点第1位まで計算
            - 終了日が未設定の場合、days_remainingはnull
        """
        project = self.get_object()
        
        # タスク統計をアノテーション付きで取得
        task_stats = project.tasks.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='done'))
        )
        
        total_tasks = task_stats['total'] or 0
        completed_tasks = task_stats['completed'] or 0
        
        # 完了率を計算
        completion_rate = 0.0
        if total_tasks > 0:
            completion_rate = round(
                (completed_tasks / total_tasks) * 100,
                1
            )
        
        # 残り日数を計算
        days_remaining = None
        if project.end_date:
            delta = (project.end_date - date.today()).days
            days_remaining = delta
        
        stats = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_rate': completion_rate,
            'member_count': project.members.count(),
            'days_remaining': days_remaining,
            'is_overdue': project.is_overdue,
        }
        
        return Response(stats)
```

#### Serializerのdocstring

```python
"""
プロジェクトシリアライザー

プロジェクトモデルのJSONシリアライゼーションと
バリデーションを提供します。
"""

from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    """
    プロジェクトシリアライザー
    
    プロジェクトモデルをJSON形式にシリアライズし、
    入力データのバリデーションを行います。
    
    Fields:
        id (UUID): プロジェクトID（読み取り専用）
        name (str): プロジェクト名（必須、最大200文字）
        description (str): 説明（任意）
        start_date (date): 開始日（必須）
        end_date (date): 終了日（任意）
        status (str): ステータス（デフォルト: planning）
        budget (decimal): 予算（任意、0以上）
        member_count (int): メンバー数（読み取り専用）
        task_count (int): タスク数（読み取り専用）
        is_overdue (bool): 期限切れフラグ（読み取り専用）
        created_at (datetime): 作成日時（読み取り専用）
        updated_at (datetime): 更新日時（読み取り専用）
    
    Validation Rules:
        - name: 3文字以上200文字以下
        - start_date: 必須
        - end_date: start_date以降の日付
        - budget: 0以上
        - status: 完了の場合はend_dateが必須
    
    Examples:
        >>> # シリアライズ
        >>> serializer = ProjectSerializer(project)
        >>> print(serializer.data)
        {'id': '123', 'name': 'プロジェクト', ...}
        >>> 
        >>> # デシリアライズ（作成）
        >>> serializer = ProjectSerializer(data=request.data)
        >>> if serializer.is_valid():
        >>>     project = serializer.save()
        >>> 
        >>> # デシリアライズ（更新）
        >>> serializer = ProjectSerializer(project, data=request.data, partial=True)
        >>> if serializer.is_valid():
        >>>     serializer.save()
    
    Note:
        - member_countとtask_countは計算フィールド
        - N+1問題を避けるため、ViewSetでprefetch_relatedを使用すること
    
    See Also:
        - ProjectDetailSerializer: 関連データを含む詳細版
        - Project: プロジェクトモデル
    """
    
    # 読み取り専用フィールド
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    # 計算フィールド（SerializerMethodField）
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'start_date',
            'end_date',
            'status',
            'budget',
            'member_count',
            'task_count',
            'is_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj: Project) -> int:
        """
        プロジェクトのメンバー数を取得する
        
        Args:
            obj (Project): プロジェクトインスタンス
        
        Returns:
            int: メンバー数
        
        Note:
            ViewSetでprefetch_related('members')を使用している場合、
            追加のクエリは発生しません
        """
        return obj.members.count()
    
    def get_task_count(self, obj: Project) -> int:
        """
        プロジェクトのタスク数を取得する
        
        Args:
            obj (Project): プロジェクトインスタンス
        
        Returns:
            int: タスク数
        
        Note:
            ViewSetでprefetch_related('tasks')を使用している場合、
            追加のクエリは発生しません
        """
        return obj.tasks.count()
    
    def validate_name(self, value: str) -> str:
        """
        プロジェクト名のバリデーション
        
        Args:
            value (str): プロジェクト名
        
        Returns:
            str: バリデーション済みのプロジェクト名
        
        Raises:
            ValidationError: バリデーションエラーがある場合
        
        Note:
            - 最小3文字、最大200文字
            - 先頭・末尾の空白は自動でトリム
        """
        value = value.strip()
        
        if len(value) < 3:
            raise serializers.ValidationError(
                "プロジェクト名は3文字以上で入力してください"
            )
        
        return value
    
    def validate_end_date(self, value):
        """
        終了日のバリデーション
        
        Args:
            value (date): 終了日
        
        Returns:
            date: バリデーション済みの終了日
        
        Raises:
            ValidationError: 終了日が開始日より前の場合
        
        Note:
            開始日との整合性チェックはvalidate()で行う
        """
        # 終了日が指定されている場合のみチェック
        if value:
            start_date = self.initial_data.get('start_date')
            if start_date and value < start_date:
                raise serializers.ValidationError(
                    "終了日は開始日以降の日付を指定してください"
                )
        
        return value
    
    def validate_budget(self, value):
        """
        予算のバリデーション
        
        Args:
            value (Decimal): 予算
        
        Returns:
            Decimal: バリデーション済みの予算
        
        Raises:
            ValidationError: 予算が負の値の場合
        """
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "予算は0以上で指定してください"
            )
        
        return value
    
    def validate(self, data):
        """
        全体バリデーション
        
        複数フィールドにまたがるバリデーションを行います。
        
        Args:
            data (dict): バリデーション対象データ
        
        Returns:
            dict: バリデーション済みデータ
        
        Raises:
            ValidationError: バリデーションエラーがある場合
        
        Note:
            - ステータスと終了日の整合性チェック
            - 開始日と終了日の順序チェック
        """
        # ステータスが完了の場合、終了日が必須
        if data.get('status') == 'completed':
            if not data.get('end_date'):
                raise serializers.ValidationError({
                    'end_date': '完了ステータスには終了日が必要です'
                })
        
        # 開始日と終了日の整合性チェック（両方指定されている場合）
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({
                    'end_date': '終了日は開始日以降の日付を指定してください'
                })
        
        return data
```

## Django設定

### settings.py構成

```python
# config/settings.py
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# セキュリティ設定
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# アプリケーション定義
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # サードパーティ
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # ローカルアプリ
    'projects',
    'members',
    'clients',
    'tasks',
    'activities',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS (最初に配置)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS設定
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# REST Framework設定
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'EXCEPTION_HANDLER': 'config.exceptions.custom_exception_handler',
}

# JWT設定
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# データベース設定
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 本番環境ではPostgreSQL
if not DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# 国際化
LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

# 静的ファイル
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# メディアファイル
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# デフォルトプライマリーキー
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

### 環境変数管理

```python
# .env.example
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# データベース (本番環境)
DB_NAME=musubisuite_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Dataverse
DATAVERSE_URL=https://your-org.crm.dynamics.com
DATAVERSE_CLIENT_ID=your-client-id
DATAVERSE_CLIENT_SECRET=your-client-secret
DATAVERSE_TENANT_ID=your-tenant-id
```

## モデル設計

### モデル設計原則

#### 1. 基本モデル構造
```python
# projects/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Project(models.Model):
    """
    プロジェクトモデル
    
    プロジェクトの基本情報を管理する
    """
    
    # ステータス選択肢
    STATUS_CHOICES = [
        ('planning', '計画中'),
        ('active', '進行中'),
        ('completed', '完了'),
        ('on_hold', '保留'),
    ]
    
    # 基本フィールド
    name = models.CharField(
        max_length=200,
        verbose_name='プロジェクト名',
        help_text='プロジェクトの名称'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='説明',
        help_text='プロジェクトの詳細説明'
    )
    
    # 日付フィールド
    start_date = models.DateField(
        verbose_name='開始日',
        help_text='プロジェクト開始予定日'
    )
    
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='終了日',
        help_text='プロジェクト終了予定日'
    )
    
    # ステータス
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning',
        verbose_name='ステータス',
        db_index=True,  # 検索用インデックス
    )
    
    # 数値フィールド
    budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='予算',
        help_text='プロジェクト予算（円）'
    )
    
    # タイムスタンプ
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='作成日時'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新日時'
    )
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        verbose_name = 'プロジェクト'
        verbose_name_plural = 'プロジェクト'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def is_overdue(self):
        """プロジェクトが期限切れかどうか"""
        if self.end_date and self.status != 'completed':
            return timezone.now().date() > self.end_date
        return False
    
    @property
    def duration_days(self):
        """プロジェクト期間（日数）"""
        if self.end_date:
            return (self.end_date - self.start_date).days
        return None
    
    def complete(self):
        """プロジェクトを完了状態にする"""
        self.status = 'completed'
        self.save(update_fields=['status', 'updated_at'])
    
    def clean(self):
        """モデルレベルのバリデーション"""
        from django.core.exceptions import ValidationError
        
        if self.end_date and self.start_date:
            if self.end_date < self.start_date:
                raise ValidationError({
                    'end_date': '終了日は開始日以降の日付を指定してください'
                })
    
    def save(self, *args, **kwargs):
        """保存前のバリデーション実行"""
        self.full_clean()
        super().save(*args, **kwargs)
```

#### 2. リレーションシップ
```python
# members/models.py
class Member(models.Model):
    """メンバーモデル"""
    
    name = models.CharField(max_length=100, verbose_name='名前')
    email = models.EmailField(unique=True, verbose_name='メールアドレス')
    role = models.CharField(max_length=50, verbose_name='役割')
    
    # プロジェクトとの多対多リレーション
    projects = models.ManyToManyField(
        'projects.Project',
        related_name='members',
        through='ProjectMember',  # 中間テーブル
        verbose_name='プロジェクト'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'members'
        ordering = ['name']
        verbose_name = 'メンバー'
        verbose_name_plural = 'メンバー'
    
    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """プロジェクトメンバー中間テーブル"""
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='project_members'
    )
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='member_projects'
    )
    
    # 追加情報
    joined_date = models.DateField(verbose_name='参加日')
    role_in_project = models.CharField(
        max_length=50,
        verbose_name='プロジェクト内役割'
    )
    
    class Meta:
        db_table = 'project_members'
        unique_together = [['project', 'member']]  # 重複防止
        verbose_name = 'プロジェクトメンバー'
        verbose_name_plural = 'プロジェクトメンバー'


# tasks/models.py
class Task(models.Model):
    """タスクモデル"""
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '緊急'),
    ]
    
    STATUS_CHOICES = [
        ('todo', '未着手'),
        ('in_progress', '進行中'),
        ('review', 'レビュー中'),
        ('done', '完了'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='タスク名')
    description = models.TextField(blank=True, verbose_name='説明')
    
    # 外部キー
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='プロジェクト'
    )
    
    assigned_to = models.ForeignKey(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name='担当者'
    )
    
    # ステータス・優先度
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='todo',
        verbose_name='ステータス'
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='優先度'
    )
    
    # 期限
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='期限'
    )
    
    # タイムスタンプ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='完了日時'
    )
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return self.title
    
    def mark_as_done(self):
        """タスクを完了にする"""
        self.status = 'done'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])
```

#### 3. 抽象ベースモデル
```python
# common/models.py
class TimeStampedModel(models.Model):
    """タイムスタンプを持つ抽象ベースモデル"""
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    
    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """論理削除をサポートする抽象ベースモデル"""
    
    is_deleted = models.BooleanField(default=False, verbose_name='削除フラグ')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='削除日時')
    
    class Meta:
        abstract = True
    
    def soft_delete(self):
        """論理削除"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])


# 使用例
class Client(TimeStampedModel, SoftDeleteModel):
    """クライアントモデル"""
    
    name = models.CharField(max_length=200, verbose_name='クライアント名')
    email = models.EmailField(verbose_name='メールアドレス')
    
    class Meta:
        db_table = 'clients'
```

## Serializer設計

### Serializer実装パターン

#### 1. 基本Serializer
```python
# projects/serializers.py
from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    """プロジェクトシリアライザー"""
    
    # 読み取り専用フィールド
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    # カスタムフィールド
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'start_date',
            'end_date',
            'status',
            'budget',
            'member_count',
            'task_count',
            'is_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        """メンバー数を取得"""
        return obj.members.count()
    
    def get_task_count(self, obj):
        """タスク数を取得"""
        return obj.tasks.count()
    
    def validate_end_date(self, value):
        """終了日のバリデーション"""
        start_date = self.initial_data.get('start_date')
        if value and start_date:
            if value < start_date:
                raise serializers.ValidationError(
                    "終了日は開始日以降の日付を指定してください"
                )
        return value
    
    def validate_budget(self, value):
        """予算のバリデーション"""
        if value is not None and value < 0:
            raise serializers.ValidationError("予算は0以上で指定してください")
        return value
    
    def validate(self, data):
        """全体バリデーション"""
        # ステータスと期限の整合性チェック
        if data.get('status') == 'completed' and not data.get('end_date'):
            raise serializers.ValidationError({
                'end_date': '完了ステータスには終了日が必要です'
            })
        return data
```

#### 2. ネストされたSerializer
```python
# members/serializers.py
class MemberSerializer(serializers.ModelSerializer):
    """メンバーシリアライザー"""
    
    project_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'name', 'email', 'role', 'project_count']
    
    def get_project_count(self, obj):
        return obj.projects.count()


# ネストされたSerializer
class ProjectDetailSerializer(ProjectSerializer):
    """プロジェクト詳細シリアライザー（メンバー情報含む）"""
    
    members = MemberSerializer(many=True, read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['members']
```

#### 3. 書き込み用Serializer
```python
# 作成用
class CreateProjectSerializer(serializers.ModelSerializer):
    """プロジェクト作成用シリアライザー"""
    
    class Meta:
        model = Project
        fields = ['name', 'description', 'start_date', 'end_date', 'status', 'budget']
    
    def create(self, validated_data):
        """カスタム作成ロジック"""
        # 追加の処理
        project = Project.objects.create(**validated_data)
        # 通知送信など
        return project


# 更新用
class UpdateProjectSerializer(serializers.ModelSerializer):
    """プロジェクト更新用シリアライザー"""
    
    class Meta:
        model = Project
        fields = ['name', 'description', 'end_date', 'status', 'budget']
    
    def update(self, instance, validated_data):
        """カスタム更新ロジック"""
        # ステータス変更時の処理
        if 'status' in validated_data and validated_data['status'] == 'completed':
            instance.completed_at = timezone.now()
        
        return super().update(instance, validated_data)
```

## ViewSet実装

### ViewSet実装パターン

#### 1. ModelViewSet
```python
# projects/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Project
from .serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    CreateProjectSerializer,
    UpdateProjectSerializer,
)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    プロジェクトのCRUD操作を提供するViewSet
    
    list: プロジェクト一覧取得
    retrieve: プロジェクト詳細取得
    create: プロジェクト作成
    update: プロジェクト更新
    partial_update: プロジェクト部分更新
    destroy: プロジェクト削除
    """
    
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """アクションに応じたSerializerを返す"""
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action == 'create':
            return CreateProjectSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateProjectSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        """
        ユーザーに応じたクエリセットを返す
        フィルタリング、検索、プリフェッチを含む
        """
        queryset = Project.objects.select_related().prefetch_related('members', 'tasks')
        
        # ステータスフィルター
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # 日付範囲フィルター
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        # 検索クエリ
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """プロジェクト作成時の処理"""
        project = serializer.save()
        # 作成者を記録（将来的に追加）
        # project.created_by = self.request.user
        # project.save()
    
    def perform_update(self, serializer):
        """プロジェクト更新時の処理"""
        project = serializer.save()
        # 更新通知など
    
    def perform_destroy(self, instance):
        """プロジェクト削除時の処理"""
        # 論理削除の場合
        # instance.soft_delete()
        # 物理削除の場合
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """プロジェクトを完了にするカスタムアクション"""
        project = self.get_object()
        project.complete()
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """進行中のプロジェクト一覧を取得"""
        active_projects = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(active_projects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """プロジェクトの統計情報を取得"""
        project = self.get_object()
        stats = {
            'total_tasks': project.tasks.count(),
            'completed_tasks': project.tasks.filter(status='done').count(),
            'member_count': project.members.count(),
            'days_remaining': (
                (project.end_date - timezone.now().date()).days
                if project.end_date else None
            ),
        }
        return Response(stats)
```

#### 2. ReadOnlyModelViewSet
```python
# 読み取り専用ViewSet
class ProjectReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """プロジェクト読み取り専用ViewSet"""
    
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
```

#### 3. カスタムViewSet
```python
from rest_framework import viewsets, mixins

class ProjectListCreateViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    """一覧取得と作成のみのViewSet"""
    
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
```

## URL設計

### URL構成

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from projects.views import ProjectViewSet
from members.views import MemberViewSet
from clients.views import ClientViewSet
from tasks.views import TaskViewSet
from activities.views import ActivityViewSet

# Routerセットアップ
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API認証
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API エンドポイント
    path('api/', include(router.urls)),
    
    # DRF認証UI (開発環境のみ)
    path('api-auth/', include('rest_framework.urls')),
]
```

### API エンドポイント規約

#### RESTful URL設計
```
# プロジェクト
GET    /api/projects/              # 一覧取得
POST   /api/projects/              # 作成
GET    /api/projects/{id}/         # 詳細取得
PUT    /api/projects/{id}/         # 全体更新
PATCH  /api/projects/{id}/         # 部分更新
DELETE /api/projects/{id}/         # 削除

# カスタムアクション
POST   /api/projects/{id}/complete/    # 完了
GET    /api/projects/active/           # 進行中一覧
GET    /api/projects/{id}/statistics/  # 統計

# タスク (ネストされたリソース)
GET    /api/projects/{id}/tasks/       # プロジェクトのタスク一覧
POST   /api/projects/{id}/tasks/       # タスク作成
GET    /api/tasks/{id}/                # タスク詳細
```

## 認証・認可

### JWT認証実装

```python
# カスタムトークンSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # カスタムクレーム追加
        token['username'] = user.username
        token['email'] = user.email
        
        return token


# カスタムトークンView
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

### パーミッション

```python
# permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    オブジェクトの所有者のみ編集可能
    """
    
    def has_object_permission(self, request, view, obj):
        # 読み取りは全員許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 書き込みは所有者のみ
        return obj.owner == request.user


class IsProjectMember(permissions.BasePermission):
    """
    プロジェクトメンバーのみアクセス可能
    """
    
    def has_object_permission(self, request, view, obj):
        return obj.members.filter(id=request.user.id).exists()
```

## エラーハンドリング

### カスタム例外ハンドラー

```python
# config/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """カスタム例外ハンドラー"""
    
    # 標準の例外ハンドラーを呼び出す
    response = exception_handler(exc, context)
    
    if response is not None:
        # カスタムエラーレスポンス
        custom_response_data = {
            'error': {
                'status_code': response.status_code,
                'message': str(exc),
                'details': response.data,
            }
        }
        response.data = custom_response_data
    
    return response
```

### バリデーションエラー

```python
# Serializerでのバリデーション
def validate_name(self, value):
    """名前のバリデーション"""
    if len(value) < 3:
        raise serializers.ValidationError("名前は3文字以上で入力してください")
    return value

def validate(self, data):
    """全体バリデーション"""
    if data['end_date'] < data['start_date']:
        raise serializers.ValidationError("終了日は開始日以降を指定してください")
    return data
```

---

**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
