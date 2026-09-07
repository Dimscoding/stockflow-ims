"use client";

import dynamic from "next/dynamic";
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, Building2,
  ChevronDown, CircleAlert, ClipboardCheck, FileDown, LayoutDashboard,
  Menu, Mic, Moon, Package, Plus, Search, Settings, Sparkles, Sun,
  Truck, Warehouse, X, CalendarClock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { seedItems, type Item } from "@/data/inventory";
import InventoryAdvanced from "@/components/inventory-advanced";
import BatchExpiryView from "@/components/batch-expiry-view";
import {
  exportInventory, getStockHealth, ItemDetailModal, SettingsView,
  StockNeedsPanel, StocktakeView, SuppliersView, TransactionsView, UsersView,
  seedStockTransactions, type StockTransaction,
} from "@/components/management-views";

const WarehouseCanvas = dynamic(() => import("@/components/warehouse-canvas"), {
  ssr: false,
  loading: () => <div className="canvas-loading">Menyiapkan denah gudang…</div>,
});

type NavKey = "dashboard" | "inventory" | "transactions" | "stocktake" | "batches" | "warehouse" | "reports" | "suppliers" | "users" | "settings";

const movementData = [
  { day: "Sen", incoming: 38, outgoing: 22 }, { day: "Sel", incoming: 24, outgoing: 31 },
  { day: "Rab", incoming: 51, outgoing: 28 }, { day: "Kam", incoming: 42, outgoing: 36 },
  { day: "Jum", incoming: 64, outgoing: 41 }, { day: "Sab", incoming: 32, outgoing: 19 },
  { day: "Min", incoming: 45, outgoing: 27 },
];

const transactions = [
  { id: "GRN-2026-00184", item: "Fresh Milk Pasteurisasi 1 L", type: "Barang masuk", qty: "+24 Kotak", time: "Hari ini, 09.42", tone: "in" },
  { id: "ISS-2026-00091", item: "Biji Kopi House Blend 70:30", type: "Barang keluar", qty: "−6 Kg", time: "Hari ini, 08.18", tone: "out" },
  { id: "TRF-2026-00036", item: "Plastic Cup PET 16 oz + Lid", type: "Transfer gudang", qty: "8 Pack", time: "Kemarin, 16.05", tone: "transfer" },
  { id: "ADJ-2026-00017", item: "Liquid Descaler Mesin Kopi", type: "Penyesuaian", qty: "−1 Botol", time: "Kemarin, 11.20", tone: "warning" },
];

