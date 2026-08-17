import Image from "next/image";
import Link from "next/link";

export function Logo({
  href = "/",
  height = 40,
}: {
  href?: string;
  height?: number;
}) {
  return (
    <Link href={href} className="inline-flex items-center" aria-label="X Performance">
      <Image
        src="/brand/logo.png"
        alt="X Performance"
        width={0}
        height={0}
        sizes="200px"
        style={{ height, width: "auto" }}
        priority
      />
    </Link>
  );
}
