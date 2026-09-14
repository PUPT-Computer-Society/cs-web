import React, { useEffect, useState } from "react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  icon?: React.ReactNode;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  className = "w-8 h-8 rounded-full",
  fallbackClassName,
  icon,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolved = resolveAvatarUrl(avatarUrl);

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  if (resolved && !hasError) {
    return (
      <img
        src={resolved}
        alt={name || "User avatar"}
        onError={() => setHasError(true)}
        className={cn("object-cover shrink-0", className)}
      />
    );
  }

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : "O";

  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold shrink-0 bg-primary/10 text-primary border border-primary/20 select-none",
        className,
        fallbackClassName,
      )}
    >
      {icon || initial}
    </div>
  );
};
