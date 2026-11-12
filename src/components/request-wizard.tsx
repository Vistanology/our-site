"use client";

import {
  useCallback, useEffect, useId, useRef, useState,
  type ChangeEvent, type FormEvent, type KeyboardEvent,
} from "react";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import {
  AppWindow, ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown,
  Code2, Copy, Download, Ellipsis, Globe, Info, LayoutGrid,
  LoaderCircle, Mail, Monitor, Send, ShieldCheck, Wrench, X, Zap,
} from "lucide-react";
import { site } from "@/data/site";

const kinds = [
  { label: "Desktop", icon: Monitor },
  { label: "Web", icon: Globe },
  { label: "Windows", icon: AppWindow },
  { label: "Automação", icon: Zap },
  { label: "Utilitário", icon: Wrench },
  { label: "Produtividade", icon: LayoutGrid },
  { label: "Sob medida", icon: Code2 },
  { label: "Outro", icon: Ellipsis },
] as const;
const platforms = ["Windows", "macOS", "Linux", "Web", "Android", "iOS"] as const;
const budgets = ["Ainda não sei", "Até R$ 2.000", "R$ 2.000 a R$ 5.000", "R$ 5.000 a R$ 15.000", "Acima de R$ 15.000"];
const complexities = ["Ainda não sei", "Simples", "Intermediária", "Avançada"];
const steps = [
  { label: "Tipo", title: "O que vamos criar?", description: "Escolha o tipo que mais combina com a sua ideia." },
  { label: "Ideia", title: "Conte a sua ideia.", description: "Não precisa falar a linguagem da tecnologia. Conte o que você precisa resolver." },
  { label: "Plataformas", title: "Onde ele vai funcionar?", description: "Você pode escolher mais de uma plataforma." },
  { label: "Detalhes", title: "Vamos refinar o caminho.", description: "Tudo nesta etapa é opcional. Tudo bem ainda não ter essas respostas." },
  { label: "Revisão", title: "Seu briefing, pronto para revisar.", description: "Confira o resumo e escolha como continuar. Nada é enviado automaticamente." },
];

type Briefing = {
  kind: string;
  problem: string;
  features: string;
  reference: string;
  use: string;
  platforms: string[];
  deadline: string;
  budget: string;
  complexity: string;
  integrations: string;
  technology: string;
  notes: string;
  name: string;
  email: string;
  company: string;
  consent: boolean;
};
type TextKey = Exclude<keyof Briefing, "platforms" | "consent">;
type Errors = Partial<Record<keyof Briefing, string>>;
const stepFields: (keyof Briefing)[][] = [
  ["kind"], ["problem", "features", "reference", "use"], ["platforms"],
  ["deadline", "budget", "complexity", "integrations", "technology", "notes"],
  ["name", "email", "company", "consent"],
];
const labels: Record<keyof Briefing, string> = {
  kind: "Tipo de software", problem: "Problema a resolver", features: "Funcionalidades importantes",
  reference: "Referência", use: "Finalidade", platforms: "Plataformas", deadline: "Prazo desejado",
  budget: "Orçamento estimado", complexity: "Complexidade", integrations: "Integrações",
  technology: "Tecnologia preferida", notes: "Observações", name: "Nome", email: "E-mail",
  company: "Empresa", consent: "Autorização de uso dos dados neste briefing",
};
const initialBriefing: Briefing = {
  kind: "", problem: "", features: "", reference: "", use: "Pessoal", platforms: [],
  deadline: "", budget: "", complexity: "", integrations: "", technology: "", notes: "",
  name: "", email: "", company: "", consent: false,
};
const inputClass = "w-full rounded-xl border border-sky-300/35 bg-white/5 px-4 py-3 text-base text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)] outline-none placeholder:text-sky-200/60 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/25 aria-invalid:border-rose-300 disabled:cursor-wait disabled:opacity-60 [color-scheme:dark] sm:text-sm";
const buttonBase = "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none";
const buttonClass = `${buttonBase} border-sky-200/35 bg-sky-100/5 text-white hover:bg-sky-100/15`;
const primaryClass = `${buttonBase} border-cyan-200/80 bg-gradient-to-b from-cyan-200 to-sky-400 text-sky-950 shadow-[inset_0_1px_0_#fff,0_4px_18px_rgba(34,211,238,0.15)] hover:from-cyan-100 hover:to-sky-300`;
const offlineNotice = "Recebimento online ainda não configurado. Você pode preparar e baixar seu briefing; nenhum pedido será enviado.";

