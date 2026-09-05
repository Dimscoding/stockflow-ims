"use client";

import dynamic from "next/dynamic";
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, Building2,
  ChevronDown, CircleAlert, ClipboardCheck, FileDown, LayoutDashboard,
  Menu, Mic, Moon, Package, Plus, Search, Settings, Sparkles, Sun,
  Truck, Warehouse, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const WarehouseCanvas = dynamic(() => import("@/components/warehouse-canvas"), {
  ssr: false,
  loading: () => <div className="canvas-loading">Menyiapkan denah gudang…</div>,
});

type NavKey = "dashboard" | "inventory" | "transactions" | "warehouse" | "reports";
type Item = {
  id: string; name: string; sku: string; category: string; warehouse: string;
  stock: number; minimum: number; price: number; unit: string;
};

const seedItems: Item[] = [
  { id: "1", name: "Kertas HVS A4 80 gsm", sku: "KRT-A4-080", category: "Kertas", warehouse: "Gudang Utama", stock: 148, minimum: 40, price: 63500, unit: "Rim" },
  { id: "2", name: "Tinta Offset Process Black", sku: "TNT-OFS-BLK", category: "Tinta", warehouse: "Gudang Utama", stock: 18, minimum: 12, price: 187000, unit: "Kaleng" },
  { id: "3", name: "Art Paper 260 gsm", sku: "KRT-AP-260", category: "Kertas", warehouse: "Gudang Timur", stock: 27, minimum: 35, price: 142000, unit: "Pack" },
  { id: "4", name: "Lem Binding Premium", sku: "LM-BND-001", category: "Finishing", warehouse: "Gudang Timur", stock: 9, minimum: 15, price: 89000, unit: "Kg" },
  { id: "5", name: "Plat Cetak GTO 52", sku: "PLT-GTO-52", category: "Produksi", warehouse: "Gudang Utama", stock: 64, minimum: 20, price: 38500, unit: "Lembar" },
  { id: "6", name: "Laminasi Doff 31 cm", sku: "LMN-DOF-31", category: "Finishing", warehouse: "Gudang Barat", stock: 0, minimum: 10, price: 116000, unit: "Roll" },
];

const movementData = [
  { day: "Sen", incoming: 38, outgoing: 22 }, { day: "Sel", incoming: 24, outgoing: 31 },
  { day: "Rab", incoming: 51, outgoing: 28 }, { day: "Kam", incoming: 42, outgoing: 36 },
  { day: "Jum", incoming: 64, outgoing: 41 }, { day: "Sab", incoming: 32, outgoing: 19 },
  { day: "Min", incoming: 45, outgoing: 27 },
];

const categoryData = [
  { name: "Kertas", value: 48, color: "#6d5dfc" },
  { name: "Produksi", value: 25, color: "#18b6a4" },
  { name: "Finishing", value: 17, color: "#b5ef4a" },
  { name: "Tinta", value: 10, color: "#ffb547" },
];

const transactions = [
  { id: "GRN-2026-00184", item: "Kertas HVS A4 80 gsm", type: "Barang masuk", qty: "+48 Rim", time: "Hari ini, 09.42", tone: "in" },
  { id: "ISS-2026-00091", item: "Plat Cetak GTO 52", type: "Barang keluar", qty: "−12 Lembar", time: "Hari ini, 08.18", tone: "out" },
  { id: "TRF-2026-00036", item: "Tinta Offset Process Black", type: "Transfer gudang", qty: "6 Kaleng", time: "Kemarin, 16.05", tone: "transfer" },
  { id: "ADJ-2026-00017", item: "Lem Binding Premium", type: "Penyesuaian", qty: "−2 Kg", time: "Kemarin, 11.20", tone: "warning" },
];

