"use client";

import {
  ArrowDownToLine, ArrowUpFromLine, Building2, CheckCircle2, CircleAlert,
  CalendarClock, ChevronLeft, ChevronRight, FileDown, Grid2X2, List,
  Package, Plus, Save, Search, ShieldCheck, Trash2, UserRound, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/data/inventory";

export type StockHealth = "Aman" | "Mau habis" | "Perlu restock" | "Habis";

export function getStockHealth(item: Item): { label: StockHealth; tone: string; restock: number; percentage: number } {
  const target = Math.max(item.minimum * 2, 1);
  const percentage = Math.min(100, Math.round((item.stock / target) * 100));
  if (item.stock === 0) return { label: "Habis", tone: "out", restock: target, percentage: 0 };
  if (item.stock <= item.minimum) return { label: "Perlu restock", tone: "restock", restock: target - item.stock, percentage };
  if (item.stock <= item.minimum * 1.5) return { label: "Mau habis", tone: "low", restock: target - item.stock, percentage };
  return { label: "Aman", tone: "safe", restock: 0, percentage };
}

export type StockTransaction = {
  id: string;
  date: string;
  itemId: string;
  item: string;
  type: "in" | "out";
  qty: number;
  unit: string;
  party: string;
  note: string;
  user: string;
};

export const seedStockTransactions: StockTransaction[] = [
  { id: "GRN-2026-00184", date: "2026-09-05", itemId: "1", item: "Fresh Milk Pasteurisasi 1 L", type: "in", qty: 24, unit: "Kotak", party: "Greenfields", note: "Penerimaan rutin", user: "Dimas Riyanto" },
  { id: "ISS-2026-00091", date: "2026-09-05", itemId: "16", item: "Biji Kopi House Blend Arabika/Robusta 70:30", type: "out", qty: 6, unit: "Kg", party: "Beverage Bar", note: "Kebutuhan operasional", user: "Fajar Akbar" },
  { id: "GRN-2026-00183", date: "2026-09-04", itemId: "114", item: "Plastic Cup PET 16 oz + Lid", type: "in", qty: 8, unit: "Pack", party: "Kyodo", note: "Restock kemasan", user: "Rani Putri" },
];

export function StockNeedsPanel({ items, onSelect }: { items: Item[]; onSelect: (item: Item) => void }) {
  const priority = useMemo(() => items
    .map((item) => ({ item, health: getStockHealth(item) }))
    .filter(({ health }) => health.label !== "Aman")
    .sort((a, b) => a.item.stock - b.item.stock), [items]);
  const counts = useMemo(() => items.reduce<Record<StockHealth, number>>((result, item) => {
    result[getStockHealth(item).label] += 1;
    return result;
  }, { Aman: 0, "Mau habis": 0, "Perlu restock": 0, Habis: 0 }), [items]);

  return <>
    <div className="health-summary">
      <div><span className="health-dot safe"/><b>{counts.Aman}</b><small>Aman</small></div>
      <div><span className="health-dot low"/><b>{counts["Mau habis"]}</b><small>Mau habis</small></div>
      <div><span className="health-dot restock"/><b>{counts["Perlu restock"]}</b><small>Restock</small></div>
      <div><span className="health-dot out"/><b>{counts.Habis}</b><small>Habis</small></div>
    </div>
    <div className="needs-list">
      {priority.slice(0, 5).map(({ item, health }) => <button key={item.id} onClick={() => onSelect(item)}>
        <span className="product-icon"><Package size={17}/></span>
        <span><strong>{item.name}</strong><small>{item.stock} {item.unit} · minimum {item.minimum}</small></span>
        <span className={`status ${health.tone}`}>{health.label}</span>
      </button>)}
    </div>
  </>;
}

export function InventoryCatalogView({ items, query, setQuery, onAdd, onSelect }: { items: Item[]; query: string; setQuery: (value: string) => void; onAdd: () => void; onSelect: (item: Item) => void }) {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [healthFilter, setHealthFilter] = useState("Semua");
  const [sort, setSort] = useState("priority");
  const [page, setPage] = useState(1);
  const perPage = view === "cards" ? 12 : 24;
  const filtered = useMemo(() => {
    const result = items.filter((item) => healthFilter === "Semua" || getStockHealth(item).label === healthFilter);
    return result.toSorted((a, b) => {
      if (sort === "lowest") return a.stock - b.stock;
      if (sort === "highest") return b.stock - a.stock;
      if (sort === "name") return a.name.localeCompare(b.name, "id");
      return getStockPriority(getStockHealth(a).label) - getStockPriority(getStockHealth(b).label) || a.stock - b.stock;
    });
  }, [healthFilter, items, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * perPage, Math.min(page, totalPages) * perPage);
  function chooseFilter(value: string) { setHealthFilter(value); setPage(1); }

  return <div className="page-content"><section className="page-heading"><div><h2>Katalog persediaan F&amp;B</h2><p>Pantau kondisi dan kebutuhan setiap item secara visual.</p></div><button className="primary" onClick={onAdd}><Plus size={18}/> Tambah barang</button></section>
    <article className="inventory-controls panel"><label className="search wide"><Search size={17}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari barang, SKU, kategori, atau supplier…"/></label><div className="view-switch"><button className={view === "cards" ? "active" : ""} onClick={() => { setView("cards"); setPage(1); }} aria-label="Tampilan kartu"><Grid2X2/></button><button className={view === "table" ? "active" : ""} onClick={() => { setView("table"); setPage(1); }} aria-label="Tampilan tabel"><List/></button></div><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="priority">Prioritas restock</option><option value="lowest">Stok terendah</option><option value="highest">Stok tertinggi</option><option value="name">Nama A–Z</option></select><button className="secondary" onClick={() => exportInventory(filtered)}><FileDown size={17}/> Export CSV</button></article>
    <div className="filter-pills">{["Semua", "Aman", "Mau habis", "Perlu restock", "Habis"].map((label) => <button key={label} className={healthFilter === label ? "active" : ""} onClick={() => chooseFilter(label)}>{label}<b>{label === "Semua" ? items.length : items.filter((item) => getStockHealth(item).label === label).length}</b></button>)}</div>
    {view === "cards" ? <section className="stock-card-grid">{visible.map((item) => <StockCard key={item.id} item={item} onSelect={onSelect}/>)}</section> : <InventoryTable items={visible} onSelect={onSelect}/>}
    {!visible.length && <div className="empty-state"><Package/><h3>Barang tidak ditemukan</h3><p>Ubah pencarian atau filter status stok.</p></div>}
    <div className="pagination"><span>Menampilkan {visible.length} dari {filtered.length} item</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft/></button><b>{Math.min(page, totalPages)} / {totalPages}</b><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight/></button></div></div>
  </div>;
}

function StockCard({ item, onSelect }: { item: Item; onSelect: (item: Item) => void }) {
  const health = getStockHealth(item);
  const days = item.dailyUsage > 0 ? Math.floor(item.stock / item.dailyUsage) : 0;
  return <button className={`stock-card ${health.tone}`} onClick={() => onSelect(item)}><div className="stock-card-top"><span className={`category-pill ${health.tone}`}>{item.category}</span><small>{item.sku}</small></div><h3>{item.name}</h3><div className="stock-total"><small>Total stok</small><div><strong>{item.stock.toLocaleString("id-ID")}</strong><span>{item.unit}</span></div></div><div className="stock-card-meta"><span>Minimum <b>{item.minimum}</b></span><span><CalendarClock/> ±{days} hari</span></div><div className="stock-card-bottom"><span className={`status ${health.tone}`}>{health.label}</span><b>{health.restock ? `Restock ${health.restock}` : "Stok cukup"}</b></div><div className="stock-card-supplier">{item.supplier}</div></button>;
}

function InventoryTable({ items, onSelect }: { items: Item[]; onSelect: (item: Item) => void }) { return <article className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Barang</th><th>Kelompok &amp; kategori</th><th>Supplier</th><th>Lokasi</th><th>Stok</th><th>Estimasi bertahan</th><th>Harga estimasi</th><th>Kebutuhan</th><th>Saran restock</th><th>Aksi</th></tr></thead><tbody>{items.map((item) => { const health = getStockHealth(item); const days = item.dailyUsage > 0 ? Math.floor(item.stock / item.dailyUsage) : 0; return <tr key={item.id}><td><div className="item-name"><span><Package size={17}/></span><div><strong>{item.name}</strong><small>{item.sku}</small></div></div></td><td><div className="category-cell"><strong>{item.group}</strong><small>{item.category}</small></div></td><td>{item.supplier}</td><td>{item.warehouse}</td><td><b>{item.stock}</b> {item.unit}</td><td>±{days} hari</td><td>{formatMoney(item.price)}</td><td><span className={`status ${health.tone}`}>{health.label}</span></td><td>{health.restock ? <b>{health.restock} {item.unit}</b> : "—"}</td><td><button className="table-action" onClick={() => onSelect(item)}>Detail</button></td></tr>; })}</tbody></table></div></article>; }

export function TransactionsView({ items, records, onRecord, onDelete }: { items: Item[]; records: StockTransaction[]; onRecord: (record: StockTransaction) => string | null; onDelete: (record: StockTransaction) => void }) {
  const [mode, setMode] = useState<"in" | "out">("in");
  const [message, setMessage] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "in" | "out">("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [form, setForm] = useState({ itemId: items[0]?.id ?? "", qty: "", date: "2026-09-09", party: "", note: "", entryUnit: "base" });
  const selected = items.find((item) => item.id === form.itemId);
  const visibleRecords = records.filter((record) => (historyFilter === "all" || record.type === historyFilter) && `${record.item} ${record.id} ${record.party} ${record.user}`.toLowerCase().includes(historyQuery.toLowerCase()));
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const qty = Number(form.qty) * (form.entryUnit === "purchase" ? selected.conversionFactor : 1);
    const record: StockTransaction = {
      id: `${mode === "in" ? "GRN" : "ISS"}-${Date.now().toString().slice(-8)}`,
      date: form.date, itemId: selected.id, item: selected.name, type: mode, qty, unit: selected.unit,
      party: form.party || (mode === "in" ? selected.supplier : "Operasional"), note: form.note || "Tanpa catatan", user: "Dimas Riyanto",
    };
    const error = onRecord(record);
    if (error) { setMessage(error); return; }
    setMessage(`${mode === "in" ? "Barang masuk" : "Barang keluar"} berhasil dicatat.`);
    setForm((current) => ({ ...current, qty: "", party: "", note: "" }));
  }

  return <div className="page-content">
    <section className="page-heading"><div><h2>Barang masuk &amp; keluar</h2><p>Catat setiap pergerakan dan stok akan diperbarui otomatis.</p></div><button className="secondary" onClick={() => exportTransactions(records)}><FileDown size={17}/> Export CSV</button></section>
    <div className="transaction-tabs"><button className={mode === "in" ? "active" : ""} onClick={() => { setMode("in"); setMessage(""); }}><ArrowDownToLine/> Barang masuk</button><button className={mode === "out" ? "active" : ""} onClick={() => { setMode("out"); setMessage(""); }}><ArrowUpFromLine/> Barang keluar</button></div>
    <section className="transaction-workspace">
      <form className="panel entry-form" onSubmit={submit}>
        <div className="section-title"><div><h3>Form {mode === "in" ? "penerimaan" : "pengeluaran"}</h3><p>{mode === "in" ? "Tambahkan stok dari supplier." : "Kurangi stok untuk kebutuhan operasional."}</p></div></div>
        <div className="form-grid">
          <label>Tanggal<input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required/></label>
          <label>Nama barang<select value={form.itemId} onChange={(e) => update("itemId", e.target.value)}>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Jumlah<input type="number" min="1" value={form.qty} onChange={(e) => update("qty", e.target.value)} required/></label>
          <label>Satuan transaksi<select value={form.entryUnit} onChange={(e) => update("entryUnit", e.target.value)}><option value="base">{selected?.unit ?? "Satuan stok"}</option><option value="purchase">{selected?.purchaseUnit ?? "Satuan pembelian"}</option></select></label>
          <label>{mode === "in" ? "Supplier" : "Pengambil / Divisi"}<input value={form.party} onChange={(e) => update("party", e.target.value)} placeholder={mode === "in" ? selected?.supplier : "Contoh: Kitchen"}/></label>
          <label>Keterangan<input value={form.note} onChange={(e) => update("note", e.target.value)} placeholder="Catatan transaksi"/></label>
        </div>
        {message && <div className={message.includes("berhasil") ? "form-message success" : "form-message error"}>{message}</div>}
        <button className="primary" type="submit"><Save size={16}/> Simpan transaksi</button>
      </form>
      <article className="panel transaction-insight"><span className={`big-transaction-icon ${mode}`} >{mode === "in" ? <ArrowDownToLine/> : <ArrowUpFromLine/>}</span><small>Stok saat ini</small><strong>{selected?.stock ?? 0} {selected?.unit}</strong><p>1 {selected?.purchaseUnit} = {selected?.conversionFactor} {selected?.unit}</p>{selected && <span className={`status ${getStockHealth(selected).tone}`}>{getStockHealth(selected).label}</span>}</article>
    </section>
    <article className="panel history-panel"><div className="section-title"><div><h3>Riwayat transaksi</h3><p>Penerimaan dan pengeluaran terbaru.</p></div><b>{visibleRecords.length} transaksi</b></div><div className="history-filters"><label className="search wide"><Search size={16}/><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Cari transaksi…"/></label><select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value as "all" | "in" | "out")}><option value="all">Semua jenis</option><option value="in">Barang masuk</option><option value="out">Barang keluar</option></select></div><div className="table-scroll"><table><thead><tr><th>Tanggal</th><th>Barang</th><th>Jenis</th><th>Jumlah</th><th>Supplier / Pengambil</th><th>Pengguna</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={record.id}><td>{formatDate(record.date)}</td><td><strong>{record.item}</strong><small className="table-meta">{record.id}</small></td><td><span className={`status ${record.type === "in" ? "safe" : "low"}`}>{record.type === "in" ? "Masuk" : "Keluar"}</span></td><td><b>{record.type === "in" ? "+" : "−"}{record.qty}</b> {record.unit}</td><td>{record.party}</td><td>{record.user || "Dimas Riyanto"}</td><td>{record.note}</td><td><button className="table-action danger" aria-label={`Hapus ${record.id}`} onClick={() => { if (window.confirm(`Hapus transaksi ${record.id}? Stok akan dikembalikan.`)) onDelete(record); }}><Trash2/></button></td></tr>)}</tbody></table></div></article>
  </div>;
}

export function StocktakeView({ items, onApply }: { items: Item[]; onApply: (counts: Record<string, number>) => void }) {
  const initialCounts = () => Object.fromEntries(items.map((item) => [item.id, item.stock]));
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [saved, setSaved] = useState(false);
  const differences = items.filter((item) => Number(counts[item.id]) !== item.stock).length;
  function save() { onApply(counts); setSaved(true); }
  return <div className="page-content"><section className="page-heading"><div><h2>Stock opname</h2><p>Bandingkan stok sistem dengan jumlah fisik setiap item.</p></div><div className="button-row"><button className="secondary" onClick={() => window.print()}><FileDown size={17}/> Cetak PDF</button><button className="primary" onClick={save}><Save size={17}/> Simpan opname</button></div></section>
    <section className="opname-summary"><div><span>Item diperiksa</span><strong>{items.length}</strong></div><div><span>Ada selisih</span><strong>{differences}</strong></div><div><span>Waktu pencatatan</span><strong>Hari ini</strong></div></section>
    {saved && <div className="save-banner"><CheckCircle2/> Hasil stock opname berhasil disimpan.</div>}
    <article className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Barang</th><th>Lokasi</th><th>Stok sistem</th><th>Stok fisik</th><th>Selisih</th><th>Status kebutuhan</th></tr></thead><tbody>{items.map((item) => { const physical = Number(counts[item.id] ?? item.stock); const difference = physical - item.stock; const health = getStockHealth({ ...item, stock: physical }); return <tr key={item.id}><td><div className="item-name"><span><Package size={17}/></span><div><strong>{item.name}</strong><small>{item.sku}</small></div></div></td><td>{item.warehouse}</td><td>{item.stock} {item.unit}</td><td><input className="count-input" type="number" min="0" value={physical} onChange={(e) => { setSaved(false); setCounts((current) => ({ ...current, [item.id]: Number(e.target.value) })); }}/></td><td className={difference === 0 ? "neutral" : difference > 0 ? "positive" : "negative"}>{difference > 0 ? "+" : ""}{difference}</td><td><span className={`status ${health.tone}`}>{health.label}</span></td></tr>; })}</tbody></table></div></article>
  </div>;
}

type Supplier = { id: string; name: string; category: string; contact: string; phone: string; leadTime: string; status: "Aktif" | "Evaluasi" };
const seedSuppliers: Supplier[] = [
  { id: "SUP-001", name: "IndoGuna Utama", category: "Meat, dairy & imported food", contact: "Sales HORECA", phone: "+62 21 7593 4000", leadTime: "2–3 hari", status: "Aktif" },
  { id: "SUP-002", name: "Classic Fine Foods Indonesia", category: "Premium food ingredients", contact: "Account Executive", phone: "+62 21 7590 8080", leadTime: "2–4 hari", status: "Aktif" },
  { id: "SUP-003", name: "Toffin Indonesia", category: "Beverage & cafe supplies", contact: "B2B Sales", phone: "+62 21 2940 5060", leadTime: "1–3 hari", status: "Aktif" },
  { id: "SUP-004", name: "Lotte Grosir", category: "General wholesale", contact: "Business Center", phone: "+62 21 840 4080", leadTime: "1–2 hari", status: "Aktif" },
  { id: "SUP-005", name: "Supplier Produce Lokal", category: "Sayuran & buah segar", contact: "Koordinator Pasar", phone: "+62 812 0000 1122", leadTime: "Harian", status: "Evaluasi" },
];

export function SuppliersView() {
  const [suppliers, setSuppliers] = useStoredList("stockflow-suppliers-v1", seedSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", contact: "", phone: "", leadTime: "" });
  function submit(event: React.FormEvent) { event.preventDefault(); setSuppliers((current) => [...current, { ...form, id: `SUP-${String(current.length + 1).padStart(3, "0")}`, status: "Aktif" }]); setShowForm(false); setForm({ name: "", category: "", contact: "", phone: "", leadTime: "" }); }
  return <div className="page-content"><section className="page-heading"><div><h2>Supplier</h2><p>Kelola pemasok, kategori pasokan, kontak, dan estimasi pengiriman.</p></div><button className="primary" onClick={() => setShowForm(true)}><Plus size={17}/> Tambah supplier</button></section>
    <section className="management-stats"><div><Building2/><span><small>Total supplier</small><strong>{suppliers.length}</strong></span></div><div><CheckCircle2/><span><small>Supplier aktif</small><strong>{suppliers.filter((item) => item.status === "Aktif").length}</strong></span></div><div><CircleAlert/><span><small>Perlu evaluasi</small><strong>{suppliers.filter((item) => item.status === "Evaluasi").length}</strong></span></div></section>
    <article className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>ID</th><th>Supplier</th><th>Kategori pasokan</th><th>Kontak</th><th>Telepon</th><th>Lead time</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.id}</td><td><strong>{supplier.name}</strong></td><td>{supplier.category}</td><td>{supplier.contact}</td><td>{supplier.phone}</td><td>{supplier.leadTime}</td><td><span className={`status ${supplier.status === "Aktif" ? "safe" : "low"}`}>{supplier.status}</span></td><td><button className="table-action danger" aria-label={`Hapus ${supplier.name}`} onClick={() => setSuppliers((current) => current.filter((item) => item.id !== supplier.id))}><Trash2/></button></td></tr>)}</tbody></table></div></article>
    {showForm && <SimpleModal title="Tambah supplier" subtitle="Masukkan data pemasok baru." onClose={() => setShowForm(false)}><form onSubmit={submit}><div className="form-grid"><TextField label="Nama supplier" value={form.name} onChange={(value) => setForm({ ...form, name: value })}/><TextField label="Kategori pasokan" value={form.category} onChange={(value) => setForm({ ...form, category: value })}/><TextField label="Nama kontak" value={form.contact} onChange={(value) => setForm({ ...form, contact: value })}/><TextField label="Nomor telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })}/><TextField label="Lead time" value={form.leadTime} onChange={(value) => setForm({ ...form, leadTime: value })}/></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Batal</button><button className="primary">Simpan supplier</button></div></form></SimpleModal>}
  </div>;
}

type AppUser = { id: string; name: string; email: string; role: string; location: string; status: "Aktif" | "Nonaktif" };
const seedUsers: AppUser[] = [
  { id: "USR-001", name: "Dimas Riyanto", email: "admin@stockflow.id", role: "Administrator", location: "Semua lokasi", status: "Aktif" },
  { id: "USR-002", name: "Rani Putri", email: "purchasing@stockflow.id", role: "Purchasing", location: "Central Kitchen", status: "Aktif" },
  { id: "USR-003", name: "Fajar Akbar", email: "warehouse@stockflow.id", role: "Warehouse Staff", location: "Dry Storage", status: "Aktif" },
  { id: "USR-004", name: "Ayu Lestari", email: "auditor@stockflow.id", role: "Viewer / Auditor", location: "Semua lokasi", status: "Nonaktif" },
];

export function UsersView() {
  const [users, setUsers] = useStoredList("stockflow-users-v1", seedUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Warehouse Staff", location: "Central Kitchen" });
  function submit(event: React.FormEvent) { event.preventDefault(); setUsers((current) => [...current, { ...form, id: `USR-${String(current.length + 1).padStart(3, "0")}`, status: "Aktif" }]); setShowForm(false); }
  return <div className="page-content"><section className="page-heading"><div><h2>Pengguna &amp; hak akses</h2><p>Atur siapa yang dapat mengelola, mencatat, atau hanya melihat stok.</p></div><button className="primary" onClick={() => setShowForm(true)}><Plus size={17}/> Tambah pengguna</button></section>
    <section className="role-cards"><article><ShieldCheck/><strong>Administrator</strong><p>Akses penuh ke data, pengguna, dan pengaturan.</p></article><article><ArrowDownToLine/><strong>Purchasing</strong><p>Kelola supplier dan penerimaan barang.</p></article><article><Package/><strong>Warehouse Staff</strong><p>Transaksi stok dan stock opname.</p></article><article><UserRound/><strong>Viewer</strong><p>Hanya melihat dashboard dan laporan.</p></article></section>
    <article className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Pengguna</th><th>Email</th><th>Peran</th><th>Lokasi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small className="table-meta">{user.id}</small></td><td>{user.email}</td><td>{user.role}</td><td>{user.location}</td><td><span className={`status ${user.status === "Aktif" ? "safe" : "out"}`}>{user.status}</span></td><td><button className="table-action" onClick={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: item.status === "Aktif" ? "Nonaktif" : "Aktif" } : item))}>{user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}</button></td></tr>)}</tbody></table></div></article>
    {showForm && <SimpleModal title="Tambah pengguna" subtitle="Buat profil dan tentukan hak akses." onClose={() => setShowForm(false)}><form onSubmit={submit}><div className="form-grid"><TextField label="Nama lengkap" value={form.name} onChange={(value) => setForm({ ...form, name: value })}/><TextField label="Email" value={form.email} type="email" onChange={(value) => setForm({ ...form, email: value })}/><label>Peran<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Administrator</option><option>Purchasing</option><option>Warehouse Staff</option><option>Viewer / Auditor</option></select></label><TextField label="Lokasi" value={form.location} onChange={(value) => setForm({ ...form, location: value })}/></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Batal</button><button className="primary">Simpan pengguna</button></div></form></SimpleModal>}
  </div>;
}

