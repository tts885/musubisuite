import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { codeMasterService, type CodeMaster } from '@/services/codemaster';

interface CodeMasterSelectProps {
  category: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CodeMasterSelect({
  category,
  value,
  onChange,
  placeholder = '選択してください',
  disabled = false,
  className,
}: CodeMasterSelectProps) {
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState<CodeMaster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCodes();
  }, [category]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const data = await codeMasterService.getCodesByCategory(category);
      setCodes(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const selectedCode = codes.find((code) => code.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || loading}
        >
          <span className="flex items-center gap-2">
            {selectedCode ? (
              <>
                {selectedCode.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCode.color }}
                  />
                )}
                {selectedCode.name}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="検索..." />
          <CommandList>
            <CommandEmpty>見つかりませんでした</CommandEmpty>
            <CommandGroup>
              {codes.map((code) => (
                <CommandItem
                  key={code.code}
                  value={code.code}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === code.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex items-center gap-2">
                    {code.color && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: code.color }}
                      />
                    )}
                    <span>{code.name}</span>
                    {code.name_en && (
                      <span className="text-xs text-muted-foreground">
                        ({code.name_en})
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
