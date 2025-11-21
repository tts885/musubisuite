"""
サンプルデータ作成スクリプト
"""
import os
import django

# Django設定を読み込む
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from clients.models import Client
from contracts.models import Contract
from ai_settings.models import AIProvider, SearchEngineConfig, AISettings

def create_sample_clients():
    """サンプルクライアントを作成"""
    print("既存のクライアントを削除...")
    Client.objects.all().delete()
    
    print("サンプルクライアントを作成...")
    clients = [
        Client.objects.create(
            company_name='トヨタ自動車',
            legal_name='トヨタ自動車株式会社',
            email='info@toyota.co.jp',
            phone='0565-28-2121',
            industry='manufacturing',
            representative='佐藤恒治',
            prefecture='愛知県',
            city='豊田市',
            address='トヨタ町1番地',
            website='https://www.toyota.co.jp/',
            description='自動車の製造・販売を主力事業とする企業',
        ),
        Client.objects.create(
            company_name='ソニー',
            legal_name='ソニーグループ株式会社',
            email='info@sony.co.jp',
            phone='03-6748-2111',
            industry='it',
            representative='吉田憲一郎',
            prefecture='東京都',
            city='港区',
            address='港南1-7-1',
            website='https://www.sony.com/ja/',
            description='エレクトロニクス、ゲーム、エンタテインメント事業を展開',
        ),
        Client.objects.create(
            company_name='パナソニック',
            legal_name='パナソニック ホールディングス株式会社',
            email='info@panasonic.co.jp',
            phone='06-6908-1121',
            industry='manufacturing',
            representative='楠見雄規',
            prefecture='大阪府',
            city='門真市',
            address='門真1006番地',
            website='https://www.panasonic.com/jp/',
            description='家電、住宅設備、車載機器などの製造販売',
        ),
    ]
    
    print(f"✓ {len(clients)}件のクライアントを作成しました")
    return clients

def create_sample_ai_settings():
    """サンプルAI設定を作成"""
    print("\nAI設定を作成...")
    
    # AI Provider
    AIProvider.objects.all().delete()
    provider = AIProvider(
        name='Azure OpenAI (Default)',
        provider_type='azure_openai',
        endpoint='https://your-resource.openai.azure.com/',
        model_name='gpt-4o',
        max_tokens=4000,
        temperature=0.7,
        is_active=True,
        is_default=True,
        use_for_client_enrichment=True,
        use_for_document_generation=True,
    )
    provider.set_api_key('dummy-api-key-12345')
    provider.save()
    print(f"✓ AI Provider作成: {provider}")
    
    # Search Engine
    SearchEngineConfig.objects.all().delete()
    search = SearchEngineConfig(
        name='Bing Search (Default)',
        engine_type='bing',
        max_results=5,
        is_active=True,
        is_default=True,
    )
    search.set_api_key('dummy-search-key-67890')
    search.save()
    print(f"✓ Search Engine作成: {search}")
    
    # AI Settings
    AISettings.objects.all().delete()
    settings = AISettings.objects.create(
        ai_enabled=True,
        require_confirmation=True,
        allow_overwrite=False,
        confidence_threshold=70,
        auto_save_on_high_confidence=False,
    )
    print(f"✓ AI Settings作成: {settings}")

if __name__ == '__main__':
    print("=" * 60)
    print("サンプルデータ作成スクリプト")
    print("=" * 60)
    
    create_sample_clients()
    create_sample_ai_settings()
    
    print("\n" + "=" * 60)
    print("✓ すべてのサンプルデータが作成されました!")
    print("=" * 60)