export function SettingsView() {
  const defaults = { business: "StockFlow F&B Operations", legalName: "PT StockFlow Indonesia", phone: "+62 878-6586-3912", email: "operations@stockflow.id", manager: "Dimas Riyanto", region: "Asia/Makassar (WITA)", address: "Jl. HOS Cokroaminoto, Monjok Barat, Mataram, NTB", lowThreshold: "150", currency: "IDR — Rupiah" };
  const [form, setForm] = useState(defaults);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const stored = localStorage.getItem("stockflow-settings-v1"); if (!stored) return; const frame = requestAnimationFrame(() => setForm(JSON.parse(stored))); return () => cancelAnimationFrame(frame); }, []);
  function update(key: string, value: string) { setSaved(false); setForm((current) => ({ ...current, [key]: value })); }
  function save(event: React.FormEvent) { event.preventDefault(); localStorage.setItem("stockflow-settings-v1", JSON.stringify(form)); setSaved(true); }
  return <div className="page-content"><section className="page-heading"><div><h2>Pengaturan sistem</h2><p>Identitas usaha, regional, dan aturan kebutuhan stok.</p></div></section><form className="settings-layout" onSubmit={save}>
    <article className="panel settings-card"><div className="section-title"><div><h3>Profil perusahaan</h3><p>Digunakan pada laporan dan dokumen stock opname.</p></div></div><div className="form-grid"><TextField label="Nama aplikasi / usaha" value={form.business} onChange={(value) => update("business", value)}/><TextField label="Nama badan usaha" value={form.legalName} onChange={(value) => update("legalName", value)}/><TextField label="Nomor telepon" value={form.phone} onChange={(value) => update("phone", value)}/><TextField label="Email operasional" value={form.email} type="email" onChange={(value) => update("email", value)}/><TextField label="Penanggung jawab" value={form.manager} onChange={(value) => update("manager", value)}/><TextField label="Zona waktu" value={form.region} onChange={(value) => update("region", value)}/><label className="full">Alamat<textarea value={form.address} onChange={(e) => update("address", e.target.value)}/></label></div></article>
    <article className="panel settings-card"><div className="section-title"><div><h3>Aturan inventaris</h3><p>Atur indikator kebutuhan dan regional angka.</p></div></div><div className="form-stack"><TextField label="Batas 'mau habis' (% dari stok minimum)" value={form.lowThreshold} type="number" onChange={(value) => update("lowThreshold", value)}/><TextField label="Mata uang" value={form.currency} onChange={(value) => update("currency", value)}/></div><div className="setting-note"><CircleAlert/><p>Item dinyatakan <b>perlu restock</b> ketika stok sama dengan atau di bawah batas minimum.</p></div><button className="primary" type="submit"><Save size={16}/> Simpan pengaturan</button>{saved && <div className="form-message success">Pengaturan berhasil disimpan.</div>}</article>
  </form></div>;
}

