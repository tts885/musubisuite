# セキュリティガイドライン

## 📋 目次
- [セキュリティ原則](#セキュリティ原則)
- [認証・認可](#認証認可)
- [データ保護](#データ保護)
- [入力検証](#入力検証)
- [CORS・CSRF対策](#corsc csrf対策)
- [セキュアコーディング](#セキュアコーディング)
- [環境変数管理](#環境変数管理)
- [脆弱性対策](#脆弱性対策)

## セキュリティ原則

### Defense in Depth（多層防御）
複数のセキュリティレイヤーを実装し、一つが突破されても他のレイヤーで防御

```
┌─────────────────────────────────────┐
│   Network Layer (Firewall/CDN)      │
├─────────────────────────────────────┤
│   Transport Layer (HTTPS/TLS)       │
├─────────────────────────────────────┤
│   Application Layer (Auth/RBAC)     │
├─────────────────────────────────────┤
│   Data Layer (Encryption)           │
├─────────────────────────────────────┤
│   Infrastructure Layer (Isolation)  │
└─────────────────────────────────────┘
```

### Principle of Least Privilege（最小権限の原則）
- ユーザーは必要最小限の権限のみ付与
- APIエンドポイントごとに権限チェック
- データベースユーザーは必要なテーブルのみアクセス可能

### Security by Default（デフォルトでセキュア）
- 安全でない設定は明示的に有効化
- 本番環境では`DEBUG=False`
- デフォルトでHTTPS強制

### Fail Securely（安全な失敗）
- エラー時は詳細情報を露出しない
- ログには記録、ユーザーには一般的なメッセージ
- 認証失敗時は具体的な理由を返さない

## 認証・認可

### JWT認証実装

#### バックエンド設定
```python
# config/settings.py
from datetime import timedelta

SIMPLE_JWT = {
    # トークン有効期限
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    
    # トークンローテーション
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    
    # アルゴリズム
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    
    # ヘッダー
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # クレーム
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ブラックリスト設定（トークン無効化）
INSTALLED_APPS += ['rest_framework_simplejwt.token_blacklist']
```

#### トークン取得エンドポイント
```python
# urls.py
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
```

#### カスタムトークンペイロード
```python
# serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # カスタムクレーム追加（機密情報は含めない）
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # ユーザー情報を追加
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
        }
        
        return data
```

### フロントエンド認証実装

#### トークン管理
```typescript
// src/lib/auth.ts
interface Tokens {
  access: string;
  refresh: string;
}

export const authStorage = {
  // トークン保存
  setTokens(tokens: Tokens): void {
    // ✅ httpOnly cookieが理想的だが、SPAでは localStorage使用
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  },
  
  // トークン取得
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },
  
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },
  
  // トークン削除
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  // トークンの有効性チェック
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
};

// ログイン処理
export async function login(username: string, password: string): Promise<void> {
  const response = await apiClient.post<Tokens>('/api/token/', {
    username,
    password,
  });
  
  authStorage.setTokens(response.data);
}

// ログアウト処理
export async function logout(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  
  // トークンをブラックリストに追加
  if (refreshToken) {
    try {
      await apiClient.post('/api/token/blacklist/', {
        refresh: refreshToken,
      });
    } catch (error) {
      console.error('Token blacklist failed:', error);
    }
  }
  
  authStorage.clearTokens();
  window.location.href = '/login';
}

// トークンリフレッシュ
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = authStorage.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await apiClient.post<{ access: string }>('/api/token/refresh/', {
    refresh: refreshToken,
  });
  
  localStorage.setItem('access_token', response.data.access);
  return response.data.access;
}
```

#### APIクライアント設定
```typescript
// src/services/djangoAPI.ts
import axios from 'axios';
import { authStorage, refreshAccessToken } from '@/lib/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: トークン追加
apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// レスポンスインターセプター: トークンリフレッシュ
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 401エラー & リフレッシュ未実行
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // リフレッシュ中の場合はキューに追加
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 認可（権限管理）

#### ロールベースアクセス制御（RBAC）
```python
# permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    オブジェクトの所有者のみ編集可能
    読み取りは全員許可
    """
    
    def has_object_permission(self, request, view, obj):
        # 読み取りは全員許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 書き込みは所有者のみ
        return obj.owner == request.user


class IsProjectMember(permissions.BasePermission):
    """プロジェクトメンバーのみアクセス可能"""
    
    def has_object_permission(self, request, view, obj):
        return obj.members.filter(id=request.user.id).exists()


class IsAdminOrReadOnly(permissions.BasePermission):
    """管理者のみ編集可能"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


# views.py
class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
```

#### フロントエンドでの権限チェック
```typescript
// src/hooks/usePermissions.ts
interface User {
  id: string;
  role: 'admin' | 'manager' | 'member';
}

export function usePermissions(user: User | null) {
  return {
    canCreateProject: () => {
      return user?.role === 'admin' || user?.role === 'manager';
    },
    
    canEditProject: (project: Project) => {
      if (user?.role === 'admin') return true;
      return project.owner_id === user?.id;
    },
    
    canDeleteProject: (project: Project) => {
      return user?.role === 'admin' || project.owner_id === user?.id;
    },
  };
}

// 使用例
function ProjectCard({ project }: { project: Project }) {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  
  return (
    <Card>
      {/* ... */}
      {permissions.canEditProject(project) && (
        <Button onClick={handleEdit}>編集</Button>
      )}
      {permissions.canDeleteProject(project) && (
        <Button onClick={handleDelete}>削除</Button>
      )}
    </Card>
  );
}
```

## データ保護

### 機密情報の暗号化

#### データベース暗号化
```python
# models.py
from django.db import models
from cryptography.fernet import Fernet
import os

class EncryptedField(models.TextField):
    """暗号化フィールド"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cipher = Fernet(os.environ.get('ENCRYPTION_KEY').encode())
    
    def get_prep_value(self, value):
        """保存前に暗号化"""
        if value is None:
            return value
        return self.cipher.encrypt(value.encode()).decode()
    
    def from_db_value(self, value, expression, connection):
        """取得時に復号化"""
        if value is None:
            return value
        return self.cipher.decrypt(value.encode()).decode()


class Client(models.Model):
    name = models.CharField(max_length=200)
    # 機密情報を暗号化
    credit_card = EncryptedField(null=True, blank=True)
```

### パスワードハッシュ化

#### Django標準（PBKDF2）
```python
# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',  # 推奨
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# パスワード強度要件
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 12}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

### HTTPSの強制

```python
# settings.py (本番環境)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1年
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

## 入力検証

### バックエンド検証

#### Serializerバリデーション
```python
# serializers.py
from rest_framework import serializers
import re

class ProjectSerializer(serializers.ModelSerializer):
    
    def validate_name(self, value):
        """プロジェクト名のバリデーション"""
        # 長さチェック
        if len(value) < 3:
            raise serializers.ValidationError("3文字以上で入力してください")
        
        if len(value) > 200:
            raise serializers.ValidationError("200文字以内で入力してください")
        
        # 不正文字チェック
        if re.search(r'[<>\"\'%;()&+]', value):
            raise serializers.ValidationError("使用できない文字が含まれています")
        
        return value
    
    def validate_email(self, value):
        """メールアドレスのバリデーション"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("有効なメールアドレスを入力してください")
        return value
    
    def validate_budget(self, value):
        """予算のバリデーション"""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("0以上の値を入力してください")
            if value > 999999999:
                raise serializers.ValidationError("予算が大きすぎます")
        return value
```

#### SQLインジェクション対策
```python
# ✅ 良い例: ORMを使用（自動的にエスケープ）
projects = Project.objects.filter(name=user_input)

# ✅ パラメータ化クエリ
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT * FROM projects WHERE name = %s", [user_input])

# ❌ 悪い例: 文字列結合（SQLインジェクション脆弱性）
cursor.execute(f"SELECT * FROM projects WHERE name = '{user_input}'")
```

### フロントエンド検証

#### Zodスキーマバリデーション
```typescript
// src/schemas/projectSchema.ts
import { z } from 'zod';

export const projectSchema = z.object({
  name: z
    .string()
    .min(3, 'プロジェクト名は3文字以上で入力してください')
    .max(200, 'プロジェクト名は200文字以内で入力してください')
    .regex(
      /^[^<>"'%;()&+]*$/,
      '使用できない文字が含まれています'
    ),
  
  description: z
    .string()
    .max(2000, '説明は2000文字以内で入力してください')
    .optional(),
  
  email: z
    .string()
    .email('有効なメールアドレスを入力してください'),
  
  budget: z
    .number()
    .min(0, '0以上の値を入力してください')
    .max(999999999, '予算が大きすぎます')
    .optional(),
  
  start_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), '有効な日付を入力してください'),
  
  end_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), '有効な日付を入力してください'),
}).refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: '終了日は開始日以降の日付を指定してください',
    path: ['end_date'],
  }
);
```

#### XSS対策
```typescript
// ✅ Reactは自動的にエスケープ
function ProjectCard({ project }: { project: Project }) {
  return (
    <div>
      {/* 自動エスケープされる */}
      <h2>{project.name}</h2>
      <p>{project.description}</p>
    </div>
  );
}

// ❌ 悪い例: dangerouslySetInnerHTMLの使用（XSS脆弱性）
function ProjectCard({ project }: { project: Project }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: project.description }} />
  );
}