function safeEndpoint(value: string): URL | null {
  if (!/^https:\/\//i.test(value) || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password && !url.hash ? url : null;
  } catch {
    return null;
  }
}

function validEmail(value: string): boolean {
  return value.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value);
}

function validateStep(data: Briefing, step: number): Errors {
  const errors: Errors = {};
  const requiredText = (key: TextKey, max: number) => {
    if (!data[key].trim()) errors[key] = "Preencha este campo para continuar.";
    else if (data[key].length > max) errors[key] = `Use no máximo ${max} caracteres.`;
  };
  const optionalText = (key: TextKey, max: number) => {
    if (data[key].length > max) errors[key] = `Use no máximo ${max} caracteres.`;
  };
  if (step === 0 && !kinds.some(({ label }) => label === data.kind)) errors.kind = "Escolha um tipo de software.";
  if (step === 1) {
    requiredText("problem", 4000);
    requiredText("features", 4000);
    optionalText("reference", 500);
    if (!["Pessoal", "Comercial"].includes(data.use)) errors.use = "Escolha a finalidade do software.";
  }
  if (step === 2 && (!data.platforms.length || data.platforms.some((item) => !platforms.some((platform) => platform === item)))) {
    errors.platforms = "Selecione pelo menos uma plataforma.";
  }
  if (step === 3) {
    if (data.deadline) {
      const date = new Date(`${data.deadline}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.deadline) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.deadline) {
        errors.deadline = "Informe uma data válida ou deixe o prazo em branco.";
      }
    }
    if (data.budget && !budgets.includes(data.budget)) errors.budget = "Escolha uma opção de orçamento.";
    if (data.complexity && !complexities.includes(data.complexity)) errors.complexity = "Escolha uma opção de complexidade.";
    optionalText("integrations", 1500);
    optionalText("technology", 200);
    optionalText("notes", 3000);
  }
  if (step === 4) {
    if (data.name.trim().length < 2 || data.name.length > 100) errors.name = "Informe seu nome com 2 a 100 caracteres.";
    if (!validEmail(data.email.trim())) errors.email = "Informe um e-mail válido, com no máximo 254 caracteres.";
    optionalText("company", 160);
    if (!data.consent) errors.consent = "Marque a autorização antes de continuar.";
  }
  return errors;
}

function payloadFor(data: Briefing) {
  return {
    kind: data.kind, problem: data.problem.trim(), features: data.features.trim(),
    reference: data.reference.trim(), use: data.use, platforms: [...data.platforms],
    deadline: data.deadline, budget: data.budget, complexity: data.complexity,
    integrations: data.integrations.trim(), technology: data.technology.trim(), notes: data.notes.trim(),
    name: data.name.trim(), email: data.email.trim(), company: data.company.trim(), consent: true as const,
  };
}

function summaryEntries(data: Briefing): [string, string][] {
  return stepFields.flat().map((key) => {
    const value = data[key];
    return [labels[key], typeof value === "boolean" ? (value ? "Autorizado" : "Ainda não autorizado")
      : Array.isArray(value) ? (value.join(", ") || "Não informado") : (value.trim() || "Não informado")];
  });
}

function readableBriefing(data: Briefing) {
  return `BRIEFING DE SOFTWARE\n\n${summaryEntries(data).map(([label, value]) => `${label}:\n${value}`).join("\n\n")}`;
}

function controls(form: HTMLFormElement) {
  return Array.from(form.elements).filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="mt-2 text-sm font-medium text-rose-200">{message}</p> : null;
}

type TextFieldProps = {
  id: string; name: TextKey; label: string; value: string; onChange: (value: string) => void;
  error?: string; hint?: string; placeholder?: string; required?: boolean;
  type?: "text" | "email" | "date"; multiline?: boolean; maxLength?: number; minLength?: number;
};
function TextField({ id, label, onChange, error, hint, multiline, ...props }: TextFieldProps) {
  const inputProps = {
    ...props, id, className: inputClass, autoComplete: "off",
    "aria-invalid": Boolean(error),
    "aria-describedby": [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-white">
        {label} <span className="font-normal text-sky-200">{props.required ? "*" : "(opcional)"}</span>
      </label>
      {multiline ? <textarea {...inputProps} rows={4} className={`${inputClass} min-h-28 resize-y`} /> : <input {...inputProps} />}
      {hint && <p id={`${id}-hint`} className="mt-2 text-xs leading-relaxed text-sky-200">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export default function RequestWizard({ onClose }: { onClose: () => void }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<{ reset: () => void } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadRef = useRef<{ url: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const activeRef = useRef(false);
  const closingRef = useRef(false);
  const busyRef = useRef(false);
  const receivedRef = useRef(false);
  const outsidePointerRef = useRef(false);
  const invalidFocusRef = useRef<keyof Briefing | null>(null);
  const [data, setData] = useState<Briefing>(initialBriefing);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState<"send" | "copy" | null>(null);
  const [actionError, setActionError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmation, setConfirmation] = useState<{ receipt?: string } | null>(null);
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const endpoint = safeEndpoint(site.requestEndpoint);
  const contactEmail = validEmail(site.contactEmail) ? site.contactEmail : "";
  const delivery = endpoint ? "endpoint" : contactEmail ? "email" : "download";
  const busy = pending !== null;
  const configurationInvalid = Boolean((site.requestEndpoint && !endpoint) || (site.contactEmail && !contactEmail));

  const releaseDownload = useCallback(() => {
    if (!downloadRef.current) return;
    clearTimeout(downloadRef.current.timer);
    URL.revokeObjectURL(downloadRef.current.url);
    downloadRef.current = null;
  }, []);

  const cancelPending = useCallback(() => {
    activeRef.current = false;
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    confettiRef.current?.reset();
    confettiRef.current = null;
    releaseDownload();
  }, [releaseDownload]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    cancelPending();
    onClose();
  }, [cancelPending, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const { scrollX, scrollY } = window;
    const body = document.body;
    const previousStyles = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width };
    activeRef.current = true;
    if (!dialog.open) dialog.showModal();
    Object.assign(body.style, { overflow: "hidden", position: "fixed", top: `-${scrollY}px`, left: `-${scrollX}px`, width: "100%" });
    headingRef.current?.focus({ preventScroll: true });
    return () => {
      cancelPending();
      if (dialog.open) dialog.close();
      Object.assign(body.style, previousStyles);
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [cancelPending]);

  // Keep the top-layer dialog open for AnimatePresence, but stop work as soon as exit starts.
  useEffect(() => {
    if (!isPresent) cancelPending();
  }, [isPresent, cancelPending]);

  useEffect(() => {
    if (!isPresent || !activeRef.current) return;
    const heading = confirmation ? successRef.current : headingRef.current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [step, confirmation, isPresent]);

  useEffect(() => {
    const key = invalidFocusRef.current;
    if (!key || !formRef.current || !activeRef.current) return;
    const control = controls(formRef.current).find((element) => element.name === key);
    if (control) {
      invalidFocusRef.current = null;
      control.setCustomValidity(errors[key] ?? "");
      control.focus();
      control.reportValidity();
    }
  }, [errors, step]);

  useEffect(() => {
    if (!confirmation || reducedMotion !== false || !isPresent) return;
    let cancelled = false;
    let reset: (() => void) | undefined;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled || !activeRef.current || !canvasRef.current) return;
      const burst = confetti.create(canvasRef.current, { resize: true, useWorker: false });
      confettiRef.current = burst;
      reset = () => burst.reset();
      void burst({ particleCount: 100, spread: 85, origin: { x: 0.5, y: 0.45 }, colors: ["#22d3ee", "#0284c7", "#a3e635"], disableForReducedMotion: true });
    }).catch(() => { /* A decorative effect must not affect a real confirmation. */ });
    return () => {
      cancelled = true;
      reset?.();
      confettiRef.current = null;
    };
  }, [confirmation, reducedMotion, isPresent]);

  function update<K extends keyof Briefing>(key: K, value: Briefing[K]) {
    if (busyRef.current || !activeRef.current || receivedRef.current) return;
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setStatus("");
    setActionError("");
    if (formRef.current) controls(formRef.current).filter((control) => control.name === key).forEach((control) => control.setCustomValidity(""));
  }

  function validate(all = false) {
    const form = formRef.current;
    if (!form) return false;
    const nextErrors: Errors = {};
    (all ? steps.map((_, index) => index) : [step]).forEach((index) => Object.assign(nextErrors, validateStep(data, index)));
    for (const control of controls(form)) {
      control.setCustomValidity("");
      if (!control.checkValidity()) {
        const key = control.name as keyof Briefing;
        nextErrors[key] ??= key === "deadline" ? "Informe uma data completa e válida ou limpe o campo." : "Confira este campo e informe um valor válido.";
      }
    }
    const firstKey = stepFields.flat().find((key) => nextErrors[key]);
    setErrors(nextErrors);
    if (firstKey) {
      invalidFocusRef.current = firstKey;
      setStep(stepFields.findIndex((fields) => fields.includes(firstKey)));
      return false;
    }
    return form.reportValidity();
  }

  function canAct() {
    return activeRef.current && isPresent && !busyRef.current && !receivedRef.current;
  }

  function downloadBriefing() {
    if (!canAct() || !validate(true)) return;
    setActionError("");
    setStatus("");
    let anchor: HTMLAnchorElement | undefined;
    try {
      releaseDownload();
      const blob = new Blob([JSON.stringify(payloadFor(data), null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      downloadRef.current = { url, timer: setTimeout(releaseDownload, 30000) };
      anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "briefing-software.json";
      anchor.hidden = true;
      dialogRef.current?.appendChild(anchor);
      anchor.click();
      setStatus("Briefing baixado. Ele ainda não foi enviado.");
    } catch {
      releaseDownload();
      setActionError("Não foi possível baixar o arquivo. Tente novamente ou copie o briefing.");
    } finally {
      anchor?.remove();
    }
  }

  async function copyBriefing() {
    if (!canAct() || !validate(true)) return;
    busyRef.current = true;
    setPending("copy");
    setStatus("");
    setActionError("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(readableBriefing(payloadFor(data)));
      if (activeRef.current) setStatus("Briefing copiado. Ele ainda não foi enviado.");
    } catch {
      if (activeRef.current) setActionError("Não foi possível copiar. Autorize o acesso à área de transferência ou use Baixar briefing.");
    } finally {
      busyRef.current = false;
      if (activeRef.current) setPending(null);
    }
  }

  function openEmail() {
    if (!canAct() || !contactEmail || !validate(true)) return;
    setActionError("");
    setStatus("");
    try {
      const subject = encodeURIComponent(`Briefing de software — ${data.kind}`);
      const body = encodeURIComponent(readableBriefing(payloadFor(data)));
      window.location.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${subject}&body=${body}`;
      setStatus("Rascunho aberto no seu aplicativo de e-mail. Confirme o envio por lá.");
    } catch {
      setActionError("Não foi possível abrir seu aplicativo de e-mail. Copie ou baixe o briefing e envie para o endereço informado acima.");
    }
  }

  async function sendBriefing() {
    if (!canAct() || !validate(true)) return;
    // Revalidate the public configuration before any network operation.
    const destination = safeEndpoint(site.requestEndpoint);
    if (!destination) {
      setActionError("O endereço de recebimento não é um HTTPS válido. Nenhum pedido foi enviado. Baixe ou copie o briefing.");
      return;
    }
    busyRef.current = true;
    setPending("send");
    setStatus("");
    setActionError("");
    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;
    timeoutRef.current = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    try {
      const response = await fetch(destination.href, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payloadFor(data)), credentials: "omit", cache: "no-store",
        redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal,
      });
      if (!response.ok) throw new Error(`O serviço respondeu com erro (${response.status}). O recebimento não foi confirmado.`);
      // Contract: a 2xx JSON response must contain { received: true, receipt?: string }.
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("received" in result) || result.received !== true) {
        throw new Error("O serviço não confirmou o recebimento do pedido.");
      }
      if (!activeRef.current || controllerRef.current !== controller) return;
      if (controller.signal.aborted) throw new Error("O recebimento não foi confirmado a tempo.");
      receivedRef.current = true;
      setConfirmation({ receipt: "receipt" in result && typeof result.receipt === "string" ? result.receipt.trim() || undefined : undefined });
    } catch (error) {
      if (!activeRef.current || controllerRef.current !== controller) return;
      const message = timedOut ? "O serviço não confirmou o recebimento em 15 segundos."
        : error instanceof SyntaxError ? "O serviço retornou uma resposta que não confirma o recebimento."
        : error instanceof TypeError ? "Não foi possível obter uma confirmação do serviço. Verifique sua conexão."
        : error instanceof Error ? error.message : "Não foi possível confirmar o recebimento.";
      setActionError(`${message} Você pode tentar novamente ou baixar o briefing. Se o serviço já tiver processado a solicitação, uma nova tentativa poderá duplicá-la.`);
    } finally {
      if (controllerRef.current === controller) {
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        controllerRef.current = null;
        busyRef.current = false;
        if (activeRef.current) setPending(null);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAct()) return;
    if (step < 4) {
      if (validate()) setStep((current) => current + 1);
    } else if (delivery === "endpoint") void sendBriefing();
    else if (delivery === "email") openEmail();
    else downloadBriefing();
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href], summary, [tabindex]"))
      .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function textField(name: TextKey, props: Omit<TextFieldProps, "id" | "name" | "label" | "value" | "onChange" | "error"> = {}) {
    return <TextField {...props} id={`${id}-${name}`} name={name} label={labels[name]} value={data[name]} onChange={(value) => update(name, value)} error={errors[name]} />;
  }

  function selectField(name: "budget" | "complexity", options: string[]) {
    return (
      <div>
        <label htmlFor={`${id}-${name}`} className="mb-2 block text-sm font-semibold">{labels[name]} <span className="font-normal text-sky-200">(opcional)</span></label>
        <select id={`${id}-${name}`} name={name} value={data[name]} onChange={(event) => update(name, event.target.value)} className={inputClass} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}>
          <option value="">Não informado</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <FieldError id={`${id}-${name}-error`} message={errors[name]} />
      </div>
    );
  }

  return (
    <motion.dialog
      ref={dialogRef} aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-privacy`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}
      onCancel={(event) => { event.preventDefault(); requestClose(); }} onKeyDown={trapFocus}
      onPointerDown={(event) => { outsidePointerRef.current = event.target === event.currentTarget; }}
      onClick={(event) => { if (event.target === event.currentTarget && outsidePointerRef.current) requestClose(); }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-slate-950/45 p-0 text-white outline-none backdrop-blur-md open:flex open:items-center open:justify-center [&::backdrop]:bg-transparent sm:p-5"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-50 h-full w-full" />
      <motion.section
        initial={reducedMotion ? false : { y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { y: 14, scale: 0.98 }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 32 }}
        className="relative flex h-full max-h-dvh w-full max-w-[760px] flex-col overflow-y-auto overscroll-contain border border-white/60 bg-gradient-to-br from-sky-300/60 via-blue-500/35 to-sky-900/70 p-1.5 shadow-[0_30px_100px_rgba(0,15,50,0.65),inset_0_1px_0_rgba(255,255,255,0.9)] sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[30px] sm:p-2"
      >
        <header className="sticky -top-1.5 z-20 flex shrink-0 items-center justify-between gap-3 rounded-t-xl border-b border-white/35 bg-gradient-to-b from-[#367bab] to-[#20578c] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:-top-2 sm:rounded-t-[22px]">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/50 bg-gradient-to-b from-white/25 to-sky-100/5 shadow-inner"><Code2 aria-hidden="true" className="size-5" /></span>
            <h2 id={`${id}-title`} className="text-sm font-semibold tracking-wide">Novo pedido de software</h2>
          </div>
          <button type="button" onClick={requestClose} aria-label="Fechar pedido de software" className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/35 bg-sky-950/25 hover:bg-sky-950/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="flex flex-1 flex-col rounded-b-xl border border-white/25 bg-[#07568b]/97 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:rounded-b-[22px]">
          <div className="px-5 pt-5 sm:px-8 sm:pt-7">
            <p id={`${id}-privacy`} className="flex items-start gap-2 text-xs leading-relaxed text-sky-100">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-200" />
              <span>Seu briefing fica apenas nesta janela até você escolher enviar. Não salvamos um rascunho no navegador.</span>
            </p>
            {!confirmation && (
              <div className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ${delivery === "download" ? "border-amber-200/40 bg-amber-100/10 text-amber-100" : "border-cyan-200/25 bg-cyan-200/5 text-sky-100"}`}>
                <div className="flex items-start gap-2.5">
                  <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    {delivery === "download" ? <p className="font-medium">{offlineNotice}</p> : endpoint ? (
                      <p>Destino do envio: <strong className="break-all text-cyan-100">{endpoint.hostname}</strong>. Seus dados serão compartilhados com esse serviço somente ao enviar.</p>
                    ) : <p>Destino do e-mail: <strong className="break-all text-cyan-100">{contactEmail}</strong>. Você revisa e confirma o envio no seu aplicativo de e-mail.</p>}
                    {endpoint && contactEmail && <p className="mt-1">Alternativa por e-mail: <strong className="break-all">{contactEmail}</strong>.</p>}
                    {configurationInvalid && <p className="mt-2 text-amber-100">Há um endereço de recebimento inválido na configuração. Esse endereço não será utilizado.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {confirmation ? (
            <div className="px-5 py-12 text-center sm:px-8">
              <motion.div initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl border border-cyan-100/70 bg-gradient-to-b from-cyan-200 to-sky-500 text-sky-950 shadow-[inset_0_2px_0_#fff,0_0_55px_rgba(34,211,238,0.2)]">
                <CheckCheck aria-hidden="true" className="size-12" />
              </motion.div>
              <h3 ref={successRef} tabIndex={-1} role="status" className="text-3xl font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Pedido recebido!</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-sky-100">O serviço <strong className="break-all">{endpoint?.hostname}</strong> confirmou o recebimento do seu briefing.</p>
              {confirmation.receipt && <p className="mt-5 text-sm text-sky-100">Protocolo: <code className="block break-all pt-1 font-semibold text-cyan-100">{confirmation.receipt}</code></p>}
              <button type="button" onClick={requestClose} className={`${primaryClass} mt-8`}>Voltar ao site <ArrowRight aria-hidden="true" className="size-4" /></button>
            </div>
          ) : (
            <>
              <nav aria-label="Etapas do pedido" className="px-5 pt-6 sm:px-8">
                <ol className="grid grid-cols-5 gap-1.5 sm:gap-3">
                  {steps.map((item, index) => (
                    <li key={item.label} aria-current={index === step ? "step" : undefined} className="min-w-0">
                      <div className={`mb-2 h-1 rounded-full ${index <= step ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "bg-sky-200/15"}`} />
                      <div className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 ${index === step ? "text-cyan-100" : index < step ? "text-sky-100" : "text-sky-200/80"}`}>
                        <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${index === step ? "bg-cyan-200 text-sky-950" : "border border-sky-200/35"}`}>
                          {index < step ? <Check aria-hidden="true" className="size-3.5" /> : <span aria-hidden="true">{index + 1}</span>}
                        </span>
                        <span className="text-[10px] font-medium min-[380px]:text-[11px] sm:text-xs"><span className="sr-only">Etapa {index + 1}: </span>{item.label}{index < step && <span className="sr-only">, concluída</span>}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
              <form ref={formRef} onSubmit={handleSubmit} noValidate autoComplete="off" aria-busy={busy} className="flex flex-1 flex-col px-5 pb-5 sm:px-8 sm:pb-7">
                <div className="pb-6 pt-7">
                  <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-cyan-200">ETAPA {step + 1} DE 5 {step === 3 ? "· OPCIONAL" : ""}</p>
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-cyan-200 sm:text-3xl">{steps[step].title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sky-100">{steps[step].description}</p>
                  {step !== 3 && <p className="mt-2 text-xs text-sky-200">* Campos obrigatórios</p>}
                </div>
                <fieldset disabled={busy || !isPresent} className="m-0 min-w-0 flex-1 border-0 p-0">
                  <legend className="sr-only">{steps[step].title}</legend>
                  <motion.div key={step} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} className="space-y-5">
                    {step === 0 && (
                      <fieldset aria-describedby={errors.kind ? `${id}-kind-error` : undefined} className="min-w-0">
                        <legend className="mb-3 text-sm font-semibold">Tipo de software *</legend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {kinds.map(({ label, icon: Icon }) => (
                            <label key={label} className="relative cursor-pointer">
                              <input type="radio" name="kind" value={label} required checked={data.kind === label} onChange={() => update("kind", label)} aria-describedby={errors.kind ? `${id}-kind-error` : undefined} className="peer sr-only" />
                              <span className="flex min-h-28 flex-col items-start justify-between gap-3 rounded-2xl border border-sky-200/25 bg-gradient-to-b from-sky-100/10 to-sky-100/0 p-4 text-sm font-medium text-sky-100 transition-colors hover:border-cyan-100/65 hover:bg-cyan-100/10 peer-checked:border-cyan-200 peer-checked:bg-cyan-200/15 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-cyan-200 peer-disabled:opacity-50 motion-reduce:transition-none">
                                <Icon aria-hidden="true" className="size-6 text-cyan-200" />{label}
                              </span>
                              {data.kind === label && <Check aria-hidden="true" className="absolute right-3 top-3 size-4 text-cyan-100" />}
                            </label>
                          ))}
                        </div>
                        <FieldError id={`${id}-kind-error`} message={errors.kind} />
                      </fieldset>
                    )}
                    {step === 1 && (
                      <>
                        {textField("problem", { required: true, multiline: true, maxLength: 4000, placeholder: "O que hoje dá trabalho ou poderia funcionar melhor?" })}
                        {textField("features", { required: true, multiline: true, maxLength: 4000, placeholder: "Quais tarefas o software precisa realizar? O que não pode faltar?" })}
                        {textField("reference", { maxLength: 500, placeholder: "Nome de um produto, uma ideia ou um endereço", hint: "Apenas texto: não abrimos links nem executamos o conteúdo informado." })}
                        <fieldset className="min-w-0">
                          <legend className="mb-2 text-sm font-semibold">Finalidade *</legend>
                          <div className="grid grid-cols-2 gap-3">
                            {["Pessoal", "Comercial"].map((value) => (
                              <label key={value} className="cursor-pointer">
                                <input type="radio" name="use" value={value} required checked={data.use === value} onChange={() => update("use", value)} aria-describedby={errors.use ? `${id}-use-error` : undefined} className="peer sr-only" />
                                <span className="flex min-h-12 items-center justify-center rounded-xl border border-sky-200/30 bg-sky-200/5 text-sm peer-checked:border-cyan-200 peer-checked:bg-cyan-200/15 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-cyan-200">{value}</span>
                              </label>
                            ))}
                          </div>
                          <FieldError id={`${id}-use-error`} message={errors.use} />
                        </fieldset>
                      </>
                    )}
                    {step === 2 && (
                      <fieldset aria-describedby={`${id}-platform-hint${errors.platforms ? ` ${id}-platforms-error` : ""}`} className="min-w-0">
                        <legend className="mb-2 text-sm font-semibold">Plataformas *</legend>
                        <p id={`${id}-platform-hint`} className="mb-4 text-sm text-sky-200">Selecione pelo menos uma opção.</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {platforms.map((platform, index) => (
                            <label key={platform} className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-cyan-200 motion-reduce:transition-none ${data.platforms.includes(platform) ? "border-cyan-200 bg-cyan-200/15 text-white" : "border-sky-200/30 bg-sky-100/5 text-sky-100 hover:bg-sky-100/10"}`}>
                              <input type="checkbox" name="platforms" value={platform} required={index === 0 && data.platforms.length === 0} checked={data.platforms.includes(platform)} onChange={(event) => update("platforms", event.target.checked ? [...data.platforms, platform] : data.platforms.filter((item) => item !== platform))} aria-invalid={Boolean(errors.platforms)} aria-describedby={errors.platforms ? `${id}-platforms-error` : `${id}-platform-hint`} className="size-4 shrink-0 accent-cyan-300" />
                              {platform}
                            </label>
                          ))}
                        </div>
                        <FieldError id={`${id}-platforms-error`} message={errors.platforms} />
                      </fieldset>
                    )}
                    {step === 3 && (
                      <>
                        <div className="grid gap-5 sm:grid-cols-2">
                          {textField("deadline", { type: "date" })}
                          {selectField("budget", budgets)}
                          {selectField("complexity", complexities)}
                          {textField("technology", { maxLength: 200, placeholder: "Ex.: React, Python ou sem preferência" })}
                        </div>
                        {textField("integrations", { multiline: true, maxLength: 1500, placeholder: "Ex.: planilhas, pagamentos, APIs ou sistemas existentes" })}
                        {textField("notes", { multiline: true, maxLength: 3000, placeholder: "Algum contexto ou detalhe que ainda não contamos?" })}
                      </>
                    )}
                    {step === 4 && (
                      <>
                        <div className="grid gap-5 sm:grid-cols-2">
                          {textField("name", { required: true, minLength: 2, maxLength: 100, placeholder: "Como podemos chamar você?" })}
                          {textField("email", { required: true, type: "email", maxLength: 254, placeholder: "voce@exemplo.com" })}
                        </div>
                        {textField("company", { maxLength: 160, placeholder: "Sua empresa ou organização" })}
                        <details className="group rounded-2xl border border-sky-200/30 bg-sky-950/45">
                          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-cyan-200 [&::-webkit-details-marker]:hidden">
                            Ver briefing completo <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-cyan-200 group-open:rotate-180" />
                          </summary>
                          <dl className="space-y-4 border-t border-sky-200/20 px-4 py-5">
                            {summaryEntries(data).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-cyan-200">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-sky-50 [overflow-wrap:anywhere]">{value}</dd></div>)}
                          </dl>
                        </details>
                        <div>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200/25 bg-sky-100/5 p-4 text-sm leading-relaxed">
                            <input type="checkbox" name="consent" required checked={data.consent} onChange={(event) => update("consent", event.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={`${id}-privacy${errors.consent ? ` ${id}-consent-error` : ""}`} className="mt-1 size-4 shrink-0 accent-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-cyan-200" />
                            <span>{delivery === "download" ? "Autorizo incluir meus dados de contato no briefing que eu escolher baixar ou copiar." : "Autorizo compartilhar este briefing e meus dados de contato com o destino informado, para avaliação do pedido e retorno."} *</span>
                          </label>
                          <FieldError id={`${id}-consent-error`} message={errors.consent} />
                        </div>
                        <p className="text-xs leading-relaxed text-sky-200">Evite senhas, chaves de acesso ou informações sensíveis. Baixar salva um arquivo no seu dispositivo; copiar coloca o conteúdo na sua área de transferência.</p>
                      </>
                    )}
                  </motion.div>
                </fieldset>

                <div className="mt-6 space-y-3" aria-live="polite" aria-atomic="true">
                  {status && <p role="status" className="rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-4 py-3 text-sm leading-relaxed text-cyan-50">{status}</p>}
                  {pending === "send" && <p role="status" className="text-sm leading-relaxed text-sky-100">Aguardando confirmação do serviço. Você pode fechar esta janela, mas interromper a espera não desfaz um pedido já recebido pelo serviço.</p>}
                </div>
                {actionError && <p role="alert" className="mt-3 rounded-xl border border-rose-200/40 bg-rose-200/10 px-4 py-3 text-sm leading-relaxed text-rose-100">{actionError}</p>}
                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-sky-200/20 pt-5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                  {step > 0 ? <button type="button" disabled={busy || !isPresent} onClick={() => { if (canAct()) { setErrors({}); setActionError(""); setStatus(""); setStep((current) => current - 1); } }} className={buttonClass}><ArrowLeft aria-hidden="true" className="size-4" />Voltar</button> : <span className="hidden text-xs text-sky-200 min-[400px]:block">Uma ideia. Muitas possibilidades.</span>}
                  <button type="submit" disabled={busy || !isPresent} className={`${primaryClass} min-[400px]:ml-auto`}>
                    {busy ? <><motion.span aria-hidden="true" animate={{ rotate: reducedMotion ? 0 : 360 }} transition={reducedMotion ? { duration: 0 } : { duration: 1, repeat: Infinity, ease: "linear" }}><LoaderCircle className="size-4" /></motion.span>{pending === "send" ? "Enviando..." : "Copiando..."}</>
                      : step < 4 ? <>Continuar <ArrowRight aria-hidden="true" className="size-4" /></>
                      : delivery === "endpoint" ? <>Enviar pedido <Send aria-hidden="true" className="size-4" /></>
                      : delivery === "email" ? <>Abrir no meu e-mail <Mail aria-hidden="true" className="size-4" /></>
                      : <>Baixar briefing <Download aria-hidden="true" className="size-4" /></>}
                  </button>
                </div>
                {step === 4 && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {delivery !== "download" && <button type="button" disabled={busy || !isPresent} onClick={downloadBriefing} className={buttonClass}><Download aria-hidden="true" className="size-4" />Baixar briefing</button>}
                      <button type="button" disabled={busy || !isPresent} onClick={() => void copyBriefing()} className={buttonClass}><Copy aria-hidden="true" className="size-4" />Copiar briefing</button>
                      {endpoint && contactEmail && <button type="button" disabled={busy || !isPresent} onClick={openEmail} className={buttonClass}><Mail aria-hidden="true" className="size-4" />Abrir no meu e-mail</button>}
                    </div>
                    {contactEmail && <p className="text-xs leading-relaxed text-sky-200">Se o aplicativo de e-mail não abrir ou cortar o texto, copie o briefing ou anexe o arquivo baixado. Abrir um rascunho não envia o pedido.</p>}
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </motion.section>
    </motion.dialog>
  );
}
