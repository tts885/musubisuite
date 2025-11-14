from django.db import models
from django.utils import timezone
from projects.models import Project
from members.models import Member


class ActivityLog(models.Model):
    """アクティビティログモデル"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activity_logs', verbose_name='案件')
    user = models.ForeignKey(Member, on_delete=models.CASCADE, verbose_name='ユーザー')
    action = models.CharField('アクション', max_length=100)
    description = models.TextField('説明')
    created_at = models.DateTimeField('作成日時', default=timezone.now)
    
    class Meta:
        db_table = 'activity_logs'
        verbose_name = 'アクティビティログ'
        verbose_name_plural = 'アクティビティログ'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.action}"
