import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { DataverseConnection } from '@/types/powerplatform';

const formSchema = z.object({
  displayName: z.string().min(1, '表示名を入力してください'),
  environmentId: z.string().min(1, '環境IDを入力してください').regex(
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    '有効なGUID形式で入力してください'
  ),
  environmentUrl: z.string().url('有効なURLを入力してください'),
  apiVersion: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConnectionFormProps {
  connection?: DataverseConnection;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ConnectionForm({ connection, onSubmit, onCancel, isSubmitting }: ConnectionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: connection?.displayName || '',
      environmentId: connection?.environmentId || '',
      environmentUrl: connection?.environmentUrl || '',
      apiVersion: connection?.apiVersion || '9.2',
      description: connection?.description || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>表示名 *</FormLabel>
              <FormControl>
                <Input placeholder="本番環境 Dataverse" {...field} />
              </FormControl>
              <FormDescription>
                この接続の分かりやすい名前を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="environmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>環境ID *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="12345678-1234-1234-1234-123456789abc" 
                  className="font-mono text-sm"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Power Platform管理センターから取得した環境のGUID
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="environmentUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>環境URL *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://org.crm.dynamics.com" 
                  className="font-mono text-sm"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Dataverse環境のベースURL (例: https://org.crm7.dynamics.com)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiVersion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>APIバージョン</FormLabel>
              <FormControl>
                <Input placeholder="9.2" {...field} />
              </FormControl>
              <FormDescription>
                Dataverse Web APIのバージョン (通常は 9.2)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明 (任意)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="この接続の用途や注意事項を記入"
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : connection ? '更新' : '作成'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            キャンセル
          </Button>
        </div>
      </form>
    </Form>
  );
}
