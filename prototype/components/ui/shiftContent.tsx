import * as React from "react";
import { cn } from "@/lib/utils";

const ShiftCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "space-y-0.5 rounded-lg border border-border border-l-4 border-l-primary bg-card p-4 text-card-foreground shadow-sm",
                className
            )}
            {...props}
        />
    )
);
ShiftCard.displayName = "ShiftCard";

const ShiftTime = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
    )
);
ShiftTime.displayName = "ShiftTime";

const ShiftEmployee = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
    )
);
ShiftEmployee.displayName = "ShiftEmployee";

const ShiftTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h4 ref={ref} className={cn("text-sm font-semibold leading-none tracking-tight", className)} {...props} />
    )
);
ShiftTitle.displayName = "ShiftTitle";

export { ShiftCard, ShiftEmployee, ShiftTime, ShiftTitle };
