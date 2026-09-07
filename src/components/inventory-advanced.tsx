"use client";

import { Boxes, ChevronLeft, ChevronRight, Grid2X2, List, Package, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/data/inventory";
import { exportInventory, getStockHealth, type StockHealth } from "@/components/management-views";

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const statusOptions: Array<"Semua" | StockHealth> = ["Semua", "Aman", "Mau habis", "Perlu restock", "Habis"];
type SortKey = "priority" | "stock-asc" | "stock-desc" | "name";

function dailyUsage(item: Item) {
  const hash = item.sku.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Math.max(0.35, (hash % 28) / 10 + 0.6);
}
function daysLeft(item: Item) { return item.stock <= 0 ? 0 : Math.max(1, Math.round(item.stock / dailyUsage(item))); }
function statusRank(item: Item) {
  const health = getStockHealth(item).label;
  if (health === "Habis") return 0;
  if (health === "Perlu restock") return 1;
  if (health === "Mau habis") return 2;
  return 3;
}

export default function InventoryAdvanced({ items, query, setQuery, onAdd, onSelect }: { items: Item[]; query: string; setQuery: (value: string) => void; onAdd: () => void; onSelect: (item: Item) => void }) {
  const [view, setView] = useState<"card" | "table">("card");
  const [status, setStatus] = useState<"Semua" | StockHealth>("Semua");
  const [sort, setSort] = useState<SortKey>("priority");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => setPage(1), [query, status, sort, pageSize]);

  const processed = useMemo(() => {
    const result = items.filter((item) => status === "Semua" || getStockHealth(item).label === status).slice();
    if (sort === "stock-asc") result.sort((a, b) => a.stock - b.stock);
    if (sort === "stock-desc") result.sort((a, b) => b.stock - a.stock);
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name, "id"));
    if (sort === "priority") result.sort((a, b) => statusRank(a) - statusRank(b) || a.stock - b.stock);
    return result;
  }, [items, status, sort]);

  const counts = useMemo(() => items.reduce<Record<StockHealth, number>>((acc, item) => {
    acc[getStockHealth(item).label] += 1; return acc;
  }, { Aman: 0, "Mau habis": 0, "Perlu restock": 0, Habis: 0 }), [items]);

  const pages = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalValue = processed.reduce((sum, item) => sum + item.stock * item.price, 0);

  return <div className="page-content inventory-v2">
    <section className="page-heading"><div><h2>Daftar persediaan F&amp;B</h2><p>Card view untuk monitoring cepat, table view untuk administrasi detail.</p></div><button className="primary" onClick={onAdd}>+ Tambah barang</button></section>
    <section className="inventory-summary-strip">
      <div><span>Item tampil</span><strong>{processed.length}</strong><small>dari {items.length} item</small></div>
      <div><span>Nilai persediaan</span><strong>{money.format(totalValue)}</strong><small>nominal lengkap</small></div>
      <div><span>Perlu restock</span><strong>{counts["Perlu restock"]}</strong><small>{counts.Habis} item habis</small></div>
      <div><span>Mau habis</span><strong>{counts["Mau habis"]}</strong><small>perlu dipantau</small></div>
    </section>
    <article className="panel inventory-control-panel">
      <div className="inventory-toolbar-v2">
        <label className="search inventory-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari barang, SKU, kategori, supplier…"/></label>
        <div className="view-switch"><button className={view === "card" ? "active" : ""} onClick={() => setView("card")}><Grid2X2 size={16}/> Card</button><button className={view === "table" ? "active" : ""} onClick={() => setView("table")}><List size={16}/> Table</button></div>
        <select className="inventory-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="priority">Prioritas restock</option><option value="stock-asc">Stok terendah</option><option value="stock-desc">Stok tertinggi</option><option value="name">Nama A–Z</option></select>
        <button className="secondary" onClick={() => exportInventory(processed)}>Export CSV</button>
      </div>
      <div className="status-filter-row">{statusOptions.map((option) => <button key={option} className={status === option ? "active" : ""} onClick={() => setStatus(option)}>{option}{option !== "Semua" && <b>{counts[option]}</b>}</button>)}</div>
    </article>
    {view === "card" ? <section className="inventory-card-grid">
      {visible.map((item) => { const health = getStockHealth(item); const estimate = daysLeft(item); return <button key={item.id} className="inventory-card" onClick={() => onSelect(item)}>
        <div className="inventory-card-head"><span className="inventory-card-icon"><Package size={19}/></span><span className={`status ${health.tone}`}>{health.label}</span></div>
        <div className="inventory-card-copy"><small>{item.category}</small><h3>{item.name}</h3><p>{item.sku}</p></div>
        <div className="inventory-stock-line"><div><span>Stok</span><strong>{item.stock} {item.unit}</strong></div><div><span>Minimum</span><strong>{item.minimum} {item.unit}</strong></div></div>
        <div className="inventory-progress"><i style={{ width: `${health.percentage}%` }}/></div>
        <div className="inventory-card-meta"><span><b>{estimate}</b> hari estimasi</span><span>{health.restock > 0 ? `Pesan ${health.restock} ${item.unit}` : "Stok aman"}</span></div>
        <div className="inventory-card-foot"><span>{item.supplier}</span><strong>{money.format(item.stock * item.price)}</strong></div>
      </button>; })}
    </section> : <article className="panel table-panel inventory-table-v2"><div className="table-scroll"><table><thead><tr><th>Barang</th><th>Kategori</th><th>Supplier</th><th>Stok</th><th>Minimum</th><th>Status</th><th>Estimasi habis</th><th>Rekomendasi</th><th>Nilai stok</th><th>Aksi</th></tr></thead><tbody>{visible.map((item) => { const health = getStockHealth(item); return <tr key={item.id}><td><div className="item-name"><span><Boxes size={17}/></span><div><strong>{item.name}</strong><small>{item.sku}</small></div></div></td><td>{item.category}</td><td>{item.supplier}</td><td><b>{item.stock}</b> {item.unit}</td><td>{item.minimum} {item.unit}</td><td><span className={`status ${health.tone}`}>{health.label}</span></td><td>{daysLeft(item)} hari</td><td>{health.restock ? <b>{health.restock} {item.unit}</b> : "—"}</td><td>{money.format(item.stock * item.price)}</td><td><button className="table-action" onClick={() => onSelect(item)}>Detail</button></td></tr>; })}</tbody></table></div></article>}
    <section className="inventory-pagination"><div>Menampilkan <b>{processed.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, processed.length)}</b> dari {processed.length} item</div><div className="page-size"><span>Per halaman</span><select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}><option value={12}>12</option><option value={18}>18</option><option value={24}>24</option></select></div><div className="page-buttons"><button disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16}/></button><span>{currentPage} / {pages}</span><button disabled={currentPage >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}><ChevronRight size={16}/></button></div></section>
  </div>;
}
