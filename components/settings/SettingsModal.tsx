"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X, LogOut } from "lucide-react";
import { DataActions } from "@/components/settings/DataActions";
import { SegmentedSetting } from "@/components/settings/SegmentedSetting";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAnimatedRate } from "@/hooks/useAnimatedRate";
import { useMoneyMapStore } from "@/store/moneyMapStore";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import type { CalendarSystem, Currency } from "@/types/money";

function formatRate(value: number | null) {
  if (!value) return "Not loaded";
  return `${value.toLocaleString("en-US")} T`;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const day = date.toDateString() === today.toDateString() ? "Today" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} ${time}`;
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useMoneyMapStore((state) => state.settings);
  const exchangeRate = useMoneyMapStore((state) => state.exchangeRate);
  const updateSettings = useMoneyMapStore((state) => state.updateSettings);
  const fetchExchangeRate = useMoneyMapStore((state) => state.fetchExchangeRate);
  const shouldAnimate = settings.softAnimations;
  const user = useAuthStore((state) => state.user);
  const [authOpen, setAuthOpen] = useState(false);
  const { displayed: displayedRate } = useAnimatedRate(exchangeRate.usdToToman);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2f333b]/14 sm:px-4 sm:py-10 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldAnimate ? 0.16 : 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="flex max-h-[85dvh] sm:max-h-[calc(100vh-80px)] w-full sm:w-[420px] sm:max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-t-[34px] sm:rounded-[34px] bg-[#fbfaf7] shadow-[0_30px_80px_rgba(76,74,68,0.2),0_1px_0_rgba(255,255,255,0.85)_inset]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            initial={{ opacity: 0, scale: shouldAnimate ? 0.96 : 1, y: shouldAnimate ? 14 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldAnimate ? 0.98 : 1, y: shouldAnimate ? 10 : 0 }}
            transition={{ duration: shouldAnimate ? 0.18 : 0, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4">
              <h2 id="settings-title" className="text-[25px] font-semibold leading-none text-[#30333b]">
                Settings
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-white text-[#8e92a0] shadow-[inset_0_0_0_1px_#ece8df] transition hover:bg-[#f4f1eb] hover:text-[#626677] active:scale-95"
                aria-label="Close settings"
              >
                <X className="size-5" strokeWidth={2.1} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto pb-2">
              <SettingsSection title="Account">
                {user ? (
                  <>
                    <SettingsRow label="Signed in as" detail={user.email ?? user.id}>
                      <button
                        type="button"
                        onClick={() => void supabase.auth.signOut()}
                        className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-[#c64141] shadow-[inset_0_0_0_1px_#ebe7dd] transition hover:bg-[#fbfaf7]"
                      >
                        <LogOut className="size-3.5" strokeWidth={2.1} />
                        Sign out
                      </button>
                    </SettingsRow>
                    <SettingsRow compact label="Sync status" detail="Changes are backed up automatically" />
                  </>
                ) : (
                  <SettingsRow label="Cloud sync" detail="Sign in to back up across devices">
                    <button
                      type="button"
                      onClick={() => setAuthOpen(true)}
                      className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-[#6b665d] shadow-[inset_0_0_0_1px_#ebe7dd] transition hover:bg-[#fbfaf7]"
                    >
                      Sign in
                    </button>
                  </SettingsRow>
                )}
              </SettingsSection>

              <SettingsSection title="Currency">
                <SegmentedSetting<Currency>
                  value={settings.defaultCurrency}
                  ariaLabel="Default currency"
                  options={[
                    { value: "TOMAN", label: "🇮🇷 Toman" },
                    { value: "USD", label: "🇺🇸 USD" }
                  ]}
                  onChange={(defaultCurrency) => updateSettings({ defaultCurrency })}
                />
                <SettingsRow
                  compact
                  label={`USD rate: ${formatRate(displayedRate)}`}
                  detail={exchangeRate.fetchedAt ? `Updated: ${formatUpdatedAt(exchangeRate.fetchedAt)}` : undefined}
                >
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-[#6b665d] shadow-[inset_0_0_0_1px_#ebe7dd] transition hover:bg-[#fbfaf7] disabled:opacity-60"
                    disabled={exchangeRate.isLoading}
                    onClick={() => void fetchExchangeRate()}
                  >
                    <RefreshCw className={`size-3.5 ${exchangeRate.isLoading ? "animate-spin" : ""}`} strokeWidth={2.1} />
                    Refresh
                  </button>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection title="Calendar">
                <SegmentedSetting<CalendarSystem>
                  value={settings.calendarSystem}
                  ariaLabel="Calendar system"
                  options={[
                    { value: "shamsi", label: "Shamsi" },
                    { value: "gregorian", label: "Gregorian" }
                  ]}
                  onChange={(calendarSystem) => updateSettings({ calendarSystem })}
                />
              </SettingsSection>

              <SettingsSection title="Canvas">
                <SettingsToggle label="Show canvas dots" checked={settings.showCanvasDots} onChange={(showCanvasDots) => updateSettings({ showCanvasDots })} />
                <SettingsToggle label="Soft animations" checked={settings.softAnimations} onChange={(softAnimations) => updateSettings({ softAnimations })} />
              </SettingsSection>

              <SettingsSection title="Data">
                <DataActions />
              </SettingsSection>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
  </>
  );
}
