# Generated manually on 2025-11-16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_settings', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='aiprovider',
            name='api_version',
            field=models.CharField(blank=True, help_text='Azure OpenAIのAPIバージョン（例：2024-02-01）', max_length=50, verbose_name='APIバージョン'),
        ),
        migrations.AddField(
            model_name='aiprovider',
            name='deployment_name',
            field=models.CharField(blank=True, help_text='Azure OpenAIのデプロイメント名（オプション）', max_length=100, verbose_name='デプロイメント名'),
        ),
        migrations.AddField(
            model_name='aiprovider',
            name='organization_id',
            field=models.CharField(blank=True, help_text='OpenAIの組織ID（オプション）', max_length=100, verbose_name='組織ID'),
        ),
        migrations.AlterField(
            model_name='aiprovider',
            name='endpoint',
            field=models.URLField(blank=True, help_text='APIエンドポイントURL（Azure OpenAIの場合は必須）', max_length=500, verbose_name='エンドポイント'),
        ),
        migrations.AlterField(
            model_name='aiprovider',
            name='model_name',
            field=models.CharField(help_text='使用するモデル名（例：gpt-4o, claude-3-5-sonnet, gemini-2.0-flash）', max_length=100, verbose_name='モデル名'),
        ),
    ]
