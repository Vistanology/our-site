"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import styles from "./invitation-form.module.css";

type InvitationFormProps = { endpoint?: string; contactEmail?: string };
type Fields = {
  name: string;
  contact: string;
  company: string;
  projectType: string;
  idea: string;
  budget: string;
  timeline: string;
  consent: boolean;
};
type Errors = Partial<Record<keyof Fields, string>>;
type Notice = { kind: "error" | "info" | "success"; text: string };

const projectTypes = [
  "Site",
  "Sistema",
  "Plataforma",
  "Automação",
  "Solução personalizada",
  "Ainda estou explorando uma ideia",
];
const initialFields: Fields = {
  name: "", contact: "", company: "", projectType: "", idea: "",
  budget: "", timeline: "", consent: false,
};
const textFields = [
  { key: "name", label: "Nome completo", placeholder: "Como podemos chamar você?", max: 100, required: true, autoComplete: "name" },
  { key: "contact", label: "E-mail ou WhatsApp", placeholder: "voce@exemplo.com ou +55 (11) 99999-9999", max: 254, required: true, autoComplete: "off" },
  { key: "company", label: "Empresa ou projeto", placeholder: "O nome da sua empresa ou ideia, se já tiver", max: 160, required: false, autoComplete: "organization" },
] as const;

function validEmail(value: string) {
  if (value.length > 254 || /[\s\r\n]/.test(value)) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && local.length <= 64 &&
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) &&
    !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") &&
    domain.length <= 253 && domain.includes(".") &&
    domain.split(".").every((part) => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(part));
}

