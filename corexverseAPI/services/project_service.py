from django.db.models import Count
from ..projects.models import Project, Attachment, Comment

class ProjectService:
    """
    Service class for Project related business logic.
    """

    @staticmethod
    def get_project_stats():
        """
        Calculate dashboard statistics for projects.
        """
        queryset = Project.objects.all()
        total = queryset.count()
        active = queryset.filter(status='active').count()
        completed = queryset.filter(status='completed').count()
        
        return {
            'total_projects': total,
            'active_projects': active,
            'completed_projects': completed,
        }

    @staticmethod
    def get_project_attachments(project):
        """
        Get all attachments for a specific project.
        """
        return project.attachments.all()

    @staticmethod
    def get_project_comments(project):
        """
        Get all comments for a specific project.
        """
        return project.comments.all()
