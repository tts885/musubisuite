/**
 * Power Appsプロバイダー
 * 
 * Power Apps SDKを初期化し、Power Apps環境との統合を提供します。
 * アプリケーション起動時に1回だけ初期化します。
 * 
 * @module providers/power-provider
 */

import { useEffect, type ReactNode } from "react";
import { initialize } from "@microsoft/power-apps/app";

/**
 * SDK初期化状態フラグ
 * 
 * 複数回の初期化を防ぐためのフラグです。
 * 
 * @private
 * @type {boolean}
 */
let initializedCalled = false;

/**
 * PowerProviderコンポーネントのProps
 * @typedef {Object} PowerProviderProps
 * @property {ReactNode} children - 子コンポーネント
 */
type PowerProviderProps = { children: ReactNode }

/**
 * Power Appsプロバイダーコンポーネント
 * 
 * @microsoft/power-apps SDKを初期化し、Power Apps環境との統合を有効化します。
 * 初期化はアプリケーションライフサイクルで一度だけ実行されます。
 * 
 * @component
 * @param {PowerProviderProps} props - コンポーネントのprops
 * @returns {JSX.Element} Power Appsプロバイダー
 * 
 * @example
 * ```tsx
 * <PowerProvider>
 *   <App />
 * </PowerProvider>
 * ```
 * 
 * @remarks
 * - Power Appsホストとの通信を初期化
 * - Microsoft Entra ID認証を利用可能
 * - Dataverse接続機能を提供
 * - 初期化エラーはコンソールに記録
 */
export function PowerProvider({ children }: PowerProviderProps) {
  useEffect(() => {
    if (initializedCalled) return;
    initializedCalled = true;

    const initApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Power Apps SDK initialize failed: ', error);
      }
    };
    initApp();
  }, []);

  return <>{children}</>;
}