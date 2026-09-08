"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, PackageOpen, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/data/inventory";
import type { StockTransaction } from "@/components/management-views";

type BatchStatus = "Aman" | "≤30 hari" | "≤14 hari" | "≤7 hari" | "Kedaluwarsa";

type BatchRecord = {
  id: string;
  itemId: string;
  itemName: string;
  batchNo: string;
  qty: number;
  unit: string;
  productionDate: string;
  expiryDate: string;
  supplier: string;
  condition: "Baik" | "Rusak" | "Basi" | "Kedaluwarsa";
  note: string;
};

const seedBatches: BatchRecord[] = [
  { id: "BAT-001", itemId: "1", itemName: "Fresh Milk Pasteurisasi 1 L", batchNo: "FM-260902-A", qty: 18, unit: "Kotak", productionDate: "2026-09-02", expiryDate: "2026-09-12", supplier: "Greenfields / Diamond", condition: "Baik", note: "Chiller A1" },
  { id: "BAT-002", itemId: "1", itemName: "Fresh Milk Pasteurisasi 1 L", batchNo: "FM-260905-B", qty: 24, unit: "Kotak", productionDate: "2026-09-05", expiryDate: "2026-09-18", supplier: "Greenfields / Diamond", condition: "Baik", note: "Chiller A2" },
  { id: "BAT-003", itemId: "16", itemName: "Biji Kopi House Blend Arabika/Robusta 70:30", batchNo: "HB-260801", qty: 12, unit: "Kg", productionDate: "2026-08-01", expiryDate: "2027-02-01", supplier: "Tanamera / Anomali", condition: "Baik", note: "Beverage Bar" },
];