const navItems = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "inventory" as const, label: "Inventory", icon: Boxes },
  { key: "transactions" as const, label: "Transaksi", icon: ArrowDownToLine },
  { key: "warehouse" as const, label: "Denah gudang", icon: Warehouse },
  { key: "reports" as const, label: "Laporan", icon: BarChart3 },
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

  useEffect(() => {
    const stored = localStorage.getItem("stockflow-items");
    if (!stored) return;
    const frame = requestAnimationFrame(() => setItems(JSON.parse(stored) as Item[]));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { localStorage.setItem("stockflow-items", JSON.stringify(items)); }, [items]);

  const totals = useMemo(() => {
    const units = items.reduce((sum, item) => sum + item.stock, 0);
    const value = items.reduce((sum, item) => sum + item.stock * item.price, 0);
    return { units, value, low: items.filter((item) => item.stock <= item.minimum && item.stock > 0).length, empty: items.filter((item) => item.stock === 0).length };
  }, [items]);
  const filteredItems = items.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query.toLowerCase()));

  function activate(key: NavKey) { setActive(key); setMenuOpen(false); }
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
        <nav>{navItems.map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "nav-item active" : "nav-item"} onClick={() => activate(key)}><Icon size={18} /><span>{label}</span>{key === "inventory" && <b>{items.length}</b>}</button>)}</nav>
        <div className="nav-label tools-label">Manajemen</div>
        <nav><button className="nav-item"><Truck size={18} /><span>Supplier</span></button><button className="nav-item"><Building2 size={18} /><span>Pengguna</span></button><button className="nav-item"><Settings size={18} /><span>Pengaturan</span></button></nav>
        <div className="ai-card"><span><Sparkles size={17} /> StockFlow AI</span><p>Cek stok dan buat transaksi dengan perintah suara.</p><button onClick={startVoice}><Mic size={15} /> Coba voice command</button></div>
        <div className="profile-side"><div className="avatar">DR</div><div><strong>Dimas Riyanto</strong><small>Administrator</small></div><ChevronDown size={16} /></div>
      </aside>
      {menuOpen && <button className="overlay" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />}
      <main className="main-shell">
        <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu /></button><div><p className="eyebrow">Sabtu, 5 September 2026</p><h1>{navItems.find((item) => item.key === active)?.label}</h1></div><div className="top-actions"><label className="search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari barang atau SKU…" /></label><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Ganti tema">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="primary" onClick={() => setShowAdd(true)}><Plus size={18} /> Tambah barang</button></div></header>
        {active === "dashboard" && <Dashboard totals={totals} items={items} voiceText={voiceText} listening={listening} startVoice={startVoice} />}
        {active === "inventory" && <Inventory items={filteredItems} query={query} setQuery={setQuery} onAdd={() => setShowAdd(true)} />}
        {active === "transactions" && <Transactions />}{active === "warehouse" && <WarehouseView />}{active === "reports" && <Reports items={items} />}
      </main>
      <nav className="mobile-nav">{navItems.slice(0, 4).map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "active" : ""} onClick={() => activate(key)}><Icon size={19} /><span>{label.split(" ")[0]}</span></button>)}</nav>
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onSave={(item) => { setItems((current) => [item, ...current]); setShowAdd(false); setActive("inventory"); }} />}
    </div>
  );
}

