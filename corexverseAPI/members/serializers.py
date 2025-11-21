"""
メンバーシリアライザーモジュール

このモジュールは、メンバー情報のJSON変換と検証を行うシリアライザーを定義します。

Classes:
    UserSerializer: Django標準Userモデルのシリアライザー
    MemberSerializer: メンバー詳細情報のシリアライザー
    MemberListSerializer: メンバー一覧用の軽量シリアライザー
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Member


class UserSerializer(serializers.ModelSerializer):
    """
    Userシリアライザー
    
    Django標準のUserモデルをJSON形式に変換します。
    
    Fields:
        - id: ユーザーID
        - username: ユーザー名
        - email: メールアドレス
        - first_name: 名
        - last_name: 姓
    
    Examples:
        >>> user_data = {
        ...     'username': 'sato',
        ...     'email': 'sato@company.com',
        ...     'first_name': '一郎',
        ...     'last_name': '佐藤'
        ... }
        >>> serializer = UserSerializer(data=user_data)
        >>> serializer.is_valid()
        True
    
    Note:
        - idは読み取り専用です
        - Memberモデルのネストされたフィールドとして使用されます
    """
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class MemberSerializer(serializers.ModelSerializer):
    """
    メンバーシリアライザー
    
    メンバーの完全な情報をJSON形式に変換します。
    詳細表示、作成、更新時に使用されます。
    
    Fields:
        - id: メンバーID(読み取り専用)
        - user: 関連Userオブジェクト(読み取り専用、ネスト)
        - name: メンバー名
        - email: メールアドレス(ユニーク)
        - avatar: プロフィール画像URL
        - role: 役割(owner/admin/member/viewer)
        - department: 所属部署
        - position: 役職
        - skills: スキルセット(JSON配列)
        - joined_at: 入社日時(読み取り専用)
    
    Examples:
        >>> member_data = {
        ...     'name': '佐藤一郎',
        ...     'email': 'sato@company.com',
        ...     'role': 'admin',
        ...     'department': '開発部',
        ...     'position': '部長',
        ...     'skills': ['Python', 'Django', 'React']
        ... }
        >>> serializer = MemberSerializer(data=member_data)
        >>> serializer.is_valid()
        True
    
    Note:
        - userフィールドはネストされたUserSerializerで表現されます
        - emailは一意である必要があります
        - joined_atは自動設定されるため編集不可です
    """
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'user', 'name', 'email', 'avatar', 'role',
            'department', 'position', 'skills', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']


class MemberListSerializer(serializers.ModelSerializer):
    """
    メンバー一覧用シリアライザー(軽量版)
    
    メンバー一覧表示時に必要最小限のフィールドのみを返します。
    パフォーマンス最適化のため、不要なフィールドを除外しています。
    
    Fields:
        - id: メンバーID
        - name: メンバー名
        - email: メールアドレス
        - role: 役割
        - department: 所属部署
    
    Examples:
        >>> members = Member.objects.all()
        >>> serializer = MemberListSerializer(members, many=True)
        >>> serializer.data
        [
            {
                'id': '123',
                'name': '佐藤一郎',
                'email': 'sato@company.com',
                'role': 'admin',
                'department': '開発部'
            }
        ]
    
    Note:
        - 一覧表示時のデータ転送量を削減します
        - 詳細情報が必要な場合はMemberSerializerを使用してください
    """
    
    class Meta:
        model = Member
        fields = ['id', 'name', 'email', 'role', 'department']