function validPhone(value: string) {
  if (!/^\+?[\d(][\d ().-]*\d$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  const opens = (value.match(/\(/g) ?? []).length;
  const closes = (value.match(/\)/g) ?? []).length;
  return digits.length >= 10 && digits.length <= 15 && opens === closes && opens <= 1 &&
    (opens === 0 || /\(\d{1,5}\)/.test(value));
}

function safeEndpoint(value: string) {
  if (!/^https:\/\//i.test(value) || /[\\#\s]/.test(value)) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !value.slice(value.indexOf("//") + 2).split(/[/?]/)[0].includes("@") &&
      !url.hash ? url.href : "";
  } catch {
    return "";
  }
}

export default function InvitationForm({ endpoint = "", contactEmail = "" }: InvitationFormProps) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [fields, setFields] = useState<Fields>(initialFields);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<"send" | "copy" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const destination = safeEndpoint(endpoint);
  const invalidEndpoint = endpoint.length > 0 && !destination;
  const email = contactEmail.trim();
  const mode = destination ? "online" : !invalidEndpoint && validEmail(email) ? "email" : "local";

  useEffect(() => {
    mounted.current = true;
    const activeDownloads = downloads.current;
    return () => {
      mounted.current = false;
      controllerRef.current?.abort();
      activeDownloads.forEach((timer, url) => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      });
      activeDownloads.clear();
    };
  }, []);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice(null);
    setConfirmed(false);
  }

  function payload() {
    return {
      source: "convite-para-criar-sistema",
      name: fields.name.trim(),
      contact: fields.contact.trim(),
      company: fields.company.trim(),
      projectType: fields.projectType,
      idea: fields.idea.trim(),
      budget: fields.budget.trim(),
      timeline: fields.timeline.trim(),
      consent: fields.consent,
    };
  }

  function validate() {
    const data = payload();
    const next: Errors = {};
    if (data.name.length < 2 || data.name.length > 100) next.name = "Informe seu nome, entre 2 e 100 caracteres.";
    if (!validEmail(data.contact) && !validPhone(data.contact)) next.contact = "Informe um e-mail válido ou WhatsApp com DDD, entre 10 e 15 dígitos. Use apenas números e sinais de telefone.";
    if (data.company.length > 160) next.company = "Use até 160 caracteres.";
    if (!projectTypes.includes(data.projectType)) next.projectType = "Escolha o tipo de projeto, mesmo que ainda esteja explorando.";
    if (data.idea.length < 15 || data.idea.length > 3000) next.idea = "Conte sua ideia em pelo menos 15 e no máximo 3.000 caracteres.";
    if (data.budget.length > 120) next.budget = "Use até 120 caracteres.";
    if (data.timeline.length > 120) next.timeline = "Use até 120 caracteres.";
    if (!data.consent) next.consent = "Marque a autorização para continuar com esta opção.";
    setErrors(next);
    const first = (Object.keys(next) as (keyof Fields)[])[0];
    if (first) {
      const control = formRef.current?.elements.namedItem(first);
      if (control instanceof HTMLElement) control.focus();
      return false;
    }
    return true;
  }

  function download() {
    if (locked.current) return;
    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;
    try {
      const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json;charset=utf-8" });
      url = URL.createObjectURL(blob);
      link = document.createElement("a");
      link.href = url;
      link.download = "meu-convite.json";
      document.body.appendChild(link);
      link.click();
      const savedUrl = url;
      downloads.current.set(savedUrl, setTimeout(() => {
        URL.revokeObjectURL(savedUrl);
        downloads.current.delete(savedUrl);
      }, 30_000));
      setNotice({ kind: "info", text: "Download solicitado. Confira seus downloads. Esta ação não enviou seu convite; o arquivo contém os dados preenchidos." });
    } catch {
      if (url) URL.revokeObjectURL(url);
      setNotice({ kind: "error", text: "Não foi possível baixar o arquivo. Tente copiar o convite. Esta ação não enviou seus dados." });
    } finally {
      link?.remove();
    }
  }

  async function copy() {
    if (locked.current) return;
    locked.current = true;
    setBusy("copy");
    setNotice(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(JSON.stringify(payload(), null, 2));
      if (mounted.current) setNotice({ kind: "info", text: "Convite copiado. Esta ação não enviou seus dados. Cole apenas onde desejar compartilhá-los." });
    } catch {
      if (mounted.current) setNotice({ kind: "error", text: "Não foi possível copiar. O navegador pode ter bloqueado o acesso à área de transferência. Baixe o convite; esta ação não enviou seus dados." });
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || confirmed) return;
    setNotice(null);
    if (!validate()) return;
    if (mode === "local") {
      download();
      return;
    }
    const data = payload();
    if (mode === "email") {
      const body = [
        "Convite para criar um sistema", "", `Nome: ${data.name}`, `Contato: ${data.contact}`,
        `Empresa ou projeto: ${data.company || "Não informado"}`, `Tipo: ${data.projectType}`,
        "", "Ideia:", data.idea, "", `Expectativa de investimento: ${data.budget || "Não informada"}`,
        `Expectativa de início: ${data.timeline || "Não informada"}`, "",
        "Autorizo compartilhar estes dados por e-mail para conversar sobre este projeto.",
      ].join("\n");
      const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Meu convite para criar um sistema")}&body=${encodeURIComponent(body)}`;
      if (mailto.length > 1800) {
        setNotice({ kind: "error", text: "Seu convite ultrapassa o tamanho seguro para abrir no aplicativo de e-mail. Baixe ou copie o conteúdo e envie manualmente. Nenhum envio foi realizado; o recebimento não está confirmado." });
        return;
      }
      try {
        window.location.assign(mailto);
        setNotice({ kind: "info", text: "Solicitamos a abertura de um rascunho no seu aplicativo de e-mail. Revise e envie por lá. Nenhum envio foi realizado por este formulário; o recebimento não está confirmado. Se nada abrir, baixe ou copie o convite." });
      } catch {
        setNotice({ kind: "error", text: "Não foi possível abrir seu aplicativo de e-mail. Baixe ou copie o convite. Nenhum envio foi realizado; o recebimento não está confirmado." });
      }
      return;
    }
    locked.current = true;
    setBusy("send");
    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
    try {
      const response = await fetch(destination, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object" || !("received" in result) || result.received !== true) {
        throw new Error("Receipt not confirmed");
      }
      if (mounted.current) {
        const receipt = "receipt" in result && typeof result.receipt === "string" ? result.receipt.trim().slice(0, 200) : "";
        setConfirmed(true);
        setNotice({ kind: "success", text: `Recebimento confirmado.${receipt ? ` Comprovante: ${receipt}` : ""} Seus dados continuam aqui para consulta.` });
      }
    } catch {
      if (mounted.current) setNotice({ kind: "error", text: `${timedOut ? "O tempo de espera de 15 segundos terminou." : "Não foi possível obter uma confirmação do serviço."} O recebimento NÃO está confirmado. O convite pode ter chegado; tentar novamente pode duplicar o envio. Seus dados foram preservados neste formulário. Você também pode baixar ou copiar uma versão.` });
    } finally {
      clearTimeout(timer);
      if (controllerRef.current === controller) controllerRef.current = null;
      locked.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  function errorFor(key: keyof Fields) {
    return errors[key] ? <p className={styles.error} id={`${id}-${key}-error`} role="alert">{errors[key]}</p> : null;
  }

  function describedBy(key: keyof Fields, hint = false) {
    return [hint ? `${id}-${key}-hint` : "", errors[key] ? `${id}-${key}-error` : ""].filter(Boolean).join(" ") || undefined;
  }

  return (
    <form ref={formRef} className={styles.form} data-mode={mode} onSubmit={submit} noValidate aria-labelledby={`${id}-title`} aria-busy={busy === "send"}>
      <div className={styles.consoleBar}>
        <span className={styles.consoleDots} aria-hidden="true"><i /><i /><i /></span>
        <span className={styles.consoleLabel}>Canal de convite</span>
        <span className={styles.chip}>{mode === "online" ? "Envio ao serviço" : mode === "email" ? "Rascunho de e-mail" : "Rascunho local"}</span>
      </div>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>Seu próximo começo</span>
        <h3 id={`${id}-title`}>Vamos começar pelo primeiro contato.</h3>
        <p>Conte um pouco sobre o que você está imaginando. Não precisa ter tudo definido.</p>
      </div>
      <p className={styles.requiredNote}><span aria-hidden="true">*</span> Campos obrigatórios</p>
      <fieldset className={styles.fields} disabled={busy !== null}>
        <legend className={styles.srOnly}>Detalhes do seu convite</legend>
        {textFields.map((field) => (
          <div className={styles.field} key={field.key}>
            <label htmlFor={`${id}-${field.key}`}>{field.label} {field.required ? <span aria-hidden="true">*</span> : <span className={styles.optional}>(opcional)</span>}</label>
            <input id={`${id}-${field.key}`} name={field.key} type="text" value={fields[field.key]} onChange={(event) => update(field.key, event.target.value)} required={field.required} minLength={field.key === "name" ? 2 : undefined} maxLength={field.max} autoComplete={field.autoComplete} autoCapitalize={field.key === "contact" ? "none" : "words"} spellCheck={field.key !== "contact"} placeholder={field.placeholder} aria-invalid={!!errors[field.key]} aria-describedby={describedBy(field.key, field.key === "contact")} />
            {field.key === "contact" && <p className={styles.hint} id={`${id}-contact-hint`}>Um contato basta. Para WhatsApp, inclua o DDD e, se necessário, o código do país.</p>}
            {errorFor(field.key)}
          </div>
        ))}
        <div className={styles.field}>
          <label htmlFor={`${id}-projectType`}>O que você quer criar? <span aria-hidden="true">*</span></label>
          <select id={`${id}-projectType`} name="projectType" value={fields.projectType} onChange={(event) => update("projectType", event.target.value)} required aria-invalid={!!errors.projectType} aria-describedby={describedBy("projectType")}>
            <option value="" disabled>Selecione uma opção</option>
            {projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {errorFor("projectType")}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-idea`}>Conte sua ideia <span aria-hidden="true">*</span></label>
          <textarea id={`${id}-idea`} name="idea" rows={5} value={fields.idea} onChange={(event) => update("idea", event.target.value)} required minLength={15} maxLength={3000} placeholder="O que você gostaria de criar ou tornar mais simples? Para quem seria essa solução?" aria-invalid={!!errors.idea} aria-describedby={describedBy("idea", true)} />
          <p className={styles.hint} id={`${id}-idea-hint`}>De 15 a 3.000 caracteres. <span className={`${styles.counter} ${fields.idea.length > 2700 ? styles.counterWarn : ""}`}>{fields.idea.length.toLocaleString("pt-BR")} / 3.000</span></p>
          {errorFor("idea")}
        </div>
        <div className={styles.expectations}>
          <div className={styles.field}>
            <label htmlFor={`${id}-budget`}>Expectativa de investimento <span className={styles.optional}>(opcional)</span></label>
            <input id={`${id}-budget`} name="budget" type="text" value={fields.budget} onChange={(event) => update("budget", event.target.value)} maxLength={120} placeholder="Uma faixa, ou ainda em aberto" aria-invalid={!!errors.budget} aria-describedby={describedBy("budget")} />
            {errorFor("budget")}
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-timeline`}>Quando gostaria de começar? <span className={styles.optional}>(opcional)</span></label>
            <input id={`${id}-timeline`} name="timeline" type="text" value={fields.timeline} onChange={(event) => update("timeline", event.target.value)} maxLength={120} placeholder="Um mês, período ou sem pressa" aria-invalid={!!errors.timeline} aria-describedby={describedBy("timeline")} />
            {errorFor("timeline")}
          </div>
        </div>
        <div className={styles.delivery}>
          {mode === "online" ? <p>Seu convite será enviado somente ao clicar em “Enviar meu convite”. A confirmação depende da resposta do serviço.</p> : mode === "email" ? <p>Vamos preparar um rascunho para <strong>{email}</strong>. Você revisa e envia no seu aplicativo de e-mail.</p> : <p><strong>Recebimento online ainda não configurado.</strong> {invalidEndpoint ? "O endereço de envio configurado é inválido e não será utilizado. " : contactEmail ? "O endereço de e-mail configurado não é válido. " : ""}Você pode guardar seu convite e compartilhá-lo manualmente.</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.consent} htmlFor={`${id}-consent`}>
            <input id={`${id}-consent`} name="consent" type="checkbox" checked={fields.consent} onChange={(event) => update("consent", event.target.checked)} required aria-invalid={!!errors.consent} aria-describedby={describedBy("consent")} />
            <span>{mode === "online" ? "Autorizo o envio dos dados informados para que a equipe entre em contato sobre este projeto." : mode === "email" ? "Autorizo incluir estes dados em um rascunho de e-mail para conversar sobre este projeto. Eu decido quando enviá-lo." : "Estou ciente de que o arquivo terá os dados informados e ficará comigo, sem envio à equipe."} <span aria-hidden="true">*</span></span>
          </label>
          {errorFor("consent")}
        </div>
        <button className={styles.primary} type="submit" disabled={confirmed}>
          {busy === "send" && <span className={styles.busyWave} aria-hidden="true" />}
          {confirmed && <span className={styles.successRing} aria-hidden="true" />}
          <span>{busy === "send" ? "Aguardando confirmação…" : confirmed ? "Recebimento confirmado" : mode === "online" ? "Enviar meu convite" : mode === "email" ? "Abrir no meu e-mail" : "Baixar meu convite"}</span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
        </button>
      </fieldset>
      <div className={styles.noticeRegion} aria-live="polite" aria-atomic="true">
        {notice && <p className={`${styles.notice} ${notice.kind === "error" ? styles.noticeError : notice.kind === "success" ? styles.noticeSuccess : ""}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>}
      </div>
      <div className={styles.fallback}>
        <p>Prefere guardar um rascunho, mesmo incompleto? Baixar ou copiar não envia o convite.</p>
        <div className={styles.fallbackActions}>
          <button type="button" onClick={download} disabled={busy !== null}>{mode === "local" ? "Baixar rascunho JSON" : "Baixar meu convite"}</button>
          <button type="button" onClick={copy} disabled={busy !== null}>{busy === "copy" ? "Copiando…" : "Copiar convite"}</button>
        </div>
        <p className={styles.privacy}>Este formulário não salva seus dados neste dispositivo automaticamente. Ao sair ou recarregar a página, o preenchimento será perdido.</p>
      </div>
    </form>
  );
}
