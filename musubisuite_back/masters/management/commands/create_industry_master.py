"""
業種マスタデータを作成する管理コマンド
"""
from django.core.management.base import BaseCommand
from masters.models import CodeCategory, CodeMaster


class Command(BaseCommand):
    help = '業種マスタデータを作成します'

    def handle(self, *args, **options):
        # 業種カテゴリを作成
        category, created = CodeCategory.objects.get_or_create(
            code='industry',
            defaults={
                'name': '業種',
                'description': 'クライアントの業種分類',
                'is_system': False,
                'sort_order': 10,
                'is_active': True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'業種カテゴリを作成しました: {category.code}'))
        else:
            self.stdout.write(self.style.WARNING(f'業種カテゴリは既に存在します: {category.code}'))

        # 業種コードを作成
        industries = [
            {'code': 'it', 'name': 'IT・通信', 'name_en': 'IT & Telecommunications', 'sort_order': 0},
            {'code': 'manufacturing', 'name': '製造', 'name_en': 'Manufacturing', 'sort_order': 10},
            {'code': 'finance', 'name': '金融', 'name_en': 'Finance', 'sort_order': 20},
            {'code': 'retail', 'name': '小売', 'name_en': 'Retail', 'sort_order': 30},
            {'code': 'service', 'name': 'サービス', 'name_en': 'Service', 'sort_order': 40},
            {'code': 'construction', 'name': '建設', 'name_en': 'Construction', 'sort_order': 50},
            {'code': 'real_estate', 'name': '不動産', 'name_en': 'Real Estate', 'sort_order': 60},
            {'code': 'transportation', 'name': '運輸', 'name_en': 'Transportation', 'sort_order': 70},
            {'code': 'education', 'name': '教育', 'name_en': 'Education', 'sort_order': 80},
            {'code': 'healthcare', 'name': '医療・福祉', 'name_en': 'Healthcare', 'sort_order': 90},
            {'code': 'media', 'name': 'メディア', 'name_en': 'Media', 'sort_order': 100},
            {'code': 'other', 'name': 'その他', 'name_en': 'Other', 'sort_order': 110},
        ]

        created_count = 0
        for industry_data in industries:
            code_master, created = CodeMaster.objects.get_or_create(
                category=category,
                code=industry_data['code'],
                defaults={
                    'name': industry_data['name'],
                    'name_en': industry_data['name_en'],
                    'description': f"{industry_data['name']}業",
                    'sort_order': industry_data['sort_order'],
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  - {code_master.code}: {code_master.name}'))

        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(f'\n{created_count}件の業種コードを作成しました'))
        else:
            self.stdout.write(self.style.WARNING('業種コードは既に存在します'))