export function ItemDetailModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const health = getStockHealth(item);
  const days = item.dailyUsage > 0 ? Math.floor(item.stock / item.dailyUsage) : 0;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><article className="modal item-detail-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className={`status ${health.tone}`}>{health.label}</span><h2>{item.name}</h2><p>{item.sku} · {item.group}</p></div><button onClick={onClose} aria-label="Tutup detail"><X/></button></div><div className="stock-gauge"><div><span>Stok terhadap target</span><b>{health.percentage}%</b></div><div><i style={{ width: `${health.percentage}%` }}/></div></div><div className="detail-grid"><div><small>Stok tersedia</small><strong>{item.stock} {item.unit}</strong></div><div><small>Stok minimum</small><strong>{item.minimum} {item.unit}</strong></div><div><small>Estimasi bertahan</small><strong>±{days} hari</strong></div><div><small>Pemakaian rata-rata</small><strong>{item.dailyUsage} {item.unit} / hari</strong></div><div><small>Saran pemesanan</small><strong>{health.restock ? `${health.restock} ${item.unit}` : "Belum diperlukan"}</strong></div><div><small>Konversi pembelian</small><strong>1 {item.purchaseUnit} = {item.conversionFactor} {item.unit}</strong></div><div><small>Harga estimasi</small><strong>{formatMoney(item.price)}</strong></div><div><small>Kategori</small><strong>{item.category}</strong></div><div><small>Lokasi</small><strong>{item.warehouse}</strong></div><div className="full"><small>Supplier</small><strong>{item.supplier}</strong></div></div>{health.restock > 0 && <div className="restock-advice"><CircleAlert/><p>Segera buat permintaan pembelian minimal <b>{health.restock} {item.unit}</b> agar stok kembali ke target operasional.</p></div>}</article></div>;
}

