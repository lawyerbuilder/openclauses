import { FavoritesGrid } from "@/components/favorites-grid";

export const metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <div className="container py-12 max-w-5xl">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-2">Your favorites</p>
        <h1 className="text-[2.25rem] font-semibold tracking-tight leading-tight">
          Saved clauses
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Clauses you&apos;ve hearted, stored on this device. Use the heart on any clause card to
          add or remove. Favorites stay private to your browser — clearing site data will reset
          this list.
        </p>
      </header>

      <FavoritesGrid withSectionHeader={false} />
    </div>
  );
}