const navItems = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "inventory" as const, label: "Inventory", icon: Boxes },
  { key: "transactions" as const, label: "Transaksi", icon: ArrowDownToLine },
  { key: "stocktake" as const, label: "Stok opname", icon: ClipboardCheck },
  { key: "batches" as const, label: "Batch & expiry", icon: CalendarClock },
  { key: "warehouse" as const, label: "Denah gudang", icon: Warehouse },
  { key: "reports" as const, label: "Laporan", icon: BarChart3 },
  { key: "suppliers" as const, label: "Supplier", icon: Truck },
  { key: "users" as const, label: "Pengguna", icon: Building2 },
  { key: "settings" as const, label: "Pengaturan", icon: Settings },
];

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function Home() {
  const [active, setActive] = useState<NavKey>("dashboard");
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>(seedItems);
  const [showAdd, setShowAdd] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [listening, setListening] = useState(false);
  const [todayLabel, setTodayLabel] = useState("Memuat tanggal…");
  const [greeting, setGreeting] = useState("Selamat datang");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(seedStockTransactions);

  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar", weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const hour = Number(new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar", hour: "2-digit", hourCycle: "h23",
    }).format(now));
    const frame = requestAnimationFrame(() => {
      setTodayLabel(formatter.format(now));
      setGreeting(hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("stockflow-horeca-items-v1");
    if (!stored) return;
    const frame = requestAnimationFrame(() => setItems(JSON.parse(stored) as Item[]));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { localStorage.setItem("stockflow-horeca-items-v1", JSON.stringify(items)); }, [items]);

  useEffect(() => {
    const stored = localStorage.getItem("stockflow-transactions-v1");
    if (!stored) return;
    const frame = requestAnimationFrame(() => setStockTransactions(JSON.parse(stored) as StockTransaction[]));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { localStorage.setItem("stockflow-transactions-v1", JSON.stringify(stockTransactions)); }, [stockTransactions]);

  const totals = useMemo(() => {
    const units = items.reduce((sum, item) => sum + item.stock, 0);
    const value = items.reduce((sum, item) => sum + item.stock * item.price, 0);
    return { units, value, low: items.filter((item) => getStockHealth(item).label !== "Aman" && item.stock > 0).length, empty: items.filter((item) => item.stock === 0).length };
  }, [items]);
  const filteredItems = items.filter((item) => `${item.name} ${item.sku} ${item.group} ${item.category} ${item.supplier}`.toLowerCase().includes(query.toLowerCase()));

  function activate(key: NavKey) { setActive(key); setMenuOpen(false); }
  function recordStockTransaction(record: StockTransaction) {
    const item = items.find((entry) => entry.id === record.itemId);
    if (!item) return "Barang tidak ditemukan.";
    if (record.type === "out" && record.qty > item.stock) return `Stok tidak cukup. Tersedia ${item.stock} ${item.unit}.`;
    setItems((current) => current.map((entry) => entry.id === record.itemId ? { ...entry, stock: entry.stock + (record.type === "in" ? record.qty : -record.qty) } : entry));
    setStockTransactions((current) => [record, ...current]);
    return null;
  }
  function startVoice() {
    type VoiceResult = { results: ArrayLike<{ 0: { transcript: string } }> };
    type Recognition = { lang: string; start: () => void; onresult: (event: VoiceResult) => void; onend: () => void };
    type VoiceWindow = typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const voiceWindow = window as VoiceWindow;
    const SpeechRecognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceText("Browser ini belum mendukung input suara. Modul Whisper siap dihubungkan melalui endpoint server.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.onresult = (event) => setVoiceText(event.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    setListening(true); recognition.start();
  }

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand"><span className="brand-mark"><Boxes size={20} /></span><div><strong>StockFlow</strong><small>Inventory OS</small></div></div>
        <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X /></button>
        <div className="nav-label">Workspace</div>
        <nav>{navItems.slice(0, 7).map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "nav-item active" : "nav-item"} onClick={() => activate(key)}><Icon size={18} /><span>{label}</span>{key === "inventory" && <b>{items.length}</b>}</button>)}</nav>
        <div className="nav-label tools-label">Manajemen</div>
        <nav>{navItems.slice(7).map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "nav-item active" : "nav-item"} onClick={() => activate(key)}><Icon size={18}/><span>{label}</span></button>)}</nav>
        <div className="ai-card"><span><Sparkles size={17} /> StockFlow AI</span><p>Cek stok dan buat transaksi dengan perintah suara.</p><button onClick={startVoice}><Mic size={15} /> Coba voice command</button></div>
        <div className="profile-side"><div className="avatar">DR</div><div><strong>Dimas Riyanto</strong><small>Administrator</small></div><ChevronDown size={16} /></div>
      </aside>
      {menuOpen && <button className="overlay" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />}
      <main className="main-shell">
        <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu /></button><div><p className="eyebrow">{todayLabel}</p><h1>{navItems.find((item) => item.key === active)?.label}</h1></div><div className="top-actions"><label className="search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari barang atau SKU…" /></label><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Ganti tema">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="primary" onClick={() => setShowAdd(true)}><Plus size={18} /> Tambah barang</button></div></header>
        {active === "dashboard" && <Dashboard totals={totals} items={items} greeting={greeting} voiceText={voiceText} listening={listening} startVoice={startVoice} onSelect={setSelectedItem} onNavigate={activate} />}
        {active === "inventory" && <InventoryAdvanced items={filteredItems} query={query} setQuery={setQuery} onAdd={() => setShowAdd(true)} onSelect={setSelectedItem} />}
        {active === "transactions" && <TransactionsView items={items} records={stockTransactions} onRecord={recordStockTransaction}/>}
        {active === "stocktake" && <StocktakeView items={items} onApply={(counts) => setItems((current) => current.map((item) => ({ ...item, stock: Number(counts[item.id] ?? item.stock) })))}/>}
        {active === "batches" && <BatchExpiryView items={items}/>} 
        {active === "warehouse" && <WarehouseView />}{active === "reports" && <Reports items={items} />}
        {active === "suppliers" && <SuppliersView/>}{active === "users" && <UsersView/>}{active === "settings" && <SettingsView/>}
      </main>
      <nav className="mobile-nav">{navItems.slice(0, 4).map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "active" : ""} onClick={() => activate(key)}><Icon size={19} /><span>{label.split(" ")[0]}</span></button>)}</nav>
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onSave={(item) => { setItems((current) => [item, ...current]); setShowAdd(false); setActive("inventory"); }} />}
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)}/>}
    </div>
  );
}

