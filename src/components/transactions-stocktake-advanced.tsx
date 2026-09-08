"use client";

import { FileDown, Pencil, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/data/inventory";
import type { StockTransaction } from "@/components/management-views";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

type Props = {
  items: Item[];
  records: StockTransaction[];
  onRecord: (record: StockTransaction) => string | null;
  onUpdate: (previous: StockTransaction, next: StockTransaction) => string | null;
  onDelete: (record: StockTransaction) => string | null;
};

export function TransactionsAdvanced({ items, records, onRecord, onUpdate, onDelete }: Props) {
  const [type, setType] = useState<"all" | "in" | "out">("all");
  const [itemId, setItemId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"in" | "out">("in");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ itemId: items[0]?.id ?? "", qty: "", date: new Date().toISOString().slice(0,10), party: "", note: "", user: "Dimas Riyanto", inputUnit: "base", purchaseUnit: "Karton", conversionFactor: "1", batchNo: "", productionDate: "", expiryDate: "" });
  const selected = items.find((item) => item.id === form.itemId);

  const filtered = useMemo(() => records.filter((record) => {
    if (type !== "all" && record.type !== type) return false;
    if (itemId !== "all" && record.itemId !== itemId) return false;
    if (from && record.date < from) return false;
    if (to && record.date > to) return false;
    return `${record.item} ${record.id} ${record.party} ${record.note} ${(record as StockTransaction & { user?: string }).user ?? ""}`.toLowerCase().includes(query.toLowerCase());
  }), [records, type, itemId, from, to, query]);

  function submit(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return;
    const enteredQty = Number(form.qty);
    const factor = form.inputUnit === "purchase" ? Number(form.conversionFactor) : 1;
    const qty = enteredQty * factor;
    if (!Number.isFinite(qty) || qty <= 0) { setMessage("Jumlah atau faktor konversi tidak valid."); return; }
    const record: StockTransaction = { id: `${mode === "in" ? "GRN" : "ISS"}-${Date.now().toString().slice(-8)}`, date: form.date, itemId: selected.id, item: selected.name, type: mode, qty, unit: selected.unit, party: form.party || (mode === "in" ? selected.supplier : "Operasional"), note: form.note || "Tanpa catatan", user: form.user, enteredQty, enteredUnit: form.inputUnit === "purchase" ? form.purchaseUnit : selected.unit, conversionFactor: factor, batchNo: mode === "in" ? form.batchNo : undefined, productionDate: mode === "in" ? form.productionDate : undefined, expiryDate: mode === "in" ? form.expiryDate : undefined };
    const error = onRecord(record); if (error) { setMessage(error); return; }
    setMessage(`Transaksi berhasil disimpan (${qty} ${selected.unit}).`); setForm((current) => ({ ...current, qty: "", party: "", note: "", batchNo: "", productionDate: "", expiryDate: "" }));
  }

  function remove(id: string) {
    const record = records.find((entry) => entry.id === id);
    if (!record || !window.confirm("Hapus transaksi ini? Perubahan stok dari transaksi juga akan dibatalkan.")) return;
    const error = onDelete(record);
    if (error) window.alert(error);
  }

  function edit(record: StockTransaction) {
    const qtyText = window.prompt("Ubah jumlah transaksi:", String(record.qty)); if (qtyText === null) return;
    const note = window.prompt("Ubah keterangan:", record.note); if (note === null) return;
    const qty = Number(qtyText); if (!Number.isFinite(qty) || qty <= 0) return;
    const error = onUpdate(record, { ...record, qty, note, enteredQty: qty, enteredUnit: record.unit, conversionFactor: 1 });
    if (error) window.alert(error);
  }

  return <div className="page-content">
    <section className="page-heading"><div><h2>Transaksi stok</h2><p>Pencatatan masuk/keluar lengkap dengan pengguna, filter, edit, hapus, dan export.</p></div><button className="secondary" onClick={() => downloadCsv("transaksi-stockflow.csv", [["Tanggal","ID","Barang","Jenis","Jumlah","Satuan","Pihak","Pengguna","Catatan"], ...filtered.map((r) => [r.date,r.id,r.item,r.type === "in" ? "Masuk" : "Keluar",r.qty,r.unit,r.party,(r as StockTransaction & {user?:string}).user ?? "Administrator",r.note])])}><FileDown size={16}/> Export CSV</button></section>
    <section className="transaction-tabs"><button className={mode === "in" ? "active" : ""} onClick={() => setMode("in")}>Barang masuk</button><button className={mode === "out" ? "active" : ""} onClick={() => setMode("out")}>Barang keluar</button></section>
    <section className="transaction-workspace"><form className="panel entry-form" onSubmit={submit}><div className="section-title"><div><h3>Transaksi baru</h3><p>Semua data tetap disimpan lokal untuk mode percobaan.</p></div></div><div className="form-grid">
      <label>Tanggal<input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/></label>
      <label>Barang<select value={form.itemId} onChange={(e)=>setForm({...form,itemId:e.target.value})}>{items.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Jumlah<input type="number" min="0.01" step="0.01" required value={form.qty} onChange={(e)=>setForm({...form,qty:e.target.value})}/></label>
      <label>Satuan input<select value={form.inputUnit} onChange={(e)=>setForm({...form,inputUnit:e.target.value})}><option value="base">{selected?.unit ?? "Satuan dasar"}</option><option value="purchase">Kemasan pembelian</option></select></label>
      {form.inputUnit === "purchase" && <><label>Nama satuan pembelian<input required value={form.purchaseUnit} onChange={(e)=>setForm({...form,purchaseUnit:e.target.value})} placeholder="Karton / Dus / Sak"/></label><label>Isi per {form.purchaseUnit || "kemasan"}<input type="number" min="0.01" step="0.01" required value={form.conversionFactor} onChange={(e)=>setForm({...form,conversionFactor:e.target.value})}/><small className="field-hint">1 {form.purchaseUnit || "kemasan"} = {form.conversionFactor || "0"} {selected?.unit}</small></label></>}
      <label>Supplier / Divisi<input value={form.party} onChange={(e)=>setForm({...form,party:e.target.value})}/></label>
      <label>Pengguna<input value={form.user} onChange={(e)=>setForm({...form,user:e.target.value})}/></label>
      <label className="full">Keterangan<input value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})}/></label>
      {mode === "in" && <><label>No. batch<input required value={form.batchNo} onChange={(e)=>setForm({...form,batchNo:e.target.value})} placeholder="Contoh: FM-260908-A"/></label><label>Tanggal produksi<input required type="date" value={form.productionDate} onChange={(e)=>setForm({...form,productionDate:e.target.value})}/></label><label>Tanggal kedaluwarsa<input required type="date" min={form.productionDate || undefined} value={form.expiryDate} onChange={(e)=>setForm({...form,expiryDate:e.target.value})}/></label></>}
    </div>{message && <div className="form-message success">{message}</div>}<button className="primary"><Save size={16}/> Simpan transaksi</button></form>
      <article className="panel transaction-insight"><small>Stok saat ini</small><strong>{selected?.stock ?? 0} {selected?.unit}</strong><p>Minimum: {selected?.minimum ?? 0} {selected?.unit}</p><p>Supplier: {selected?.supplier ?? "-"}</p></article>
    </section>
    <article className="panel history-panel"><div className="transaction-filter-grid"><label className="search"><Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari transaksi…"/></label><select value={type} onChange={(e)=>setType(e.target.value as typeof type)}><option value="all">Semua jenis</option><option value="in">Barang masuk</option><option value="out">Barang keluar</option></select><select value={itemId} onChange={(e)=>setItemId(e.target.value)}><option value="all">Semua barang</option>{items.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="date" value={from} onChange={(e)=>setFrom(e.target.value)}/><input type="date" value={to} onChange={(e)=>setTo(e.target.value)}/></div>
      <div className="table-scroll"><table><thead><tr><th>Tanggal</th><th>Barang</th><th>Jenis</th><th>Jumlah</th><th>Batch / Expiry</th><th>Pihak</th><th>Pengguna</th><th>Catatan</th><th>Aksi</th></tr></thead><tbody>{filtered.map((record)=><tr key={record.id}><td>{record.date}</td><td><strong>{record.item}</strong><small className="table-meta">{record.id}</small></td><td>{record.type === "in" ? "Masuk" : "Keluar"}</td><td><b>{record.qty} {record.unit}</b>{record.enteredUnit && record.enteredUnit !== record.unit && <small className="table-meta">{record.enteredQty} {record.enteredUnit} × {record.conversionFactor}</small>}</td><td>{record.batchNo ? <><strong>{record.batchNo}</strong><small className="table-meta">Exp. {record.expiryDate}</small></> : "—"}</td><td>{record.party}</td><td>{record.user ?? "Administrator"}</td><td>{record.note}</td><td><div className="row-actions"><button type="button" aria-label={`Edit ${record.id}`} onClick={()=>edit(record)}><Pencil size={14}/></button><button type="button" aria-label={`Hapus ${record.id}`} onClick={()=>remove(record.id)}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>
    </article>
  </div>;
}

type OpnameRecord = { id: string; date: string; user: string; differences: number; reason: string };
export function StocktakeAdvanced({ items, onApply }: { items: Item[]; onApply: (counts: Record<string, number>) => void }) {
  const [counts, setCounts] = useState<Record<string, number>>(Object.fromEntries(items.map((item)=>[item.id,item.stock])));
  const [reasons, setReasons] = useState<Record<string,string>>({});
  const [history, setHistory] = useState<OpnameRecord[]>([]);
  useEffect(() => { const raw = localStorage.getItem("stockflow-opname-history-v2"); if (!raw) return; const frame = requestAnimationFrame(() => { try { setHistory(JSON.parse(raw)); } catch { setHistory([]); } }); return () => cancelAnimationFrame(frame); }, []);
  const differences = items.filter((item)=>Number(counts[item.id] ?? item.stock) !== item.stock);
  function save() {
    const missingReason = differences.find((item)=>!(reasons[item.id] || "").trim()); if (missingReason) { alert(`Isi alasan selisih untuk ${missingReason.name}.`); return; }
    onApply(counts); const entry = { id:`OPN-${Date.now().toString().slice(-8)}`, date:new Date().toISOString().slice(0,10), user:"Dimas Riyanto", differences:differences.length, reason:differences.map((item)=>`${item.name}: ${reasons[item.id]}`).join(" | ") || "Tidak ada selisih"};
    const next=[entry,...history]; setHistory(next); localStorage.setItem("stockflow-opname-history-v2",JSON.stringify(next)); alert("Stock opname tersimpan.");
  }
  return <div className="page-content"><section className="page-heading"><div><h2>Stock opname</h2><p>Setiap selisih wajib memiliki alasan dan akan masuk ke histori opname.</p></div><div className="button-row"><button className="secondary" onClick={()=>window.print()}><FileDown size={16}/> Cetak PDF</button><button className="primary" onClick={save}><Save size={16}/> Simpan opname</button></div></section>
    <section className="opname-summary"><div><span>Item diperiksa</span><strong>{items.length}</strong></div><div><span>Ada selisih</span><strong>{differences.length}</strong></div><div><span>Histori opname</span><strong>{history.length}</strong></div></section>
    <article className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Barang</th><th>Stok sistem</th><th>Stok fisik</th><th>Selisih</th><th>Alasan selisih</th></tr></thead><tbody>{items.map((item)=>{const physical=Number(counts[item.id] ?? item.stock);const diff=physical-item.stock;return <tr key={item.id}><td><strong>{item.name}</strong><small className="table-meta">{item.sku}</small></td><td>{item.stock} {item.unit}</td><td><input className="count-input" type="number" min="0" value={physical} onChange={(e)=>setCounts({...counts,[item.id]:Number(e.target.value)})}/></td><td className={diff===0?"neutral":diff>0?"positive":"negative"}>{diff>0?"+":""}{diff}</td><td>{diff===0?"—":<input className="reason-input" placeholder="Contoh: rusak, salah hitung, pemakaian belum tercatat" value={reasons[item.id] || ""} onChange={(e)=>setReasons({...reasons,[item.id]:e.target.value})}/>}</td></tr>})}</tbody></table></div></article>
    <article className="panel history-panel"><div className="section-title"><div><h3>Riwayat stock opname</h3><p>Histori lokal selama masa percobaan.</p></div></div><div className="table-scroll"><table><thead><tr><th>Tanggal</th><th>ID</th><th>Pengguna</th><th>Jumlah selisih</th><th>Ringkasan alasan</th></tr></thead><tbody>{history.map((entry)=><tr key={entry.id}><td>{entry.date}</td><td>{entry.id}</td><td>{entry.user}</td><td>{entry.differences}</td><td>{entry.reason}</td></tr>)}</tbody></table></div></article>
  </div>;
}
