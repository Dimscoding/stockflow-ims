"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, FileDown, PackageCheck, Plus, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/data/inventory";
import { getStockHealth } from "@/components/management-views";

type Supplier = {
  id: string; name: string; category: string; contact: string; phone: string; address: string; leadDays: number; status: "Aktif" | "Evaluasi";
};

type POStatus = "Draft" | "Diajukan" | "Disetujui" | "Dipesan" | "Diterima";
type POItem = { itemId: string; name: string; qty: number; unit: string; price: number };
type PurchaseOrder = { id: string; supplierId: string; supplier: string; createdAt: string; expectedAt: string; status: POStatus; items: POItem[]; note: string };

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => { const value = new Date(`${date}T00:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };

const seedSuppliers: Supplier[] = [
  { id:"SUP-001", name:"IndoGuna Utama", category:"Meat, dairy & imported food", contact:"Sales HORECA", phone:"+62 21 7593 4000", address:"Jakarta", leadDays:3, status:"Aktif" },
  { id:"SUP-002", name:"Classic Fine Foods Indonesia", category:"Premium food ingredients", contact:"Account Executive", phone:"+62 21 7590 8080", address:"Jakarta", leadDays:4, status:"Aktif" },
  { id:"SUP-003", name:"Toffin Indonesia", category:"Beverage & cafe supplies", contact:"B2B Sales", phone:"+62 21 2940 5060", address:"Jakarta", leadDays:3, status:"Aktif" },
  { id:"SUP-004", name:"Lotte Grosir", category:"General wholesale", contact:"Business Center", phone:"+62 21 840 4080", address:"Mataram", leadDays:2, status:"Aktif" },
  { id:"SUP-005", name:"Supplier Produce Lokal", category:"Sayuran & buah segar", contact:"Koordinator Pasar", phone:"+62 812 0000 1122", address:"Mataram", leadDays:1, status:"Evaluasi" },
];

function useStored<T>(key: string, seed: T) {
  const [value, setValue] = useState<T>(seed);
  const storageReady = useRef(false);
  const seedValue = useRef(seed);
  useEffect(() => { const raw = localStorage.getItem(key); if (!raw) { localStorage.setItem(key, JSON.stringify(seedValue.current)); storageReady.current = true; return; } const frame = requestAnimationFrame(() => { storageReady.current = true; setValue(JSON.parse(raw) as T); }); return () => cancelAnimationFrame(frame); }, [key]);
  useEffect(() => { if (storageReady.current) localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

export default function SupplierPOView({ items }: { items: Item[] }) {
  const [suppliers] = useStored<Supplier[]>("stockflow-suppliers-po-v1", seedSuppliers);
  const [orders, setOrders] = useStored<PurchaseOrder[]>("stockflow-pos-v1", []);
  const [supplierId, setSupplierId] = useState(seedSuppliers[0].id);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"Semua" | POStatus>("Semua");
  const [comparisonItemId, setComparisonItemId] = useState("");

  const supplier = suppliers.find((entry) => entry.id === supplierId) ?? suppliers[0];
  const restockItems = useMemo(() => items.map((item) => ({ item, health: getStockHealth(item) })).filter(({ health }) => health.restock > 0).sort((a,b) => b.health.restock - a.health.restock), [items]);
  const visibleOrders = orders.filter((order) => filter === "Semua" || order.status === filter);
  const overdue = orders.filter((order) => order.status !== "Diterima" && order.status !== "Draft" && order.expectedAt < today()).length;
  const pendingValue = orders.filter((order) => order.status !== "Diterima").reduce((sum, order) => sum + order.items.reduce((sub, line) => sub + line.qty * line.price, 0), 0);
  const comparisonItem = items.find((item) => item.id === comparisonItemId) ?? restockItems[0]?.item ?? items[0];
  const quotes = comparisonItem ? suppliers.map((entry, index) => ({ supplier: entry, price: Math.round(comparisonItem.price * (0.94 + ((index * 7 + Number(comparisonItem.id)) % 13) / 100)) })).sort((a,b)=>a.price-b.price) : [];

  function createPO() {
    const chosen = restockItems.filter(({ item }) => selected[item.id]);
    if (!chosen.length) return;
    const created = today();
    const po: PurchaseOrder = {
      id: `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, "0")}`,
      supplierId: supplier.id, supplier: supplier.name, createdAt: created, expectedAt: addDays(created, supplier.leadDays), status: "Draft",
      items: chosen.map(({ item, health }) => ({ itemId: item.id, name: item.name, qty: health.restock, unit: item.unit, price: item.price })), note: note || "PO restock otomatis",
    };
    setOrders((current) => [po, ...current]); setSelected({}); setNote("");
  }

  function advance(order: PurchaseOrder) {
    const sequence: POStatus[] = ["Draft", "Diajukan", "Disetujui", "Dipesan", "Diterima"];
    const next = sequence[Math.min(sequence.length - 1, sequence.indexOf(order.status) + 1)];
    setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: next } : entry));
  }

  function exportCSV() {
    const rows = [["PO","Supplier","Dibuat","Estimasi tiba","Status","Nilai"], ...orders.map((order) => [order.id, order.supplier, order.createdAt, order.expectedAt, order.status, String(order.items.reduce((sum,line)=>sum+line.qty*line.price,0))])];
    const blob = new Blob([rows.map((row)=>row.map((cell)=>`"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n")], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="purchase-orders.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="page-content po-view">
    <section className="page-heading"><div><h2>Supplier & Purchase Order</h2><p>Buat PO dari kebutuhan restock dan pantau status hingga barang diterima.</p></div><button className="secondary" onClick={exportCSV}><FileDown size={17}/> Export PO</button></section>

    <section className="po-stats">
      <div><ClipboardList/><span><small>Total PO</small><strong>{orders.length}</strong></span></div>
      <div><Clock3/><span><small>Nilai PO aktif</small><strong>{money.format(pendingValue)}</strong></span></div>
      <div><AlertTriangle/><span><small>Terlambat</small><strong>{overdue}</strong></span></div>
      <div><Truck/><span><small>Supplier aktif</small><strong>{suppliers.filter((entry)=>entry.status === "Aktif").length}</strong></span></div>
    </section>

    <section className="po-grid">
      <article className="panel po-builder">
        <div className="section-title"><div><h3>Buat Purchase Order</h3><p>Pilih item yang perlu restock, lalu sistem isi jumlah rekomendasi otomatis.</p></div></div>
        <div className="po-form-row"><label>Supplier<select value={supplierId} onChange={(e)=>setSupplierId(e.target.value)}>{suppliers.map((entry)=><option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label>Lead time<input value={`${supplier.leadDays} hari`} disabled/></label></div>
        <div className="supplier-mini"><b>{supplier.name}</b><span>{supplier.category} · {supplier.contact} · {supplier.phone}</span><small>{supplier.address} · status {supplier.status}</small></div>
        <div className="po-restock-list">{restockItems.slice(0,18).map(({ item, health }) => <label key={item.id} className={selected[item.id] ? "selected" : ""}><input type="checkbox" checked={!!selected[item.id]} onChange={(e)=>setSelected((current)=>({ ...current, [item.id]: e.target.checked }))}/><span><strong>{item.name}</strong><small>{item.sku} · stok {item.stock} {item.unit}</small></span><b>{health.restock} {item.unit}</b></label>)}</div>
        <label className="po-note">Catatan<input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Contoh: prioritas pengiriman pagi"/></label>
        <button className="primary" onClick={createPO}><Plus size={16}/> Buat PO Draft</button>
      </article>

      <article className="panel supplier-list-card"><div className="section-title"><div><h3>Ringkasan supplier</h3><p>Lead time dan status pemasok.</p></div></div>{suppliers.map((entry)=><div className="supplier-row" key={entry.id}><span className="supplier-icon"><Truck size={16}/></span><div><strong>{entry.name}</strong><small>{entry.category}</small></div><span>{entry.leadDays} hari</span><b className={entry.status === "Aktif" ? "supplier-ok" : "supplier-warn"}>{entry.status}</b></div>)}</article>
    </section>

    <article className="panel price-comparison"><div className="section-title"><div><h3>Perbandingan harga supplier</h3><p>Simulasi penawaran per satuan untuk membantu keputusan purchasing.</p></div><select value={comparisonItem?.id ?? ""} onChange={(event)=>setComparisonItemId(event.target.value)}>{items.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="quote-grid">{quotes.slice(0,5).map((quote,index)=><div key={quote.supplier.id} className={index===0?"best-quote":""}><span><strong>{quote.supplier.name}</strong><small>{quote.supplier.leadDays} hari · {quote.supplier.status}</small></span><b>{money.format(quote.price)}<small>/{comparisonItem?.unit}</small></b>{index===0&&<em>Harga terbaik</em>}</div>)}</div><p className="simulation-note">Harga bersifat simulasi demo dan dapat diganti dengan penawaran supplier aktual saat database purchasing diaktifkan.</p></article>

    <article className="panel po-history">
      <div className="po-history-head"><div><h3>Riwayat Purchase Order</h3><p>Status: Draft → Diajukan → Disetujui → Dipesan → Diterima.</p></div><select value={filter} onChange={(e)=>setFilter(e.target.value as "Semua"|POStatus)}><option>Semua</option><option>Draft</option><option>Diajukan</option><option>Disetujui</option><option>Dipesan</option><option>Diterima</option></select></div>
      <div className="table-scroll"><table><thead><tr><th>PO</th><th>Supplier</th><th>Item</th><th>Nilai</th><th>Estimasi tiba</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{visibleOrders.length ? visibleOrders.map((order)=>{ const value=order.items.reduce((sum,line)=>sum+line.qty*line.price,0); const late=order.status!=="Diterima"&&order.status!=="Draft"&&order.expectedAt<today(); return <tr key={order.id}><td><strong>{order.id}</strong><small className="table-meta">{order.createdAt}</small></td><td>{order.supplier}</td><td>{order.items.length} item</td><td><b>{money.format(value)}</b></td><td>{order.expectedAt}{late&&<span className="late-badge">Terlambat</span>}</td><td><span className={`po-status po-${order.status.toLowerCase()}`}>{order.status}</span></td><td>{order.status!=="Diterima"?<button className="table-action" onClick={()=>advance(order)}>Lanjut status</button>:<span className="received-label"><CheckCircle2 size={14}/> Selesai</span>}</td></tr>}) : <tr><td colSpan={7}><div className="empty-po"><PackageCheck/><span>Belum ada PO pada filter ini.</span></div></td></tr>}</tbody></table></div>
    </article>
  </div>;
}