// ✅ HTML表示が必要な場合はサニタイズ
import DOMPurify from 'dompurify';

function ProjectCard({ project }: { project: Project }) {
  const sanitizedHTML = DOMPurify.sanitize(project.description);
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
}
```

## CORS・CSRF対策

### CORS設定

```python
# config/settings.py
INSTALLED_APPS += ['corsheaders']

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 最初に配置
    # ... 他のミドルウェア
]

# 開発環境
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
else:
    # 本番環境
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')

# クッキーを使用する場合
CORS_ALLOW_CREDENTIALS = True

# 許可するヘッダー
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### CSRF対策

```python
# settings.py
CSRF_COOKIE_SECURE = True  # HTTPS only
CSRF_COOKIE_HTTPONLY = False  # JavaScriptからアクセス可能
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = [
    'https://yourdomain.com',
]

# JWT使用時はCSRF不要
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

## セキュアコーディング

### セキュリティチェックリスト

#### フロントエンド
- [ ] すべてのユーザー入力をバリデーション
- [ ] XSS対策（自動エスケープ確認）
- [ ] 機密情報をlocalStorageに保存しない（または暗号化）
- [ ] HTTPS通信の使用
- [ ] Content Security Policy (CSP) 設定
- [ ] トークン有効期限のチェック
- [ ] エラーメッセージに機密情報を含めない

#### バックエンド
- [ ] すべての入力をサーバー側でバリデーション
- [ ] SQLインジェクション対策（ORMまたはパラメータ化クエリ）
- [ ] 認証・認可の実装
- [ ] レート制限の実装
- [ ] ログに機密情報を記録しない
- [ ] エラーメッセージに内部情報を含めない
- [ ] 本番環境でDEBUG=False

### セキュリティヘッダー

```python
# settings.py
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# カスタムミドルウェア
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # セキュリティヘッダー追加
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response

