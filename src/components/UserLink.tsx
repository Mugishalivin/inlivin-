import { Link } from "react-router-dom";
import { User } from "lucide-react";
import type { ReactNode } from "react";
import { UserBadge } from "@/components/UserBadge";


interface UserLinkProps {
  userId: string;
  children?: ReactNode;
  className?: string;
}

export function UserAvatar({ userId, avatarUrl, size = 10, className = "" }: { userId: string; avatarUrl?: string | null; size?: number; className?: string }) {
  return (
    <Link to={`/profile/${userId}`} className={`shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-secondary hover:ring-2 hover:ring-primary/30 transition-all ${className}`}
      style={{ width: size * 4, height: size * 4 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <User size={size * 1.5} className="text-muted-foreground" />
      )}
    </Link>
  );
}

export function UserName({ userId, name, className = "", badgeSize = 14 }: { userId: string; name?: string | null; className?: string; badgeSize?: number }) {
  return (
    <span className="inline-flex items-center gap-1 min-w-0">
      <Link to={`/profile/${userId}`} className={`truncate hover:text-primary hover:underline transition-colors ${className}`}>
        {name || "Artist"}
      </Link>
      <UserBadge userId={userId} size={badgeSize} />
    </span>
  );
}

