"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./DompetWithdraw.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  ChevronRight,
  Banknote,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  walletService,
  formatRupiah,
  formatTxDate,
  type Wallet,
  type Transaction,
} from "../../../services/walletService";

type WalletData = {
  wallet: Wallet;
  transactions: Transaction[];
};

// ── Bank list ──────────────────────────────────────────────────────────────
const BANKS = [
  "Bank Central Asia (BCA)",
  "Bank Mandiri",
  "Bank Negara Indonesia (BNI)",
  "Bank Rakyat Indonesia (BRI)",
  "CIMB Niaga",
  "Bank Danamon",
  "Permata Bank",
  "Bank Syariah Indonesia (BSI)",
  "Bank Mega",
  "Bank BTN",
];

const MIN_WITHDRAW = 1;

function statusBadge(status: Transaction["status"]) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Selesai", cls: styles.badgeCompleted },
    pending:   { label: "Diproses", cls: styles.badgePending },
    failed:    { label: "Gagal", cls: styles.badgeFailed },
    cancelled: { label: "Dibatalkan", cls: styles.badgeCancelled },
  };
  return map[status] ?? { label: status, cls: "" };
}

// ── Bank name shortener ────────────────────────────────────────────────────
function shortBank(desc?: string) {
  if (!desc) return "—";
  if (desc.includes("BCA")) return "BCA";
  if (desc.includes("Mandiri")) return "Mandiri";
  if (desc.includes("BNI")) return "BNI";
  if (desc.includes("BRI")) return "BRI";
  if (desc.includes("BSI")) return "BSI";
  return desc.split(" ")[0];
}

