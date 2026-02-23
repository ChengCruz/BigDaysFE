// src/components/atoms/PageLoader.tsx
import React from "react";
import { Spinner } from "./Spinner";

interface Props {
  message?: string;
}

export const PageLoader: React.FC<Props> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
    <div className="text-primary">
      <Spinner />
    </div>
    <p className="text-sm text-text/50 dark:text-white/50">{message}</p>
  </div>
);
