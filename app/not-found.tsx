import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Not found</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn&apos;t find that clause. It may have been removed or the link is wrong.
      </p>
      <Link href="/" className="mt-6 inline-block text-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