export default function WithdrawPage() {
  // ── Auth ───────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // ── Wallet data ────────────────────────────────────────────────────────
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // ── Submit state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Load auth from localStorage ────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("lekan_user");
    const tok = localStorage.getItem("lekan_token");
    if (raw && tok) {
      const { id } = JSON.parse(raw);
      setUserId(id);
      setToken(tok);
    } else {
      setWalletError("Sesi tidak ditemukan. Silakan login ulang.");
      setLoadingWallet(false);
    }
  }, []);

  // ── Fetch wallet ───────────────────────────────────────────────────────
  const fetchWallet = useCallback(() => {
    if (!userId || !token) return;
    setLoadingWallet(true);
    walletService
      .getWallet(userId, token)
      .then(setWalletData)
      .catch((e: Error) => setWalletError(e.message))
      .finally(() => setLoadingWallet(false));
  }, [userId, token]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // ── Derived values ─────────────────────────────────────────────────────
  const balance = walletData?.wallet.balance ?? 0;
  const pendingAmount = walletData?.wallet.pending ?? 0;
  const numericAmount = Number(amount.replace(/\D/g, ""));
  const isValidAmount =
    numericAmount >= MIN_WITHDRAW && numericAmount <= balance;

  const pendingTransactions = walletData?.transactions.filter(
    (tx: Transaction) => tx.type === "withdrawal" && tx.status === "pending"
  ) ?? [];
  const recentHistory = walletData?.transactions.filter(
    (tx: Transaction) => tx.type === "withdrawal" && tx.status === "completed"
  ) ?? [];

  // ── Polling for pending withdrawals ──────────────────────────────────
  useEffect(() => {
    if (!userId || !token) return;

    const hasPendingWithdrawals = walletData?.transactions.some(
      (tx: Transaction) => tx.type === "withdrawal" && tx.status === "pending"
    ) ?? false;

    if (!hasPendingWithdrawals) return;

    const interval = setInterval(() => {
      walletService
        .getWallet(userId, token)
        .then(setWalletData)
        .catch(console.error);
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, token, walletData?.transactions]);

  // ── Handle amount input ────────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setAmount(digits);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const setMaxAmount = () => {
    setAmount(String(balance));
  };

  // ── Handle submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!userId || !token) {
      setErrorMsg("Sesi tidak ditemukan. Silakan login ulang.");
      return;
    }
    
    if (numericAmount === 0 || isNaN(numericAmount)) {
      setErrorMsg("Masukkan jumlah penarikan.");
      return;
    }
    
    if (balance <= 0) {
      setErrorMsg("Saldo Anda kosong.");
      return;
    }
    
    if (numericAmount < MIN_WITHDRAW) {
      setErrorMsg(`Jumlah penarikan minimal adalah ${formatRupiah(MIN_WITHDRAW)}.`);
      return;
    }
    
    if (numericAmount > balance) {
      setErrorMsg("Saldo tidak mencukupi.");
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMsg("Nomor rekening wajib diisi.");
      return;
    }
    if (!accountHolder.trim()) {
      setErrorMsg("Nama pemilik rekening wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const description = `Penarikan ke ${bankName} - ${accountNumber} a.n. ${accountHolder}`;
      await walletService.withdraw(userId, token, numericAmount, description);
      setSuccessMsg(`Berhasil mengajukan penarikan ${formatRupiah(numericAmount)} ke ${bankName}.`);
      setAmount("");
      setAccountNumber("");
      setAccountHolder("");
      fetchWallet(); // refresh saldo
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />
        <main className={styles.main}>

          {/* ── Page Title ── */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Tarik Dana</h1>
              <p className={styles.pageSubtitle}>
                Cairkan penghasilan lelang Anda ke rekening bank.
              </p>
            </div>
          </div>

          {/* ── Loading wallet ── */}
          {loadingWallet && (
            <div className={styles.centered}>
              <Loader2 size={32} className={styles.spinner} />
            </div>
          )}

          {/* ── Wallet error ── */}
          {walletError && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} /> {walletError}
            </div>
          )}

          {/* ── Main Content ── */}
          {!loadingWallet && walletData && (
            <div className={styles.contentGrid}>

              {/* ══ LEFT COLUMN ══════════════════════════════════════════════ */}
              <div className={styles.leftCol}>

                {/* ── Balance Card ── */}
                <div className={styles.balanceCard}>
                  <div className={styles.balanceTopRow}>
                    <span className={styles.balanceLabel}>TERSEDIA UNTUK DITARIK</span>
                    <div className={styles.balanceIconWrap}>
                      <Banknote size={22} color="rgba(255,255,255,0.5)" />
                    </div>
                  </div>
                  <div className={styles.balanceAmount}>
                    {formatRupiah(balance)}
                  </div>
                  <div className={styles.balanceMeta}>
                    <span className={styles.balanceTrend}>
                      <TrendingUp size={13} />
                      Saldo aktif
                    </span>
                    <span className={styles.balanceVerified}>
                      <CheckCircle2 size={13} />
                      Akun Terverifikasi
                    </span>
                  </div>
                </div>

                {/* ── Oceanic Ledger box ── */}
                <div className={styles.ledgerBox}>
                  <div className={styles.ledgerIconWrap}>
                    <Shield size={18} color="#1e40af" />
                  </div>
                  <div>
                    <p className={styles.ledgerTitle}>Oceanic Ledger</p>
                    <p className={styles.ledgerDesc}>
                      Dana Anda dilindungi oleh sistem multi-sig Maritime Exchange.
                      Aman, cepat, dan transparan.
                    </p>
                  </div>
                </div>

                {/* ── Amount Input ── */}
                <div className={styles.formCard}>
                  <label className={styles.formLabel}>JUMLAH PENARIKAN</label>
                  <div className={styles.amountInputWrap}>
                    <span className={styles.currencyPrefix}>Rp</span>
                    <input
                      type="text"
                      className={styles.amountInput}
                      placeholder="0.00"
                      value={amount === "" ? "" : Number(amount).toLocaleString("id-ID")}
                      onChange={handleAmountChange}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      className={styles.maxBtn}
                      onClick={setMaxAmount}
                    >
                      Maks
                    </button>
                  </div>
                  <p className={styles.amountHint}>
                    Min. {formatRupiah(MIN_WITHDRAW)}
                  </p>

                  {/* ── Bank Destination ── */}
                  <div className={styles.bankSection}>
                    <div className={styles.bankSectionTitle}>
                      <Banknote size={17} />
                      Rekening Tujuan
                    </div>

                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Nama Bank</label>
                        <select
                          className={styles.selectInput}
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                        >
                          {BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Nomor Rekening</label>
                        <input
                          type="text"
                          className={styles.textInput}
                          placeholder="0000 0000 0000"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                          maxLength={20}
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.fieldLabel}>Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="Masukkan nama sesuai buku tabungan"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ── Processing Time note ── */}
                  <div className={styles.processingNote}>
                    <Clock size={14} className={styles.processingNoteIcon} />
                    <p>
                      <strong>Waktu Proses:</strong> Sebagian besar penarikan
                      diproses dalam <strong>1–4 jam</strong> pada jam kerja.
                      Transfer antar bank bisa memakan waktu hingga 24 jam.
                    </p>
                  </div>

                  {/* ── Feedback messages ── */}
                  {errorMsg && (
                    <div className={styles.feedbackError}>
                      <XCircle size={15} /> {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className={styles.feedbackSuccess}>
                      <CheckCircle2 size={15} /> {successMsg}
                    </div>
                  )}

                  {/* ── Submit button ── */}
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><Loader2 size={16} className={styles.spinnerBtn} /> Memproses…</>
                    ) : (
                      <><Send size={16} /> Proses Penarikan</>
                    )}
                  </button>
                </div>
              </div>

              {/* ══ RIGHT COLUMN ═════════════════════════════════════════════ */}
              <div className={styles.rightCol}>

                {/* ── In Progress (pending) ── */}
                <div className={styles.rightCard}>
                  <div className={styles.rightCardHeader}>
                    <span className={styles.rightCardTitle}>Sedang Diproses</span>
                    {pendingTransactions.length > 0 && (
                      <span className={styles.pendingBadge}>
                        {pendingTransactions.length} PENDING
                      </span>
                    )}
                  </div>

                  {pendingTransactions.length === 0 ? (
                    <p className={styles.emptyHint}>Tidak ada penarikan yang sedang diproses.</p>
                  ) : (
                    pendingTransactions.map((tx: Transaction) => (
                      <div key={tx.id} className={styles.pendingItem}>
                        <div className={styles.pendingItemTop}>
                          <span className={styles.pendingTxId}>
                            TXID-{tx.id.slice(0, 6).toUpperCase()}
                          </span>
                          <Clock size={14} color="#ea580c" />
                        </div>
                        <div className={styles.pendingTxAmount}>
                          {formatRupiah(tx.amount)}
                        </div>
                        <div className={styles.pendingTxMeta}>
                          {shortBank(tx.description)} &bull;{" "}
                          {formatTxDate(tx.created_at)}
                          <span className={styles.verifyingTag}>MEMVERIFIKASI…</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Pending wallet amount ── */}
                {pendingAmount > 0 && (
                  <div className={styles.pendingWalletBox}>
                    <span className={styles.pendingWalletLabel}>Dana Tertahan</span>
                    <span className={styles.pendingWalletAmount}>
                      {formatRupiah(pendingAmount)}
                    </span>
                  </div>
                )}

                {/* ── Recent History ── */}
                <div className={styles.rightCard}>
                  <div className={styles.rightCardHeader}>
                    <span className={styles.rightCardTitle}>Riwayat Terkini</span>
                  </div>

                  {recentHistory.length === 0 ? (
                    <p className={styles.emptyHint}>Belum ada riwayat penarikan.</p>
                  ) : (
                    <>
                      {recentHistory.slice(0, 3).map((tx: Transaction) => {
                        const badge = statusBadge(tx.status);
                        return (
                          <div key={tx.id} className={styles.historyItem}>
                            <div className={styles.historyIconWrap}>
                              <CheckCircle2 size={15} color="#16a34a" />
                            </div>
                            <div className={styles.historyInfo}>
                              <span className={styles.historyAmount}>
                                {formatRupiah(tx.amount)}
                              </span>
                              <span className={styles.historyMeta}>
                                {shortBank(tx.description)} &bull;{" "}
                                {formatTxDate(tx.created_at)}
                              </span>
                            </div>
                            <div className={styles.historyRight}>
                              <span className={`${styles.historyBadge} ${badge.cls}`}>
                                {badge.label}
                              </span>
                              <ChevronRight size={14} color="#cbd5e1" />
                            </div>
                          </div>
                        );
                      })}
                      <button className={styles.viewLedgerBtn}>
                        Lihat Semua Riwayat
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
