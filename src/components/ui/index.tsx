import React from 'react';


// Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';
    const variants = {
      default: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] shadow-sm',
      outline: 'border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]',
      ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
      destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
      secondary: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]',
      link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-11 px-6 text-sm',
      icon: 'h-9 w-9',
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full min-h-[80px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150 resize-y ${className ?? ''}`}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// Label
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-xs font-medium text-[var(--color-text-secondary)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ''}`}
      {...props}
    />
  )
);
Label.displayName = 'Label';

// Card
export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] ${className ?? ''}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1 p-4 ${className ?? ''}`} {...props}>{children}</div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-sm font-semibold text-[var(--color-text-primary)] ${className ?? ''}`} {...props}>{children}</h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-4 pb-4 ${className ?? ''}`} {...props}>{children}</div>
);

// Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}
export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
    success: 'bg-emerald-600 text-white dark:bg-emerald-900 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className ?? ''}`}
      {...props}
    />
  );
};

// Select
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={`h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150 disabled:opacity-50 cursor-pointer ${className ?? ''}`}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// Separator
export const Separator = ({ className, orientation = 'horizontal', ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) => (
  <div
    role="separator"
    className={`bg-[var(--color-border)] ${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'} ${className ?? ''}`}
    {...props}
  />
);

// Switch
export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}
export const Switch = ({ checked, onCheckedChange, disabled, className, id }: SwitchProps) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'} ${className ?? ''}`}
  >
    <span
      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

// Tooltip (simple)
export const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="relative group inline-flex">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
      {content}
    </div>
  </div>
);

// Dialog
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 animate-scale-in">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-6 w-full max-h-[90vh] overflow-y-auto ${className ?? ''}`}
    {...props}
  >
    {children}
  </div>
);

export const DialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className ?? ''}`} {...props}>{children}</div>
);

export const DialogTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={`text-lg font-semibold text-[var(--color-text-primary)] ${className ?? ''}`} {...props}>{children}</h2>
);

export const DialogFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mt-6 flex justify-end gap-3 ${className ?? ''}`} {...props}>{children}</div>
);

// FormField utility
export const FormField = ({ label, children, error, className }: { label: string; children: React.ReactNode; error?: string; className?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
    <Label>{label}</Label>
    {children}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

// Skeleton
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse rounded-lg bg-[var(--color-border)] ${className ?? ''}`}
    {...props}
  />
);
