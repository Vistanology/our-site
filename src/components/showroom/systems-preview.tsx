"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  LayoutDashboard,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import styles from "./showroom.module.css";
import { MiniButton, Switch } from "./controls";

type ViewId = "overview" | "orders" | "clients" | "automations" | "reports";
type PeriodId = "dia" | "semana" | "mes";
type Status = "ok" | "run" | "new";

const VIEWS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "automations", label: "Automações", icon: Zap },
  { id: "reports", label: "Relatórios", icon: TrendingUp },
];

const PERIODS: Record<PeriodId, { label: string; series: number[]; labels: string[]; avg: string; sat: string; dOrders: number; dRevenue: number }> = {
  dia: { label: "Dia", series: [12, 18, 26, 22, 31, 24, 16], labels: ["08h", "10h", "12h", "14h", "16h", "18h", "20h"], avg: "1,8 h", sat: "96%", dOrders: 8.2, dRevenue: 5.4 },
  semana: { label: "Semana", series: [86, 102, 94, 128, 141, 117, 98], labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], avg: "2,1 h", sat: "94%", dOrders: 12.6, dRevenue: 9.1 },
  mes: { label: "Mês", series: [320, 410, 380, 465, 512, 480, 540], labels: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"], avg: "2,4 h", sat: "95%", dOrders: -3.4, dRevenue: 14.2 },
};

const STATUS_META: Record<Status, { label: string; pill: string }> = {
  ok: { label: "Concluído", pill: styles.pillOk },
  run: { label: "Em andamento", pill: styles.pillRun },
  new: { label: "Novo", pill: styles.pillNew },
};

const FEED: { icon: typeof ShoppingBag; text: string; time: string; status: Status }[] = [
  { icon: ShoppingBag, text: "Pedido #2041 confirmado — Marina L.", time: "há 2 min", status: "ok" },
  { icon: Zap, text: "Automação “Boas-vindas” executada", time: "há 9 min", status: "run" },
  { icon: Users, text: "Novo cliente cadastrado — Estúdio Aqua", time: "há 24 min", status: "new" },
  { icon: CheckCircle2, text: "Pedido #2038 concluído — Rafael S.", time: "há 1 h", status: "ok" },
  { icon: Clock3, text: "Pedido #2042 aguardando pagamento", time: "há 1 h", status: "run" },
  { icon: ShoppingBag, text: "Pedido #2037 concluído — Bianca M.", time: "há 3 h", status: "ok" },
];

const ORDERS: { id: string; client: string; date: string; status: Status; value: number }[] = [
  { id: "#2041", client: "Marina Lima", date: "11 nov", status: "ok", value: 289 },
  { id: "#2040", client: "Estúdio Aqua", date: "11 nov", status: "new", value: 740 },
  { id: "#2039", client: "Rafael Souza", date: "10 nov", status: "run", value: 152 },
  { id: "#2038", client: "Rafael Souza", date: "10 nov", status: "ok", value: 318 },
  { id: "#2037", client: "Bianca Melo", date: "09 nov", status: "ok", value: 195 },
  { id: "#2036", client: "Caio Norte", date: "09 nov", status: "run", value: 460 },
];

const CLIENTS = [
  { initials: "ML", name: "Marina Lima", meta: "12 pedidos · desde 2024" },
  { initials: "EA", name: "Estúdio Aqua", meta: "8 pedidos · desde 2025" },
  { initials: "RS", name: "Rafael Souza", meta: "21 pedidos · desde 2023" },
  { initials: "BM", name: "Bianca Melo", meta: "5 pedidos · desde 2026" },
];

