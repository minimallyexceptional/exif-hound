import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  appSelectBlockClassName,
  appSelectCompactClassName,
} from './formControls';

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function parseOptions(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => {
      if (child.type !== 'option') return null;
      const props = child.props as { value?: string | number; disabled?: boolean; children?: React.ReactNode };
      return {
        value: String(props.value ?? ''),
        label: String(props.children ?? ''),
        disabled: props.disabled,
      };
    })
    .filter((option): option is SelectOption => option !== null);
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  compact?: boolean;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    compact = false,
    className = '',
    children,
    value,
    defaultValue,
    disabled,
    onChange,
    onBlur,
    name,
    id,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const options = useMemo(() => parseOptions(children), [children]);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value !== undefined && value !== null) return String(value);
    if (defaultValue !== undefined && defaultValue !== null) return String(defaultValue);
    return options[0]?.value ?? '';
  });

  const currentValue = value !== undefined && value !== null ? String(value) : internalValue;
  const selected = options.find((option) => option.value === currentValue) ?? options[0];
  const triggerClass = `${compact ? appSelectCompactClassName : appSelectBlockClassName}${className ? ` ${className}` : ''}`;

  const emitChange = useCallback((nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.({
      target: { value: nextValue, name: name ?? '' },
      currentTarget: { value: nextValue, name: name ?? '' },
    } as React.ChangeEvent<HTMLSelectElement>);
  }, [name, onChange, value]);

  const choose = useCallback((nextValue: string) => {
    emitChange(nextValue);
    setOpen(false);
  }, [emitChange]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const enabled = options.filter((option) => !option.disabled);
    const index = enabled.findIndex((option) => option.value === currentValue);

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          break;
        }
        if (enabled.length === 0) break;
        {
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          const next = enabled[(index + delta + enabled.length) % enabled.length];
          choose(next.value);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setOpen((current) => !current);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Home':
        if (!open || enabled.length === 0) break;
        event.preventDefault();
        choose(enabled[0].value);
        break;
      case 'End':
        if (!open || enabled.length === 0) break;
        event.preventDefault();
        choose(enabled[enabled.length - 1].value);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${compact ? 'inline-flex max-w-full min-w-0' : 'w-full'}`}>
      <button
        {...rest}
        ref={ref}
        id={id}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        data-value={currentValue}
        className={`${triggerClass} text-left`}
        onClick={() => { if (!disabled) setOpen((current) => !current); }}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) {
            setOpen(false);
            onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
          }
        }}
      >
        <span className="block truncate">{selected?.label ?? 'Choose…'}</span>
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="app-select-menu absolute left-0 top-[calc(100%+0.25rem)] z-[90] max-h-60 w-full min-w-full overflow-y-auto p-1"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === currentValue}
              aria-disabled={option.disabled || undefined}
              data-highlighted={option.value === currentValue || undefined}
              className="app-select-menu-item text-sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (option.disabled) return;
                choose(option.value);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
