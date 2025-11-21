#!/usr/bin/env python3
"""
プロジェクト名一括置換スクリプト
CoreX -> corexverse
CoreXAPI -> corexverseAPI
"""

import os
import re
from pathlib import Path

# 置換マッピング (順番が重要: 長い文字列から先に置換)
REPLACEMENTS = [
    ('CoreXAPI', 'corexverseAPI'),
    (r'\bCoreX\b', 'corexverse'),  # 単語境界を使用
]

# 対象ディレクトリ
TARGET_DIRS = [
    'Guideline',
    'Archi',
    '.',  # ルートディレクトリの*.mdファイル
]

# 対象ファイル拡張子
EXTENSIONS = ['.md', '.html']

def replace_in_file(file_path):
    """ファイル内のテキストを置換"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # 各置換パターンを適用
        for old_text, new_text in REPLACEMENTS:
            if re.search(old_text, content):
                content = re.sub(old_text, new_text, content)
                modified = True
        
        # 変更があった場合のみ書き込み
        if modified and content != original_content:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """メイン処理"""
    base_path = Path(__file__).parent
    total_files = 0
    updated_files = 0
    
    for dir_name in TARGET_DIRS:
        dir_path = base_path / dir_name
        
        if not dir_path.exists():
            print(f"Directory not found: {dir_path}")
            continue
        
        print(f"\nProcessing directory: {dir_name}")
        
        # 対象ファイルを検索
        for ext in EXTENSIONS:
            for file_path in dir_path.rglob(f'*{ext}'):
                total_files += 1
                if replace_in_file(file_path):
                    print(f"  Updated: {file_path.name}")
                    updated_files += 1
    
    print(f"\n{'='*50}")
    print(f"Total files processed: {total_files}")
    print(f"Total files updated: {updated_files}")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
