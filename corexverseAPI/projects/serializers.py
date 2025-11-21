"""
プロジェクトシリアライザー

プロジェクトモデルのJSONシリアライゼーションと
バリデーションを提供します。

Author: 開発チーム
Created: 2025-11-14
"""

from rest_framework import serializers
from .models import Project, Attachment, Comment
from clients.serializers import ClientListSerializer
from members.serializers import MemberListSerializer


class AttachmentSerializer(serializers.ModelSerializer):
    """
    添付ファイルシリアライザー
    
    添付ファイルモデルをJSON形式にシリアライズし、
    入力データのバリデーションを行います。
    
    Fields:
        id (int): 添付ファイルID(読み取り専用)
        project (int): プロジェクトID
        file_name (str): ファイル名(最大255文字)
        file_size (int): ファイルサイズ(バイト単位)
        file_type (str): ファイルのMIMEタイプ
        uploaded_by (dict): アップロード者情報(読み取り専用)
        uploaded_at (datetime): アップロード日時(読み取り専用)
        url (str): ファイルURL(最大500文字)
    
    Validation Rules:
        - file_name: 必須、最大255文字
        - file_size: 必須、正の整数
        - url: 必須、有効なURL形式
    
    Examples:
        >>> # シリアライズ
        >>> serializer = AttachmentSerializer(attachment)
        >>> print(serializer.data)
        {'id': 1, 'file_name': '仕様書.pdf', ...}
        >>> 
        >>> # デシリアライズ(作成)
        >>> serializer = AttachmentSerializer(data=request.data)
        >>> if serializer.is_valid():
        >>>     attachment = serializer.save()
    
    Note:
        - uploaded_byは読み取り専用で、リクエストユーザーが自動設定されます
        - uploaded_atは作成時に自動設定されます
    """
    
    uploaded_by = MemberListSerializer(read_only=True)
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'project', 'file_name', 'file_size', 'file_type',
            'uploaded_by', 'uploaded_at', 'url'
        ]
        read_only_fields = ['id', 'uploaded_at']


class CommentSerializer(serializers.ModelSerializer):
    """
    コメントシリアライザー
    
    コメントモデルをJSON形式にシリアライズし、
    入力データのバリデーションを行います。
    
    Fields:
        id (int): コメントID(読み取り専用)
        project (int): プロジェクトID
        task (int): タスクID(任意)
        content (str): コメント内容
        author (dict): 投稿者情報(読み取り専用)
        created_at (datetime): 作成日時(読み取り専用)
        updated_at (datetime): 最終更新日時(読み取り専用)
    
    Validation Rules:
        - content: 必須、空文字列は不可
        - project: 必須
        - task: 任意
    
    Examples:
        >>> # シリアライズ
        >>> serializer = CommentSerializer(comment)
        >>> print(serializer.data)
        {'id': 1, 'content': '進捗確認をお願いします', ...}
        >>> 
        >>> # デシリアライズ(作成)
        >>> serializer = CommentSerializer(data=request.data)
        >>> if serializer.is_valid():
        >>>     comment = serializer.save(author=request.user.member)
    
    Note:
        - authorは読み取り専用で、リクエストユーザーが自動設定されます
        - created_atとupdated_atは自動設定されます
    """
    
    author = MemberListSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = [
            'id', 'project', 'task', 'content', 'author',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    """
    プロジェクトシリアライザー
    
    プロジェクトモデルをJSON形式にシリアライズし、
    入力データのバリデーションを行います。
    関連する全てのデータ(クライアント、メンバー、添付ファイル、コメント)を含みます。
    
    Fields:
        id (int): プロジェクトID(読み取り専用)
        name (str): プロジェクト名(必須、最大200文字)
        description (str): 説明(任意)
        status (str): ステータス(デフォルト: planning)
        priority (str): 優先度(デフォルト: medium)
        client (dict): クライアント情報(読み取り専用)
        client_id (int): クライアントID(書き込み専用、必須)
        start_date (date): 開始日(必須)
        end_date (date): 終了日(必須)
        budget (decimal): 予算(任意、0以上)
        progress (int): 進捗率(デフォルト: 0、0-100)
        owner (dict): オーナー情報(読み取り専用)
        owner_id (int): オーナーID(書き込み専用、任意)
        members (list): メンバー情報(読み取り専用)
        member_ids (list): メンバーID配列(書き込み専用、任意)
        tags (list): タグ配列
        attachments (list): 添付ファイル一覧(読み取り専用)
        comments (list): コメント一覧(読み取り専用)
        created_at (datetime): 作成日時(読み取り専用)
        updated_at (datetime): 更新日時(読み取り専用)
    
    Validation Rules:
        - name: 必須、最大200文字
        - end_date: start_date以降の日付
        - budget: 0以上
        - progress: 0-100の範囲
    
    Examples:
        >>> # シリアライズ
        >>> serializer = ProjectSerializer(project)
        >>> print(serializer.data)
        {'id': 1, 'name': 'プロジェクト', ...}
        >>> 
        >>> # デシリアライズ(作成)
        >>> serializer = ProjectSerializer(data=request.data)
        >>> if serializer.is_valid():
        >>>     project = serializer.save()
        >>> 
        >>> # デシリアライズ(更新)
        >>> serializer = ProjectSerializer(project, data=request.data, partial=True)
        >>> if serializer.is_valid():
        >>>     serializer.save()
    
    Note:
        - client_id、owner_id、member_idsは書き込み専用
        - 関連データはN+1問題を避けるためViewSetでprefetch_relatedを使用すること
    
    See Also:
        - ProjectListSerializer: 一覧用の軽量版シリアライザー
        - Project: プロジェクトモデル
    """
    
    client = ClientListSerializer(read_only=True)
    owner = MemberListSerializer(read_only=True)
    members = MemberListSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('clients.models', fromlist=['Client']).Client.objects.all(),
        source='client',
        write_only=True
    )
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('members.models', fromlist=['Member']).Member.objects.all(),
        source='owner',
        write_only=True,
        required=False
    )
    member_ids = serializers.PrimaryKeyRelatedField(
        queryset=__import__('members.models', fromlist=['Member']).Member.objects.all(),
        source='members',
        write_only=True,
        many=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority',
            'client', 'client_id', 'start_date', 'end_date', 'budget', 'progress',
            'owner', 'owner_id', 'members', 'member_ids', 'tags',
            'attachments', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """
    プロジェクト一覧用シリアライザー(軽量版)
    
    一覧表示に必要な最小限のフィールドのみを含む軽量版シリアライザーです。
    添付ファイルやコメントなどの詳細情報は含みません。
    
    Fields:
        id (int): プロジェクトID
        name (str): プロジェクト名
        status (str): ステータス
        priority (str): 優先度
        client (dict): クライアント情報(基本情報のみ)
        owner (dict): オーナー情報(基本情報のみ)
        start_date (date): 開始日
        end_date (date): 終了日
        progress (int): 進捗率
        created_at (datetime): 作成日時
    
    Examples:
        >>> # 一覧用シリアライズ
        >>> serializer = ProjectListSerializer(projects, many=True)
        >>> print(serializer.data)
        [{'id': 1, 'name': 'プロジェクトA', ...}, ...]
    
    Note:
        - 詳細情報が必要な場合はProjectSerializerを使用してください
        - パフォーマンス向上のため、関連データは最小限に抑えています
    
    See Also:
        - ProjectSerializer: 詳細情報を含む完全版シリアライザー
    """
    
    client = ClientListSerializer(read_only=True)
    owner = MemberListSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'status', 'priority', 'client', 'owner',
            'start_date', 'end_date', 'progress', 'created_at'
        ]