function daysToExpiry(date: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function statusFor(date: string): BatchStatus {
  const days = daysToExpiry(date);
  if (days < 0) return "Kedaluwarsa";
  if (days <= 7) return "≤7 hari";
  if (days <= 14) return "≤14 hari";
  if (days <= 30) return "≤30 hari";
  return "Aman";
}

export default function BatchExpiryView({ items, transactions }: { items: Item[]; transactions: StockTransaction[] }) {
  const [records, setRecords] = useState<BatchRecord[]>(seedBatches);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"Semua" | BatchStatus>("Semua");
  const [form, setForm] = useState({ itemId: items[0]?.id ?? "", batchNo: "", qty: "", productionDate: new Date().toISOString().slice(0, 10), expiryDate: "", condition: "Baik", note: "" });
  const storageReady = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("stockflow-batches-v1");
    if (!stored) { localStorage.setItem("stockflow-batches-v1", JSON.stringify(seedBatches)); storageReady.current = true; return; }
    const frame = requestAnimationFrame(() => { storageReady.current = true; setRecords(JSON.parse(stored)); });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (storageReady.current) localStorage.setItem("stockflow-batches-v1", JSON.stringify(records)); }, [records]);

  const transactionBatches = useMemo<BatchRecord[]>(() => transactions.filter((record) => record.type === "in" && record.batchNo && record.expiryDate).map((record) => ({ id: `TRX-${record.id}`, itemId: record.itemId, itemName: record.item, batchNo: record.batchNo!, qty: record.qty, unit: record.unit, productionDate: record.productionDate || record.date, expiryDate: record.expiryDate!, supplier: record.party, condition: "Baik", note: `Dari transaksi ${record.id}` })), [transactions]);
  const allRecords = useMemo(() => [...transactionBatches, ...records.filter((record) => !transactionBatches.some((transaction) => transaction.itemId === record.itemId && transaction.batchNo === record.batchNo))], [records, transactionBatches]);

  const visible = useMemo(() => allRecords
    .filter((r) => filter === "Semua" || statusFor(r.expiryDate) === filter)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()), [allRecords, filter]);

  const counts = useMemo(() => allRecords.reduce<Record<BatchStatus, number>>((acc, r) => { acc[statusFor(r.expiryDate)] += 1; return acc; }, { Aman: 0, "≤30 hari": 0, "≤14 hari": 0, "≤7 hari": 0, Kedaluwarsa: 0 }), [allRecords]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const item = items.find((i) => i.id === form.itemId);
    if (!item) return;
    setRecords((current) => [{ id: `BAT-${Date.now()}`, itemId: item.id, itemName: item.name, batchNo: form.batchNo, qty: Number(form.qty), unit: item.unit, productionDate: form.productionDate, expiryDate: form.expiryDate, supplier: item.supplier, condition: form.condition as BatchRecord["condition"], note: form.note }, ...current]);
    setShowForm(false);
    setForm((f) => ({ ...f, batchNo: "", qty: "", expiryDate: "", note: "" }));
  }

  return <div className="page-content batch-view">
    <section className="page-heading"><div><h2>Batch &amp; kedaluwarsa</h2><p>FEFO aktif: batch dengan tanggal kedaluwarsa terdekat diprioritaskan lebih dahulu.</p></div><button className="primary" onClick={() => setShowForm((v) => !v)}><Plus size={17}/> Batch masuk</button></section>

    <section className="management-stats batch-stats"><div><PackageOpen/><span><small>Total batch</small><strong>{allRecords.length}</strong></span></div><div><CalendarClock/><span><small>≤ 30 hari</small><strong>{counts["≤30 hari"] + counts["≤14 hari"] + counts["≤7 hari"]}</strong></span></div><div><AlertTriangle/><span><small>Kritis ≤ 7 hari</small><strong>{counts["≤7 hari"] + counts.Kedaluwarsa}</strong></span></div></section>

    {showForm && <form className="panel batch-form" onSubmit={submit}><div className="form-grid"><label>Barang<select value={form.itemId} onChange={(e)=>setForm({...form,itemId:e.target.value})}>{items.map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>No. batch<input required value={form.batchNo} onChange={(e)=>setForm({...form,batchNo:e.target.value})} placeholder="Contoh: FM-260907-A"/></label><label>Jumlah<input required type="number" min="1" value={form.qty} onChange={(e)=>setForm({...form,qty:e.target.value})}/></label><label>Tanggal produksi<input type="date" value={form.productionDate} onChange={(e)=>setForm({...form,productionDate:e.target.value})}/></label><label>Kedaluwarsa<input required type="date" value={form.expiryDate} onChange={(e)=>setForm({...form,expiryDate:e.target.value})}/></label><label>Kondisi<select value={form.condition} onChange={(e)=>setForm({...form,condition:e.target.value})}><option>Baik</option><option>Rusak</option><option>Basi</option><option>Kedaluwarsa</option></select></label><label className="full">Catatan<input value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})} placeholder="Lokasi rak / alasan waste"/></label></div><button className="primary" type="submit">Simpan batch</button></form>}

    <div className="status-filter-row batch-filter">{(["Semua","Aman","≤30 hari","≤14 hari","≤7 hari","Kedaluwarsa"] as const).map((x)=><button key={x} className={filter===x?"active":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>

    <article className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>FEFO</th><th>Barang</th><th>No. batch</th><th>Qty</th><th>Produksi</th><th>Kedaluwarsa</th><th>Sisa hari</th><th>Status</th><th>Kondisi</th><th>Catatan</th></tr></thead><tbody>{visible.map((r,index)=>{const s=statusFor(r.expiryDate);const d=daysToExpiry(r.expiryDate);return <tr key={r.id}><td><b>#{index+1}</b></td><td><strong>{r.itemName}</strong><small className="table-meta">{r.supplier}</small></td><td>{r.batchNo}</td><td>{r.qty} {r.unit}</td><td>{r.productionDate}</td><td>{r.expiryDate}</td><td>{d<0?`${Math.abs(d)} hari lewat`:`${d} hari`}</td><td><span className={`expiry-pill expiry-${s.replace(/[^0-9A-Za-z]/g,"").toLowerCase()}`}>{s}</span></td><td>{r.condition === "Baik" ? <span className="condition-ok"><CheckCircle2 size={14}/> Baik</span> : <span className="condition-bad"><AlertTriangle size={14}/> {r.condition}</span>}</td><td>{r.note || "—"}</td></tr>})}</tbody></table></div></article>
  </div>;
}