function Dashboard({ totals, items, greeting, voiceText, listening, startVoice, onSelect, onNavigate }: { totals: { units: number; value: number; low: number; empty: number }; items: Item[]; greeting: string; voiceText: string; listening: boolean; startVoice: () => void; onSelect: (item: Item) => void; onNavigate: (key: NavKey) => void }) {
  return <div className="page-content"><section className="welcome-row"><div><h2>{greeting}, Dimas</h2><p>Berikut kondisi persediaan operasional F&amp;B hari ini.</p></div><div className="live-pill"><span /> Data demo HORECA aktif</div></section>
    <section className="stats-grid"><StatCard title="Total jenis barang" value={items.length.toString()} note={`${new Set(items.map((item) => item.group)).size} kelompok aktif`} icon={<Package />} tone="purple" /><StatCard title="Total unit tersedia" value={totals.units.toLocaleString("id-ID")} note="Seluruh lokasi penyimpanan" icon={<Boxes />} tone="blue" /><StatCard title="Nilai persediaan" value={money.format(totals.value)} note="Berdasarkan harga estimasi" icon={<BarChart3 />} tone="green" /><StatCard title="Perlu perhatian" value={(totals.low + totals.empty).toString()} note={`${totals.empty} barang habis`} icon={<CircleAlert />} tone="orange" /></section>
    <section className="dashboard-grid"><article className="panel movement-panel"><PanelTitle title="Pergerakan stok" subtitle="Barang masuk dan keluar selama 7 hari" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={movementData}><defs><linearGradient id="incoming" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6d5dfc" stopOpacity={.28}/><stop offset="95%" stopColor="#6d5dfc" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><Tooltip contentStyle={{borderRadius:14,border:"1px solid var(--line)",background:"var(--panel)",color:"var(--text)"}}/><Area type="monotone" dataKey="incoming" stroke="#6d5dfc" strokeWidth={3} fill="url(#incoming)"/><Area type="monotone" dataKey="outgoing" stroke="#ffb547" strokeWidth={2.5} fill="transparent"/></AreaChart></ResponsiveContainer></div><div className="legend"><span><i className="purple-dot"/>Barang masuk</span><span><i className="orange-dot"/>Barang keluar</span></div></article>
      <article className="panel category-panel"><PanelTitle title="Kebutuhan stok per item" subtitle="Prioritas berdasarkan stok minimum" /><StockNeedsPanel items={items} onSelect={onSelect}/></article>
      <article className="panel transaction-panel"><PanelTitle title="Aktivitas terbaru" subtitle="Transaksi terbaru dari seluruh gudang" action="Lihat semua" onAction={() => onNavigate("transactions")} />{transactions.slice(0,3).map((trx) => <TransactionRow key={trx.id} trx={trx}/>)}</article>
      <article className="panel attention-panel"><PanelTitle title="Stok perlu perhatian" subtitle="Di bawah batas minimum" action="Kelola stok" onAction={() => onNavigate("inventory")} />{items.filter((item) => item.stock <= item.minimum).slice(0,3).map((item) => <div className="stock-alert" key={item.id}><div className="product-icon"><Package size={18}/></div><div><strong>{item.name}</strong><small>{item.sku} · {item.warehouse}</small></div><div className={item.stock === 0 ? "stock-badge empty" : "stock-badge low"}>{item.stock === 0 ? "Habis" : `${item.stock} ${item.unit}`}</div></div>)}</article></section>
    <section className="assistant-strip"><div className="assistant-icon"><Sparkles /></div><div><strong>Asisten inventory</strong><p>{voiceText || "Tekan mikrofon lalu ucapkan, “Tambahkan stok fresh milk sebanyak 20 kotak.”"}</p></div><button className={listening ? "voice-button listening" : "voice-button"} onClick={startVoice}><Mic size={18}/>{listening ? "Mendengarkan…" : "Mulai bicara"}</button></section></div>;
}

