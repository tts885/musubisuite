"""
コードマスタの初期データをロードするmanagement command
"""

from django.core.management.base import BaseCommand
from masters.models import CodeCategory, CodeMaster


class Command(BaseCommand):
    help = 'コードマスタの初期データをロード'

    def handle(self, *args, **options):
        self.stdout.write('コードマスタ初期データをロード中...')
        
        # カテゴリ作成
        categories = [
            ('INDUSTRY', '業種', 'クライアントの業種分類', True, 10),
            ('PROJECT_STATUS', '案件ステータス', 'プロジェクトの進行状況', True, 20),
            ('PROJECT_PRIORITY', '案件優先度', 'プロジェクトの重要度', True, 30),
            ('TASK_STATUS', 'タスクステータス', 'タスクの進行状況', True, 40),
            ('PREFECTURE', '都道府県', '日本の都道府県', True, 50),
        ]
        
        for code, name, desc, is_system, sort_order in categories:
            cat, created = CodeCategory.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'description': desc,
                    'is_system': is_system,
                    'sort_order': sort_order
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  カテゴリ作成: {code}'))
            else:
                self.stdout.write(f'  カテゴリ既存: {code}')
        
        # 業種コード
        industry_codes = [
            ('it', 'IT・情報通信', 'IT & Telecommunications', 10, '#3B82F6', 'Monitor'),
            ('manufacturing', '製造業', 'Manufacturing', 20, '#8B5CF6', 'Factory'),
            ('finance', '金融・保険', 'Finance & Insurance', 30, '#10B981', 'DollarSign'),
            ('retail', '小売業', 'Retail', 40, '#F59E0B', 'ShoppingCart'),
            ('service', 'サービス業', 'Service Industry', 50, '#EC4899', 'Users'),
            ('healthcare', '医療・福祉', 'Healthcare', 60, '#14B8A6', 'Heart'),
            ('education', '教育', 'Education', 70, '#6366F1', 'Book'),
            ('construction', '建設業', 'Construction', 80, '#F97316', 'HardHat'),
            ('real_estate', '不動産', 'Real Estate', 90, '#06B6D4', 'Home'),
            ('transportation', '運輸・物流', 'Transportation & Logistics', 100, '#8B5CF6', 'Truck'),
            ('hospitality', '宿泊・飲食', 'Hospitality', 110, '#EC4899', 'Coffee'),
            ('other', 'その他', 'Other', 1000, '#6B7280', 'MoreHorizontal'),
        ]
        
        industry_cat = CodeCategory.objects.get(code='INDUSTRY')
        for code, name, name_en, sort_order, color, icon in industry_codes:
            obj, created = CodeMaster.objects.get_or_create(
                category=industry_cat,
                code=code,
                defaults={
                    'name': name,
                    'name_en': name_en,
                    'sort_order': sort_order,
                    'color': color,
                    'icon': icon
                }
            )
            if created:
                self.stdout.write(f'  業種コード作成: {code}')
        
        # 案件ステータス
        project_status_codes = [
            ('planning', '計画中', 'Planning', 10, '#6B7280', 'FileText'),
            ('active', '進行中', 'Active', 20, '#3B82F6', 'Play'),
            ('on-hold', '保留', 'On Hold', 30, '#F59E0B', 'Pause'),
            ('completed', '完了', 'Completed', 40, '#10B981', 'CheckCircle'),
            ('cancelled', '中止', 'Cancelled', 50, '#EF4444', 'XCircle'),
        ]
        
        status_cat = CodeCategory.objects.get(code='PROJECT_STATUS')
        for code, name, name_en, sort_order, color, icon in project_status_codes:
            obj, created = CodeMaster.objects.get_or_create(
                category=status_cat,
                code=code,
                defaults={
                    'name': name,
                    'name_en': name_en,
                    'sort_order': sort_order,
                    'color': color,
                    'icon': icon
                }
            )
            if created:
                self.stdout.write(f'  ステータスコード作成: {code}')
        
        # 案件優先度
        priority_codes = [
            ('low', '低', 'Low', 10, '#6B7280', 'ArrowDown'),
            ('medium', '中', 'Medium', 20, '#F59E0B', 'Minus'),
            ('high', '高', 'High', 30, '#EF4444', 'ArrowUp'),
            ('urgent', '緊急', 'Urgent', 40, '#DC2626', 'AlertTriangle'),
        ]
        
        priority_cat = CodeCategory.objects.get(code='PROJECT_PRIORITY')
        for code, name, name_en, sort_order, color, icon in priority_codes:
            obj, created = CodeMaster.objects.get_or_create(
                category=priority_cat,
                code=code,
                defaults={
                    'name': name,
                    'name_en': name_en,
                    'sort_order': sort_order,
                    'color': color,
                    'icon': icon
                }
            )
            if created:
                self.stdout.write(f'  優先度コード作成: {code}')
        
        # タスクステータス
        task_status_codes = [
            ('todo', '未着手', 'To Do', 10, '#6B7280', 'Circle'),
            ('in_progress', '進行中', 'In Progress', 20, '#3B82F6', 'RefreshCw'),
            ('completed', '完了', 'Completed', 30, '#10B981', 'CheckCircle'),
        ]
        
        task_cat = CodeCategory.objects.get(code='TASK_STATUS')
        for code, name, name_en, sort_order, color, icon in task_status_codes:
            obj, created = CodeMaster.objects.get_or_create(
                category=task_cat,
                code=code,
                defaults={
                    'name': name,
                    'name_en': name_en,
                    'sort_order': sort_order,
                    'color': color,
                    'icon': icon
                }
            )
            if created:
                self.stdout.write(f'  タスクステータス作成: {code}')
        
        self.stdout.write(self.style.SUCCESS('\n初期データのロードが完了しました!'))
