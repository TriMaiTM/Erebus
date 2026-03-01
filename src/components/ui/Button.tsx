import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils'; // Đã đổi đường dẫn

const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 border-transparent",
    secondary: "bg-surface text-text-primary border border-border hover:bg-border/50",
    ghost: "bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
};

const sizeStyles = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 py-2 text-sm",
    lg: "h-10 px-8 text-base",
    icon: "h-9 w-9 p-0"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof variantStyles;
    size?: keyof typeof sizeStyles;
    isLoading?: boolean;
    children: ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={cn(
                // Base styles
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                // Variant styles
                variantStyles[variant],
                // Size styles
                sizeStyles[size],
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {children}
        </button>
    );
};