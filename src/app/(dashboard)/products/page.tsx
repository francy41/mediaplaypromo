"use client";
import { Download, Star, Clock, ChevronRight, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function ProductsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mis Productos</h1>
        <p className="text-white/40 text-sm mt-1">Todas las herramientas y software en tu cuenta.</p>
      </div>

      <div className="space-y-4">
        {mockProducts.map((product) => (
          <Card key={product.id} className="p-5 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center font-black text-white text-lg flex-shrink-0`}>
                {product.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold">{product.name}</h3>
                    <p className="text-white/40 text-xs mt-0.5">{product.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="info">v{product.version}</Badge>
                    <Badge variant="success">Activo</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.features.map((f) => (
                    <span key={f} className="bg-white/5 border border-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1 text-white/30 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Actualizado {formatDate(product.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      Reseñar
                    </Button>
                    <Button size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {mockProducts.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No tienes productos aún.</p>
          <Button className="mt-4" size="sm">Explorar Marketplace</Button>
        </Card>
      )}
    </div>
  );
}
