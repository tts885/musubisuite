from rest_framework import serializers
from .models import ActivityLog
from members.serializers import MemberListSerializer


class ActivityLogSerializer(serializers.ModelSerializer):
    """アクティビティログシリアライザー"""
    
    user = MemberListSerializer(read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'project', 'user', 'action', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
