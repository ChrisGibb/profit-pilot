
import { cn } from "@/lib/utils";
import React from "react";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 300 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="150"
          y="50"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          fontFamily="Montserrat, sans-serif"
          fontSize="50"
          fontWeight="bold"
          letterSpacing="-0.5"
        >
          ProfitPilot
        </text>
        <rect x="20" y="75" width="260" height="2" fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
};