function useStoredList<T>(key: string, initial: T[]) {
  const [value, setValue] = useState(initial);
  useEffect(() => { const stored = localStorage.getItem(key); if (!stored) return; const frame = requestAnimationFrame(() => setValue(JSON.parse(stored))); return () => cancelAnimationFrame(frame); }, [key]);
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

function SimpleModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose} aria-label="Tutup"><X/></button></div>{children}</section></div>; }
function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label>{label}<input type={type} required value={value} onChange={(event) => onChange(event.target.value)}/></label>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function formatMoney(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function getStockPriority(label: StockHealth) { return ({ Habis: 0, "Perlu restock": 1, "Mau habis": 2, Aman: 3 })[label]; }
function exportTransactions(records: StockTransaction[]) { const rows = [["ID", "Tanggal", "Barang", "Jenis", "Jumlah", "Satuan", "Supplier/Pengambil", "Pengguna", "Keterangan"], ...records.map((record) => [record.id, record.date, record.item, record.type === "in" ? "Masuk" : "Keluar", record.qty, record.unit, record.party, record.user || "Dimas Riyanto", record.note])]; downloadCsv("stockflow-transaksi.csv", rows); }
export function exportInventory(items: Item[]) { const rows = [["SKU", "Barang", "Kelompok", "Kategori", "Supplier", "Lokasi", "Stok", "Minimum", "Satuan", "Pemakaian/Hari", "Estimasi Hari", "Satuan Pembelian", "Konversi", "Harga", "Status", "Saran Restock"], ...items.map((item) => { const health = getStockHealth(item); return [item.sku, item.name, item.group, item.category, item.supplier, item.warehouse, item.stock, item.minimum, item.unit, item.dailyUsage, Math.floor(item.stock / item.dailyUsage), item.purchaseUnit, item.conversionFactor, item.price, health.label, health.restock]; })]; downloadCsv("stockflow-inventory-horeca.csv", rows); }
function downloadCsv(filename: string, rows: Array<Array<string | number>>) { const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
