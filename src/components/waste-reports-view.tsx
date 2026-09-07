"use client";

import { BarChart3, CircleAlert, FileDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/data/inventory";
import { getStockHealth } from "@/components/management-views";

type WasteReason = "Rusak" | "Basi" | "Kedaluwarsa" | "Tumpah" | "Lainnya";
type WasteRecord = { id:string; date:string; itemId:string; item:string; qty:number; unit:string; reason:WasteReason; unitCost:number; total:number; note:string; user:string };

const money = new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 });
const seed: WasteRecord[] = [
  { id:"WST-001", date:"2026-09-04", itemId:"1", item:"Fresh Milk Pasteurisasi 1 L", qty:2, unit:"Kotak", reason:"Kedaluwarsa", unitCost:21000, total:42000, note:"Sisa batch chiller", user:"Dimas Riyanto" },
  { id:"WST-002", date:"2026-09-05", itemId:"31", item:"Selada Romaine", qty:1, unit:"Kg", reason:"Basi", unitCost:36000, total:36000, note:"Kualitas turun", user:"Warehouse Staff" },
];

function downloadCsv(name:string, rows:string[][]) {
  const csv = rows.map((row)=>row.map((cell)=>`"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}

export default function WasteReportsView({ items }: { items: Item[] }) {
  const [records, setRecords] = useState<WasteRecord[]>(seed);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date:"2026-09-07", itemId:items[0]?.id ?? "", qty:"", reason:"Rusak" as WasteReason, note:"", user:"Dimas Riyanto" });

  useEffect(()=>{ const raw=localStorage.getItem("stockflow-waste-v1"); if(raw) setRecords(JSON.parse(raw)); },[]);
  useEffect(()=>{ localStorage.setItem("stockflow-waste-v1", JSON.stringify(records)); },[records]);

  const selected = items.find((item)=>item.id===form.itemId) ?? items[0];
  const totalLoss = records.reduce((sum,row)=>sum+row.total,0);
  const restock = items.filter((item)=>getStockHealth(item).label!=="Aman").sort((a,b)=>getStockHealth(b).restock-getStockHealth(a).restock);
  const fast = items.slice().sort((a,b)=>(a.stock/a.minimum)-(b.stock/b.minimum)).slice(0,6);
  const slow = items.slice().sort((a,b)=>(b.stock/b.minimum)-(a.stock/a.minimum)).slice(0,6);
  const supplierPerf = useMemo(()=>Array.from(new Set(items.map((i)=>i.supplier))).slice(0,8).map((supplier)=>({ supplier, items:items.filter((i)=>i.supplier===supplier).length, attention:items.filter((i)=>i.supplier===supplier && getStockHealth(i).label!=="Aman").length })),[items]);

  function add(event:React.FormEvent){ event.preventDefault(); if(!selected) return; const qty=Number(form.qty); const row:WasteRecord={ id:`WST-${Date.now().toString().slice(-6)}`, date:form.date, itemId:selected.id, item:selected.name, qty, unit:selected.unit, reason:form.reason, unitCost:selected.price, total:qty*selected.price, note:form.note || "-", user:form.user }; setRecords((cur)=>[row,...cur]); setShow(false); setForm((cur)=>({...cur,qty:"",note:""})); }

  return <div className="page-content waste-view">
    <section className="page-heading"><div><h2>Waste & laporan manajemen</h2><p>Catat kerugian, pantau restock, penggunaan, dan performa supplier.</p></div><div className="button-row"><button className="secondary" onClick={()=>window.print()}><FileDown size={17}/> Cetak PDF</button><button className="primary" onClick={()=>setShow(true)}><Plus size={17}/> Catat waste</button></div></section>
    <section className="management-stats"><div><CircleAlert/><span><small>Total kerugian waste</small><strong>{money.format(totalLoss)}</strong></span></div><div><BarChart3/><span><small>Item perlu restock</small><strong>{restock.length}</strong></span></div><div><BarChart3/><span><small>Supplier dipantau</small><strong>{supplierPerf.length}</strong></span></div></section>
    <section className="report-grid final-report-grid">
      <article className="panel report-summary"><div className="section-title"><div><h3>Barang paling cepat habis</h3><p>Prioritas berdasarkan rasio stok/minimum.</p></div></div>{fast.map((item)=><div className="report-list-row" key={item.id}><span>{item.name}<small>{item.sku}</small></span><b>{item.stock} {item.unit}</b></div>)}</article>
      <article className="panel report-summary"><div className="section-title"><div><h3>Barang jarang digunakan</h3><p>Rasio stok terhadap minimum tertinggi.</p></div></div>{slow.map((item)=><div className="report-list-row" key={item.id}><span>{item.name}<small>{item.sku}</small></span><b>{item.stock} {item.unit}</b></div>)}</article>
    </section>
    <article className="panel history-panel"><div className="section-title"><div><h3>Laporan kebutuhan restock</h3><p>Rekomendasi pemesanan berdasarkan stok minimum.</p></div><button className="secondary" onClick={()=>downloadCsv("restock-report.csv", [["SKU","Barang","Supplier","Stok","Minimum","Rekomendasi"],...restock.map((i)=>[i.sku,i.name,i.supplier,String(i.stock),String(i.minimum),String(getStockHealth(i).restock)])])}>Export CSV</button></div><div className="table-scroll"><table><thead><tr><th>Barang</th><th>Supplier</th><th>Status</th><th>Stok</th><th>Minimum</th><th>Saran</th></tr></thead><tbody>{restock.slice(0,20).map((i)=>{const h=getStockHealth(i);return <tr key={i.id}><td><strong>{i.name}</strong><small className="table-meta">{i.sku}</small></td><td>{i.supplier}</td><td><span className={`status ${h.tone}`}>{h.label}</span></td><td>{i.stock} {i.unit}</td><td>{i.minimum} {i.unit}</td><td><b>{h.restock} {i.unit}</b></td></tr>})}</tbody></table></div></article>
    <article className="panel history-panel"><div className="section-title"><div><h3>Performa supplier</h3><p>Jumlah item dipasok dan item yang sedang perlu perhatian.</p></div></div><div className="table-scroll"><table><thead><tr><th>Supplier</th><th>Jumlah item</th><th>Perlu perhatian</th><th>Skor demo</th></tr></thead><tbody>{supplierPerf.map((s)=><tr key={s.supplier}><td><strong>{s.supplier}</strong></td><td>{s.items}</td><td>{s.attention}</td><td><b>{Math.max(70,100-s.attention*6)}%</b></td></tr>)}</tbody></table></div></article>
    <article className="panel history-panel"><div className="section-title"><div><h3>Riwayat waste</h3><p>Kerugian akibat rusak, basi, kedaluwarsa, atau tumpah.</p></div><button className="secondary" onClick={()=>downloadCsv("waste-report.csv", [["Tanggal","Barang","Qty","Satuan","Alasan","Nilai","User","Catatan"],...records.map((r)=>[r.date,r.item,String(r.qty),r.unit,r.reason,String(r.total),r.user,r.note])])}>Export CSV</button></div><div className="table-scroll"><table><thead><tr><th>Tanggal</th><th>Barang</th><th>Alasan</th><th>Jumlah</th><th>Kerugian</th><th>User</th><th>Catatan</th><th>Aksi</th></tr></thead><tbody>{records.map((r)=><tr key={r.id}><td>{r.date}</td><td><strong>{r.item}</strong><small className="table-meta">{r.id}</small></td><td>{r.reason}</td><td>{r.qty} {r.unit}</td><td><b>{money.format(r.total)}</b></td><td>{r.user}</td><td>{r.note}</td><td><button className="table-action danger" onClick={()=>{if(confirm("Hapus catatan waste ini?"))setRecords((cur)=>cur.filter((x)=>x.id!==r.id));}}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div></article>
    <section className="company-print-identity"><strong>StockFlow Inventory OS</strong><span>Central Kitchen & Storage — Monjok</span><small>Laporan internal persediaan • dicetak dari StockFlow</small></section>
    {show && <div className="modal-backdrop" onMouseDown={()=>setShow(false)}><form className="modal" onSubmit={add} onMouseDown={(e)=>e.stopPropagation()}><div className="modal-head"><div><h2>Catat waste</h2><p>Nilai kerugian dihitung otomatis dari harga item.</p></div><button type="button" onClick={()=>setShow(false)}>×</button></div><div className="form-grid"><label>Tanggal<input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/></label><label>Barang<select value={form.itemId} onChange={(e)=>setForm({...form,itemId:e.target.value})}>{items.map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>Jumlah<input required type="number" min="0.01" step="0.01" value={form.qty} onChange={(e)=>setForm({...form,qty:e.target.value})}/></label><label>Alasan<select value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value as WasteReason})}><option>Rusak</option><option>Basi</option><option>Kedaluwarsa</option><option>Tumpah</option><option>Lainnya</option></select></label><label>User<input value={form.user} onChange={(e)=>setForm({...form,user:e.target.value})}/></label><label>Estimasi kerugian<input disabled value={money.format(Number(form.qty||0)*(selected?.price||0))}/></label><label className="full">Catatan<input value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShow(false)}>Batal</button><button className="primary" type="submit">Simpan waste</button></div></form></div>}
  </div>;
}
