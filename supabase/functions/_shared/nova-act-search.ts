export type MaterialSearchHit = {
  product_name: string;
  price: string;
  image_url: string;
  product_url: string;
  store: "HomeDepot" | "Lowes";
  stock_status: "in_stock" | "out_of_stock" | "unknown";
};

export async function searchHomeDepot(keywords: string[]): Promise<MaterialSearchHit[]> {
  const query = keywords.slice(0, 3).join(" ");
  if (!query) return [];
  try {
    const url = `https://www.homedepot.com/s/${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ContractorGo/1.0)",
      },
    });
    const html = await res.text();
    const results: MaterialSearchHit[] = [];
    const jsonMatch = html.match(/__NEXT_DATA__" type="application\/json">([^<]+)</);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const products = data?.props?.pageProps?.initialData?.search?.products ?? [];
        for (const p of products.slice(0, 5)) {
          results.push({
            product_name: p.productLabel ?? p.name ?? "Product",
            price: p.pricing?.value ?? p.price ?? "—",
            image_url: p.media?.[0]?.url ?? p.thumbnail ?? "",
            product_url: p.url ? `https://www.homedepot.com${p.url}` : url,
            store: "HomeDepot",
            stock_status: p.availability === "in_stock" ? "in_stock" : p.availability === "out_of_stock" ? "out_of_stock" : "unknown",
          });
        }
      } catch {
        results.push({
          product_name: query,
          price: "—",
          image_url: "",
          product_url: url,
          store: "HomeDepot",
          stock_status: "unknown",
        });
      }
    }
    if (results.length === 0) {
      results.push({
        product_name: query,
        price: "—",
        image_url: "",
        product_url: url,
        store: "HomeDepot",
        stock_status: "unknown",
      });
    }
    return results;
  } catch (e) {
    console.error("[nova-act] HomeDepot search error", e);
    return [{
      product_name: query,
      price: "—",
      image_url: "",
      product_url: `https://www.homedepot.com/s/${encodeURIComponent(query)}`,
      store: "HomeDepot",
      stock_status: "unknown",
    }];
  }
}

export async function searchLowes(keywords: string[]): Promise<MaterialSearchHit[]> {
  const query = keywords.slice(0, 3).join(" ");
  if (!query) return [];
  try {
    const url = `https://www.lowes.com/search?searchTerm=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ContractorGo/1.0)",
      },
    });
    const html = await res.text();
    const results: MaterialSearchHit[] = [];
    const jsonMatch = html.match(/__PRELOADED_STATE__\s*=\s*({.+?});/s);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const products = data?.search?.products ?? data?.products ?? [];
        for (const p of (Array.isArray(products) ? products : []).slice(0, 5)) {
          results.push({
            product_name: p.name ?? p.productName ?? "Product",
            price: p.pricing?.value ?? p.price ?? "—",
            image_url: p.image ?? p.thumbnail ?? "",
            product_url: p.url ? (p.url.startsWith("http") ? p.url : `https://www.lowes.com${p.url}`) : url,
            store: "Lowes",
            stock_status: p.availability === "IN_STOCK" ? "in_stock" : p.availability === "OUT_OF_STOCK" ? "out_of_stock" : "unknown",
          });
        }
      } catch {
        results.push({
          product_name: query,
          price: "—",
          image_url: "",
          product_url: url,
          store: "Lowes",
          stock_status: "unknown",
        });
      }
    }
    if (results.length === 0) {
      results.push({
        product_name: query,
        price: "—",
        image_url: "",
        product_url: url,
        store: "Lowes",
        stock_status: "unknown",
      });
    }
    return results;
  } catch (e) {
    console.error("[nova-act] Lowes search error", e);
    return [{
      product_name: query,
      price: "—",
      image_url: "",
      product_url: `https://www.lowes.com/search?searchTerm=${encodeURIComponent(query)}`,
      store: "Lowes",
      stock_status: "unknown",
    }];
  }
}

export async function searchMaterialPrices(keywords: string[]): Promise<{
  homedepot: MaterialSearchHit[];
  lowes: MaterialSearchHit[];
}> {
  const [homedepot, lowes] = await Promise.all([
    searchHomeDepot(keywords),
    searchLowes(keywords),
  ]);
  return { homedepot, lowes };
}