function Dashboard({ totals, items, voiceText, listening, startVoice }: { totals: { units: number; value: number; low: number; empty: number }; items: Item[]; voiceText: string; listening: boolean; startVoice: () => void }) {
  return <div className="page-content"><section className="welcome-row"><div><h2>Selamat malam, Dimas</h2><p>Berikut kondisi persediaan di seluruh gudang hari ini.</p></div><div className="live-pill"><span /> Data demo aktif</div></section>
    <section className="stats-grid"><StatCard title="Total jenis barang" value={items.length.toString()} note="4 kategori aktif" icon={<Package />} tone="purple" /><StatCard title="Total unit tersedia" value={totals.units.toLocaleString("id-ID")} note="+8,4% dari bulan lalu" icon={<Boxes />} tone="blue" /><StatCard title="Nilai persediaan" value={shortMoney(totals.value)} note="Berdasarkan harga modal" icon={<BarChart3 />} tone="green" /><StatCard title="Perlu perhatian" value={(totals.low + totals.empty).toString()} note={`${totals.empty} barang habis`} icon={<CircleAlert />} tone="orange" /></section>
    <section className="dashboard-grid"><article className="panel movement-panel"><PanelTitle title="Pergerakan stok" subtitle="Barang masuk dan keluar selama 7 hari" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={movementData}><defs><linearGradient id="incoming" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6d5dfc" stopOpacity={.28}/><stop offset="95%" stopColor="#6d5dfc" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><Tooltip contentStyle={{borderRadius:14,border:"1px solid var(--line)",background:"var(--panel)",color:"var(--text)"}}/><Area type="monotone" dataKey="incoming" stroke="#6d5dfc" strokeWidth={3} fill="url(#incoming)"/><Area type="monotone" dataKey="outgoing" stroke="#ffb547" strokeWidth={2.5} fill="transparent"/></AreaChart></ResponsiveContainer></div><div className="legend"><span><i className="purple-dot"/>Barang masuk</span><span><i className="orange-dot"/>Barang keluar</span></div></article>
      <article className="panel category-panel"><PanelTitle title="Komposisi stok" subtitle="Berdasarkan kategori" /><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={4}>{categoryData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>100%</strong><span>stok</span></div></div><div className="category-list">{categoryData.map((item) => <div key={item.name}><span><i style={{background:item.color}}/>{item.name}</span><b>{item.value}%</b></div>)}</div></article>
      <article className="panel transaction-panel"><PanelTitle title="Aktivitas terbaru" subtitle="Transaksi terbaru dari seluruh gudang" action="Lihat semua" />{transactions.slice(0,3).map((trx) => <TransactionRow key={trx.id} trx={trx}/>)}</article>
      <article className="panel attention-panel"><PanelTitle title="Stok perlu perhatian" subtitle="Di bawah batas minimum" action="Kelola stok" />{items.filter((item) => item.stock <= item.minimum).slice(0,3).map((item) => <div className="stock-alert" key={item.id}><div className="product-icon"><Package size={18}/></div><div><strong>{item.name}</strong><small>{item.sku} · {item.warehouse}</small></div><div className={item.stock === 0 ? "stock-badge empty" : "stock-badge low"}>{item.stock === 0 ? "Habis" : `${item.stock} ${item.unit}`}</div></div>)}</article></section>
    <section className="assistant-strip"><div className="assistant-icon"><Sparkles /></div><div><strong>Asisten inventory</strong><p>{voiceText || "Tekan mikrofon lalu ucapkan, “Tambahkan stok Kertas HVS sebanyak 20 rim.”"}</p></div><button className={listening ? "voice-button listening" : "voice-button"} onClick={startVoice}><Mic size={18}/>{listening ? "Mendengarkan…" : "Mulai bicara"}</button></section></div>;
}

function Inventory({ items, query, setQuery, onAdd }: { items: Item[]; query: string; setQuery: (value:string)=>void; onAdd:()=>void }) {
  return <div className="page-content"><section className="page-heading"><div><h2>Daftar persediaan</h2><p>Kelola seluruh barang, lokasi, dan batas minimum stok.</p></div><button className="primary" onClick={onAdd}><Plus size={18}/> Tambah barang</button></section><article className="panel table-panel"><div className="table-toolbar"><label className="search wide"><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari nama, SKU, atau kategori…"/></label><button className="secondary"><FileDown size={17}/> Export CSV</button></div><div className="table-scroll"><table><thead><tr><th>Barang</th><th>Kategori</th><th>Lokasi</th><th>Stok</th><th>Harga modal</th><th>Status</th></tr></thead><tbody>{items.map((item)=><tr key={item.id}><td><div className="item-name"><span><Package size={17}/></span><div><strong>{item.name}</strong><small>{item.sku}</small></div></div></td><td>{item.category}</td><td>{item.warehouse}</td><td><b>{item.stock}</b> {item.unit}</td><td>{money.format(item.price)}</td><td><span className={item.stock===0?"status out":item.stock<=item.minimum?"status low":"status safe"}>{item.stock===0?"Habis":item.stock<=item.minimum?"Stok rendah":"Tersedia"}</span></td></tr>)}</tbody></table></div></article></div>;
}

function Transactions() { return <div className="page-content"><section className="page-heading"><div><h2>Pergerakan barang</h2><p>Semua penerimaan, pengeluaran, transfer, dan penyesuaian stok.</p></div><div className="button-row"><button className="secondary"><ArrowUpFromLine size={17}/> Barang keluar</button><button className="primary"><ArrowDownToLine size={17}/> Barang masuk</button></div></section><section className="mini-stats"><div><span>Masuk bulan ini</span><strong>1.284 unit</strong><small className="positive">+12,6%</small></div><div><span>Keluar bulan ini</span><strong>947 unit</strong><small>−4,2%</small></div><div><span>Menunggu persetujuan</span><strong>8 transaksi</strong><small className="warning">Perlu tindakan</small></div></section><article className="panel transactions-full"><PanelTitle title="Riwayat transaksi" subtitle="September 2026" action="Unduh laporan"/>{transactions.map((trx)=><TransactionRow key={trx.id} trx={trx}/>)}</article></div> }
function WarehouseView() { return <div className="page-content"><section className="page-heading"><div><h2>Denah gudang interaktif</h2><p>Petakan zona, rak, dan lokasi persediaan melalui kanvas tldraw.</p></div><div className="live-pill"><span/> Tersimpan otomatis</div></section><article className="panel warehouse-card"><div className="warehouse-info"><div><strong>Gudang Utama — Monjok</strong><span>8 zona · 24 rak · 1.248 unit</span></div><div className="capacity"><span>Kapasitas 72%</span><div><i/></div></div></div><div className="canvas-shell"><WarehouseCanvas/></div></article></div> }
function Reports({items}:{items:Item[]}) { const data=items.map(item=>({name:item.category,value:item.stock})); return <div className="page-content"><section className="page-heading"><div><h2>Laporan persediaan</h2><p>Analisis nilai, pergerakan, dan kesehatan stok.</p></div><button className="primary"><FileDown size={17}/> Export laporan</button></section><section className="report-grid"><article className="panel report-chart"><PanelTitle title="Stok per barang" subtitle="Jumlah unit tersedia"/><div className="bar-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><Tooltip/><Bar dataKey="value" fill="#6d5dfc" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></article><article className="panel report-summary"><PanelTitle title="Ringkasan September" subtitle="Kinerja inventaris"/><div className="report-metric"><span>Akurasi stok</span><strong>97,8%</strong><i style={{width:"97.8%"}}/></div><div className="report-metric"><span>Perputaran stok</span><strong>6,4×</strong><i style={{width:"72%"}}/></div><div className="report-metric"><span>Pemenuhan permintaan</span><strong>94,2%</strong><i style={{width:"94.2%"}}/></div><div className="report-note"><ClipboardCheck/><div><strong>Stok sehat</strong><p>Mayoritas barang berada pada tingkat persediaan yang aman.</p></div></div></article></section></div> }

function StatCard({title,value,note,icon,tone}:{title:string;value:string;note:string;icon:React.ReactNode;tone:string}) { return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div><div className={`spark ${tone}`}><i/><i/><i/><i/><i/></div></article> }
function PanelTitle({title,subtitle,action}:{title:string;subtitle:string;action?:string}) { return <div className="panel-title"><div><h3>{title}</h3><p>{subtitle}</p></div>{action&&<button>{action}</button>}</div> }
function TransactionRow({trx}:{trx:(typeof transactions)[number]}) { return <div className="transaction-row"><span className={`trx-icon ${trx.tone}`}>{trx.tone==="in"?<ArrowDownToLine/>:trx.tone==="out"?<ArrowUpFromLine/>:trx.tone==="transfer"?<Truck/>:<CircleAlert/>}</span><div><strong>{trx.item}</strong><small>{trx.type} · {trx.id}</small></div><div><b>{trx.qty}</b><small>{trx.time}</small></div></div> }
function AddItemModal({onClose,onSave}:{onClose:()=>void;onSave:(item:Item)=>void}) {
  const [form,setForm]=useState({name:"",sku:"",category:"Kertas",warehouse:"Gudang Utama",stock:"",minimum:"",price:"",unit:"Pcs"});
  function submit(event:React.FormEvent){event.preventDefault();onSave({id:crypto.randomUUID(),name:form.name,sku:form.sku,category:form.category,warehouse:form.warehouse,stock:Number(form.stock),minimum:Number(form.minimum),price:Number(form.price),unit:form.unit});}
  const update=(key:string,value:string)=>setForm(current=>({...current,[key]:value}));
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event)=>event.stopPropagation()}><div className="modal-head"><div><h2>Tambah barang</h2><p>Masukkan data master dan stok awal.</p></div><button type="button" onClick={onClose}><X/></button></div><div className="form-grid"><label className="full">Nama barang<input required value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="Contoh: Kertas HVS A4 80 gsm"/></label><label>SKU<input required value={form.sku} onChange={(e)=>update("sku",e.target.value)} placeholder="KRT-A4-080"/></label><label>Kategori<select value={form.category} onChange={(e)=>update("category",e.target.value)}><option>Kertas</option><option>Tinta</option><option>Produksi</option><option>Finishing</option></select></label><label>Gudang<select value={form.warehouse} onChange={(e)=>update("warehouse",e.target.value)}><option>Gudang Utama</option><option>Gudang Timur</option><option>Gudang Barat</option></select></label><label>Satuan<input value={form.unit} onChange={(e)=>update("unit",e.target.value)}/></label><label>Stok awal<input required type="number" min="0" value={form.stock} onChange={(e)=>update("stock",e.target.value)}/></label><label>Stok minimum<input required type="number" min="0" value={form.minimum} onChange={(e)=>update("minimum",e.target.value)}/></label><label className="full">Harga modal<input required type="number" min="0" value={form.price} onChange={(e)=>update("price",e.target.value)} placeholder="0"/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Batal</button><button className="primary" type="submit">Simpan barang</button></div></form></div>
}
function shortMoney(value:number){if(value>=1_000_000_000)return `Rp${(value/1_000_000_000).toFixed(1)} M`;if(value>=1_000_000)return `Rp${(value/1_000_000).toFixed(1)} Jt`;return money.format(value)}