const AUTOMATIONS = [
  { name: "Boas-vindas", desc: "Envia uma mensagem quando um novo cliente se cadastra.", runs: 128 },
  { name: "Lembrete de pagamento", desc: "Notifica pedidos aguardando pagamento há mais de 24 h.", runs: 64 },
  { name: "Resumo semanal", desc: "Gera um resumo de pedidos e receita toda segunda-feira.", runs: 32 },
];

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export default function SystemsPreview({ motionEnabled }: { motionEnabled: boolean }) {
  const [view, setView] = useState<ViewId>("overview");
  const [period, setPeriod] = useState<PeriodId>("semana");
  const [query, setQuery] = useState("");
  const [onlyDone, setOnlyDone] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"all" | Status>("all");
  const [autos, setAutos] = useState([true, true, false]);

  const data = PERIODS[period];
  const totalOrders = data.series.reduce((a, b) => a + b, 0);
  const revenue = totalOrders * 86.4;
  const max = Math.max(...data.series);

  const feed = useMemo(
    () => FEED.filter((f) => (!onlyDone || f.status === "ok") && f.text.toLowerCase().includes(query.toLowerCase())),
    [onlyDone, query],
  );
  const orders = useMemo(
    () => ORDERS.filter((o) => (orderStatus === "all" || o.status === orderStatus) && (o.client.toLowerCase().includes(query.toLowerCase()) || o.id.includes(query))),
    [orderStatus, query],
  );

  const exportCsv = () => {
    const rows = [["periodo", "ponto", "pedidos", "receita_estimada_brl"], ...data.series.map((v, i) => [data.label, data.labels[i], String(v), (v * 86.4).toFixed(2)])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vistanology-demo-relatorio.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Pedidos", value: String(totalOrders), delta: data.dOrders },
    { label: "Receita", value: brl(revenue), delta: data.dRevenue },
    { label: "Tempo médio", value: data.avg, delta: 2.1 },
    { label: "Satisfação", value: data.sat, delta: 1.3 },
  ];

  const chart = (
    <div className={styles.chartCard}>
      <div className={styles.chartHead}><span>Pedidos por {data.label.toLowerCase()}</span><span>{totalOrders} no período</span></div>
      <div className={styles.bars}>
        {data.series.map((v, i) => (
          <button key={i} type="button" className={styles.bar} aria-label={`${data.labels[i]}: ${v} pedidos`}>
            <span className={styles.barTip}>{v}</span>
            <motion.span
              className={styles.barFill}
              initial={false}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ duration: motionEnabled ? 0.4 : 0, ease: "easeOut" }}
            />
          </button>
        ))}
      </div>
      <div className={styles.barLabels}>{data.labels.map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  );

  const periods = (
    <div className={styles.periods} role="group" aria-label="Período de análise">
      {(Object.keys(PERIODS) as PeriodId[]).map((p) => (
        <button key={p} type="button" aria-pressed={period === p} className={`${styles.periodBtn} ${period === p ? styles.periodOn : ""}`} onClick={() => setPeriod(p)}>
          {PERIODS[p].label}
        </button>
      ))}
    </div>
  );

  let body: React.ReactNode = null;
  if (view === "overview") {
    body = (
      <>
        <div className={styles.kpis}>
          {kpis.map((k) => (
            <div key={k.label} className={styles.kpi}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <span className={styles.kpiValue}>{k.value}</span>
              <span className={`${styles.kpiDelta} ${k.delta >= 0 ? styles.deltaUp : styles.deltaDown}`}>
                {k.delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(k.delta).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        {chart}
        <div className={styles.toolbar}>
          <label className={styles.search} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={13} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar atividade…"
              aria-label="Buscar atividade recente"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, color: "inherit", font: "inherit", outline: "none" }}
            />
          </label>
          <Switch label="Só concluídos" on={onlyDone} onChange={setOnlyDone} />
        </div>
        <div className={styles.feed}>
          {feed.length === 0 && <div className={styles.emptyNote}>Nenhuma atividade encontrada para esse filtro.</div>}
          {feed.map((f) => (
            <div key={f.text} className={styles.feedRow}>
              <span className={styles.feedIcon}><f.icon size={14} /></span>
              <span className={styles.feedText}>{f.text}</span>
              <span className={`${styles.pill} ${STATUS_META[f.status].pill}`}>{STATUS_META[f.status].label}</span>
              <span className={styles.feedTime}>{f.time}</span>
            </div>
          ))}
        </div>
      </>
    );
  } else if (view === "orders") {
    body = (
      <>
        <div className={styles.toolbar}>
          <label className={styles.search} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={13} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar pedido ou cliente…"
              aria-label="Buscar pedido ou cliente"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, color: "inherit", font: "inherit", outline: "none" }}
            />
          </label>
          <select
            aria-label="Filtrar pedidos por status"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value as "all" | Status)}
            className={styles.periodBtn}
            style={{ border: "1px solid var(--sr-line)", background: "rgba(2,29,54,.65)", color: "var(--sr-ink)", padding: "8px 12px", borderRadius: 999 }}
          >
            <option value="all">Todos os status</option>
            <option value="ok">Concluído</option>
            <option value="run">Em andamento</option>
            <option value="new">Novo</option>
          </select>
        </div>
        <div className={`${styles.tableWrap} ${styles.scrollArea}`}>
          <table className={styles.table}>
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Status</th><th>Valor</th></tr></thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={5}><div className={styles.emptyNote}>Nenhum pedido encontrado.</div></td></tr>}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td><td>{o.client}</td><td>{o.date}</td>
                  <td><span className={`${styles.pill} ${STATUS_META[o.status].pill}`}>{STATUS_META[o.status].label}</span></td>
                  <td>{brl(o.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (view === "clients") {
    body = (
      <div className={styles.clients}>
        {CLIENTS.map((c) => (
          <div key={c.name} className={styles.clientCard}>
            <span className={styles.avatar}>{c.initials}</span>
            <div><strong>{c.name}</strong><span>{c.meta}</span></div>
          </div>
        ))}
      </div>
    );
  } else if (view === "automations") {
    body = (
      <>
        {AUTOMATIONS.map((a, i) => (
          <div key={a.name} className={styles.autoRow}>
            <span className={styles.feedIcon}><Zap size={14} /></span>
            <div className={styles.autoInfo}><strong>{a.name}</strong><span>{a.desc}</span></div>
            <span className={styles.autoRuns}>{a.runs} execuções · {autos[i] ? "Ativa" : "Pausada"}</span>
            <Switch label={`Ativar automação ${a.name}`} on={autos[i]} onChange={(v) => setAutos((prev) => prev.map((p, j) => (j === i ? v : p)))} />
          </div>
        ))}
      </>
    );
  } else {
    const points = data.series.map((v, i) => `${(i / (data.series.length - 1)) * 300},${120 - (v / max) * 100}`).join(" ");
    body = (
      <>
        {chart}
        <div className={styles.chartCard}>
          <div className={styles.chartHead}><span>Tendência de receita</span><span>{brl(revenue)}</span></div>
          <svg className={styles.reportChart} viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label={`Tendência de receita no período ${data.label.toLowerCase()}`}>
            <defs>
              <linearGradient id="sr-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(0,210,255,0.5)" />
                <stop offset="1" stopColor="rgba(0,210,255,0)" />
              </linearGradient>
            </defs>
            <polygon points={`0,120 ${points} 300,120`} fill="url(#sr-area)" />
            <polyline points={points} fill="none" stroke="#a8ff78" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.toolbar}>
          <MiniButton onClick={exportCsv} title="Baixar CSV com os dados fictícios deste período"><Download size={13} /> Exportar CSV</MiniButton>
          <span className={styles.autoRuns}>Arquivo gerado localmente no seu navegador.</span>
        </div>
      </>
    );
  }

  const title = VIEWS.find((v) => v.id === view)?.label ?? "";

  return (
    <div className={styles.stage}>
      <div className={styles.dash}>
        <div className={styles.dashBar}>
          <span className={styles.dashDots} aria-hidden="true"><i /><i /><i /></span>
          <span className={styles.dashName}>AQUA · PAINEL ADMINISTRATIVO</span>
          <span className={styles.dashTag}>DADOS FICTÍCIOS</span>
        </div>
        <div className={styles.dashBody}>
          <nav className={`${styles.dashSide} ${styles.scrollArea}`} aria-label="Navegação do painel demonstrativo">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-current={view === v.id ? "true" : undefined}
                className={`${styles.sideBtn} ${view === v.id ? styles.sideBtnActive : ""}`}
                onClick={() => { setView(v.id); setQuery(""); }}
              >
                <v.icon size={14} aria-hidden="true" />{v.label}
              </button>
            ))}
          </nav>
          <div className={`${styles.dashMain} ${styles.scrollArea}`}>
            <div className={styles.dashHead}>
              <h4 className={styles.dashTitle}>{title}</h4>
              {(view === "overview" || view === "reports") && periods}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={motionEnabled ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={motionEnabled ? { opacity: 0, y: -8 } : undefined}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {body}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className={styles.dashFoot}>Demonstração conceitual. Todos os dados são fictícios.</div>
      </div>
    </div>
  );
}