function WarehouseView() { return <div className="page-content"><section className="page-heading"><div><h2>Denah gudang interaktif</h2><p>Petakan dry storage, chiller, freezer, beverage bar, dan area kemasan.</p></div><div className="live-pill"><span/> Tersimpan otomatis</div></section><article className="panel warehouse-card"><div className="warehouse-info"><div><strong>Central Kitchen &amp; Storage — Monjok</strong><span>8 zona · 24 rak · inventaris F&amp;B</span></div><div className="capacity"><span>Kapasitas 72%</span><div><i/></div></div></div><div className="canvas-shell"><WarehouseCanvas/></div></article></div> }
function Reports({items}:{items:Item[]}) { const data=useMemo(()=>items.map((item)=>({name:item.sku,value:getStockHealth(item).restock})).filter((item)=>item.value>0).sort((a,b)=>b.value-a.value).slice(0,12),[items]); return <div className="page-content"><section className="page-heading"><div><h2>Laporan persediaan</h2><p>Analisis kebutuhan restock pada setiap item.</p></div><button className="primary" onClick={()=>window.print()}><FileDown size={17}/> Cetak PDF</button></section><section className="report-grid"><article className="panel report-chart"><PanelTitle title="Prioritas restock per item" subtitle="Rekomendasi jumlah pemesanan berdasarkan SKU"/><div className="bar-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><Tooltip/><Bar dataKey="value" name="Saran restock" fill="#6d5dfc" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></article><article className="panel report-summary"><PanelTitle title="Ringkasan September" subtitle="Kinerja inventaris"/><div className="report-metric"><span>Akurasi stok</span><strong>97,8%</strong><i style={{width:"97.8%"}}/></div><div className="report-metric"><span>Item perlu perhatian</span><strong>{items.filter((item)=>getStockHealth(item).label!=="Aman").length}</strong><i style={{width:`${Math.min(100,(items.filter((item)=>getStockHealth(item).label!=="Aman").length/items.length)*100)}%`}}/></div><div className="report-metric"><span>Pemenuhan permintaan</span><strong>94,2%</strong><i style={{width:"94.2%"}}/></div><div className="report-note"><ClipboardCheck/><div><strong>Stok HORECA terpantau</strong><p>Harga merupakan estimasi demo dan dapat diperbarui sesuai quotation supplier.</p></div></div></article></section></div> }

function StatCard({title,value,note,icon,tone}:{title:string;value:string;note:string;icon:React.ReactNode;tone:string}) { return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div><div className={`spark ${tone}`}><i/><i/><i/><i/><i/></div></article> }
function PanelTitle({title,subtitle,action,onAction}:{title:string;subtitle:string;action?:string;onAction?:()=>void}) { return <div className="panel-title"><div><h3>{title}</h3><p>{subtitle}</p></div>{action&&<button onClick={onAction}>{action}</button>}</div> }
function TransactionRow({trx}:{trx:(typeof transactions)[number]}) { return <div className="transaction-row"><span className={`trx-icon ${trx.tone}`}>{trx.tone==="in"?<ArrowDownToLine/>:trx.tone==="out"?<ArrowUpFromLine/>:trx.tone==="transfer"?<Truck/>:<CircleAlert/>}</span><div><strong>{trx.item}</strong><small>{trx.type} · {trx.id}</small></div><div><b>{trx.qty}</b><small>{trx.time}</small></div></div> }
function AddItemModal({onClose,onSave}:{onClose:()=>void;onSave:(item:Item)=>void}) {
  const [form,setForm]=useState({name:"",sku:"",group:"Bahan Mentah",category:"Dairy, Egg & Fats",supplier:"",warehouse:"Dry Storage",stock:"",minimum:"",price:"",unit:"Pcs"});
  function submit(event:React.FormEvent){event.preventDefault();onSave({id:crypto.randomUUID(),name:form.name,sku:form.sku,group:form.group,category:form.category,supplier:form.supplier,warehouse:form.warehouse,stock:Number(form.stock),minimum:Number(form.minimum),price:Number(form.price),unit:form.unit});}
  const update=(key:string,value:string)=>setForm(current=>({...current,[key]:value}));
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event)=>event.stopPropagation()}><div className="modal-head"><div><h2>Tambah barang</h2><p>Masukkan data master dan stok awal.</p></div><button type="button" onClick={onClose}><X/></button></div><div className="form-grid"><label className="full">Nama barang<input required value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="Contoh: Fresh Milk Pasteurisasi 1 L"/></label><label>SKU<input required value={form.sku} onChange={(e)=>update("sku",e.target.value)} placeholder="DRY-MLK-PST-1L"/></label><label>Kelompok<select value={form.group} onChange={(e)=>update("group",e.target.value)}><option>Bahan Mentah</option><option>Semi-Finished</option><option>Sirup &amp; Topping</option><option>Kemasan</option><option>Operasional</option></select></label><label>Kategori<input required value={form.category} onChange={(e)=>update("category",e.target.value)}/></label><label>Supplier<input required value={form.supplier} onChange={(e)=>update("supplier",e.target.value)} placeholder="Nama vendor"/></label><label>Lokasi<select value={form.warehouse} onChange={(e)=>update("warehouse",e.target.value)}><option>Dry Storage</option><option>Chiller</option><option>Freezer</option><option>Beverage Bar</option><option>Packaging Store</option><option>Hygiene Store</option><option>Chemical Store</option></select></label><label>Satuan<input value={form.unit} onChange={(e)=>update("unit",e.target.value)}/></label><label>Stok awal<input required type="number" min="0" value={form.stock} onChange={(e)=>update("stock",e.target.value)}/></label><label>Stok minimum<input required type="number" min="0" value={form.minimum} onChange={(e)=>update("minimum",e.target.value)}/></label><label className="full">Harga estimasi<input required type="number" min="0" value={form.price} onChange={(e)=>update("price",e.target.value)} placeholder="0"/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Batal</button><button className="primary" type="submit">Simpan barang</button></div></form></div>
}
