"""
タスクシリアライザーモジュール

このモジュールは、タスク情報のJSON変換と検証を行うシリアライザーを定義します。

Classes:
    TaskSerializer: タスク詳細情報のシリアライザー
    TaskListSerializer: タスク一覧用の軽量シリアライザー
"""

from rest_framework import serializers
from .models import Task
from members.serializers import MemberListSerializer


class TaskSerializer(serializers.ModelSerializer):
    """
    タスクシリアライザー
    
    タスクの完全な情報をJSON形式に変換します。
    詳細表示、作成、更新時に使用されます。
    
    Fields:
        - id: タスクID(読み取り専用)
        - project: 関連プロジェクトID
        - title: タスク名
        - description: タスクの詳細説明
        - status: タスクのステータス
        - priority: タスクの優先度
        - assignee: 担当者オブジェクト(読み取り専用、ネスト)
        - assignee_id: 担当者ID(書き込み専用)
        - due_date: 期限
        - estimated_hours: 見積もり時間
        - actual_hours: 実績時間
        - created_by: 作成者オブジェクト(読み取り専用、ネスト)
        - created_by_id: 作成者ID(書き込み専用)
        - created_at: 作成日時(読み取り専用)
        - updated_at: 最終更新日時(読み取り専用)
    
    Examples:
        >>> task_data = {
        ...     'project': '123',
        ...     'title': '実装タスク',
        ...     'description': 'タスクの説明',
        ...     'status': 'in-progress',
        ...     'priority': 'high',
        ...     'assignee_id': '456',
        ...     'created_by_id': '789'
        ... }
        >>> serializer = TaskSerializer(data=task_data)
        >>> serializer.is_valid()
        True
    
    Note:
        - assigneeとcreated_byは読み取り時にネストされたオブジェクトで返されます
        - assignee_idとcreated_by_idは書き込み時に使用します
        - assigneeは任意(未割り当てタスクに対応)
    """
    
    assignee = MemberListSerializer(read_only=True)
    created_by = MemberListSerializer(read_only=True)
    
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('members.models', fromlist=['Member']).Member.objects.all(),
        source='assignee',
        write_only=True,
        required=False
    )
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('members.models', fromlist=['Member']).Member.objects.all(),
        source='created_by',
        write_only=True
    )
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'status', 'priority',
            'assignee', 'assignee_id', 'due_date', 'estimated_hours', 'actual_hours',
            'created_by', 'created_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskListSerializer(serializers.ModelSerializer):
    """
    タスク一覧用シリアライザー(軽量版)
    
    タスク一覧表示時に必要最小限のフィールドのみを返します。
    パフォーマンス最適化のため、不要なフィールドを除外しています。
    
    Fields:
        - id: タスクID
        - project: 関連プロジェクトID
        - title: タスク名
        - status: タスクのステータス
        - priority: タスクの優先度
        - assignee: 担当者オブジェクト(ネスト)
        - due_date: 期限
        - created_at: 作成日時
    
    Examples:
        >>> tasks = Task.objects.all()
        >>> serializer = TaskListSerializer(tasks, many=True)
        >>> serializer.data
        [
            {
                'id': '123',
                'project': '456',
                'title': '実装タスク',
                'status': 'in-progress',
                'priority': 'high',
                'assignee': {'id': '789', 'name': '佐藤一郎'},
                'due_date': '2025-01-31',
                'created_at': '2025-01-01T00:00:00Z'
            }
        ]
    
    Note:
        - 一覧表示時のデータ転送量を削減します
        - 詳細情報が必要な場合はTaskSerializerを使用してください
        - assigneeは最小限のフィールドのみ含まれます
    """
    
    assignee = MemberListSerializer(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'status', 'priority',
            'assignee', 'due_date', 'created_at'
        ]
