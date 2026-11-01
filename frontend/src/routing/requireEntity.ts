import { notFound } from "@tanstack/react-router";

export function requireEntity<T>(entity: T | null | undefined): NonNullable<T> {
  if (entity === null || entity === undefined) throw notFound();
  return entity;
}