MIDDLEWARE += ['config.middleware.SecurityHeadersMiddleware']
```

## 環境変数管理

### .env ファイル

```bash
# .env (開発環境のみ、gitignoreに追加)
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# データベース
DB_NAME=musubisuite_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# Dataverse
DATAVERSE_URL=https://your-org.crm.dynamics.com
DATAVERSE_CLIENT_ID=your-client-id
DATAVERSE_CLIENT_SECRET=your-client-secret

# 暗号化キー
ENCRYPTION_KEY=your-encryption-key
```

### 環境変数の読み込み

```python
# Python (django-environ使用)
import environ

env = environ.Env()
environ.Env.read_env()

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)
DATABASE_URL = env.db('DATABASE_URL')
```

```typescript
// TypeScript
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  dataverseUrl: import.meta.env.VITE_DATAVERSE_URL,
};
```

### 本番環境での管理
- Azure Key Vault
- AWS Secrets Manager
- 環境変数（Azure App Service設定）

## 脆弱性対策

### 定期的なセキュリティスキャン

```powershell
# Python依存関係のセキュリティチェック
pip install safety
safety check

# npm依存関係のセキュリティチェック
npm audit
npm audit fix

# Dependabot (GitHub) の有効化
```

### セキュリティアップデート

```bash
# 定期的な依存関係更新
pip list --outdated
pip install -U package-name

npm outdated
npm update
```

### ログとモニタリング

```python
# ログ設定
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': 'security.log',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# セキュリティイベントのログ記録
import logging
security_logger = logging.getLogger('django.security')

def login_view(request):
    # ログイン失敗をログ
    security_logger.warning(f'Failed login attempt from {request.META.get("REMOTE_ADDR")}')
```

---

**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
