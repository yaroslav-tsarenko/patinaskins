"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";

type LinkButtonProps = Omit<ComponentProps<typeof Button>, "as" | "href"> & { href: string };

export function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button as={Link} href={href} {...props} />;
}
