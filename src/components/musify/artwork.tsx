import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Artwork({
  src,
  alt,
  className,
  radius = "rounded-lg",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  radius?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-high text-primary",
        radius,
        className,
      )}
    >
      {show ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Music className="size-[42%] opacity-80" />
        </div>
      )}
    </div>
  );
}
