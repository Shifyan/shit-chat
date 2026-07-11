import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-default border border-outline-variant bg-surface px-md transition-all outline-none font-body-md text-body-md placeholder:text-outline focus-visible:border-primary focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-transparent dark:border-outline-variant dark:focus-visible:border-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
