"use client";

import type * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-7 bg-transparent p-0 absolute left-1",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-7 bg-transparent p-0 absolute right-1",
        ),
        month_grid: "w-full border-collapse space-x-1",
        weekdays: "flex",
        weekday: "text-text-muted rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-background-muted [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-range-start)]:rounded-l-full",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-full [&:has(>.day-range-start)]:rounded-l-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full"
            : "[&:has([aria-selected])]:rounded-full",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        range_start:
          "day-range-start aria-selected:bg-background-accent aria-selected:text-primary",
        range_end:
          "day-range-end aria-selected:bg-background-accent aria-selected:text-primary",
        selected:
          "bg-background-accent text-text-inverse hover:bg-background-accent hover:text-text-inverse focus:bg-background-accent focus:text-primary",
        today: "bg-background-muted text-text-muted",
        outside: "day-outside text-text-muted aria-selected:text-text-muted",
        disabled: "text-text-muted opacity-50",
        range_middle:
          "aria-selected:bg-background-muted aria-selected:text-text-muted",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({
          orientation,
          ...props
        }: {
          orientation?: string;
          [key: string]: unknown;
        }) => {
          if (orientation === "left") {
            return <ChevronLeft className="size-4" {...props} />;
          }
          return <ChevronRight className="size-4" {...props} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
