"use client";
import { useState } from "react";
import { Search, Star, Clock, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockListings } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const categories = ["Todos", "Video", "Diseño", "Social Media", "Ads", "Automatización", "SEO"];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [query, setQuery] = useState("");

  const filtered = mockListings.filter((l) => {
    const matchQuery = !query || l.title.toLowerCase().includes(query.toLowerCase());
    const matchCat = activeCategory === "Todos" || l.category === activeCategory.toLowerCase().replace(" ", "_");
    return matchQuery && matchCat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Marketplace</h1>
        <p className="text-white/40 text-sm mt-1">Contrata servicios de marketing, diseño y más.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar servicios..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>
        <Button variant="outline" size="md">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-cyan-500 text-black"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((listing) => (
          <Card key={listing.id} hover className="p-5">
            {/* Thumbnail placeholder */}
            <div className="h-32 rounded-lg bg-gradient-to-br from-white/5 to-white/10 mb-4 flex items-center justify-center">
              <span className="text-white/20 text-xs">Vista previa</span>
            </div>
            <h3 className="text-white font-semibold text-sm leading-snug mb-1">{listing.title}</h3>
            <p className="text-white/40 text-xs mb-3 line-clamp-2">{listing.description}</p>

            {/* Seller + rating */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {listing.seller.name.charAt(0)}
                </div>
                <span className="text-white/50 text-xs">{listing.seller.name}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" />
                <span className="text-xs font-medium">{listing.rating}</span>
                <span className="text-white/30 text-[10px]">({listing.reviewCount})</span>
              </div>
            </div>

            <div className="flex gap-1.5 mb-4">
              {listing.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Entrega en {listing.deliveryDays} días</span>
                </div>
                <span className="text-white font-bold">
                  Desde {formatCurrency(listing.price)}
                </span>
              </div>
              <Button size="sm">Contratar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
