import { useCallback, useEffect, useRef } from "react";

/**
 * useFormDraft – menyimpan state form ke sessionStorage secara otomatis
 * setiap kali form berubah, sehingga jika modal ditutup tidak sengaja,
 * data yang sudah diisi bisa dipulihkan saat modal dibuka lagi.
 *
 * @param key   – kunci unik di sessionStorage (mis. "draft_ticket")
 * @param form  – nilai form saat ini
 * @param setForm – setter form
 * @param open  – apakah modal sedang terbuka
 * @param shouldRestore – kondisi kapan draft harus dipulihkan (default: true)
 */
export function useFormDraft<T extends object>(
  key: string,
  form: T,
  setForm: (v: T | ((prev: T) => T)) => void,
  open: boolean,
  shouldRestore: boolean = true
) {
  const isFirstOpen = useRef(true);

  // Simpan ke sessionStorage setiap kali form berubah (hanya saat modal terbuka)
  useEffect(() => {
    if (!open) return;
    sessionStorage.setItem(key, JSON.stringify(form));
  }, [key, form, open]);

  // Pulihkan draft saat modal pertama kali dibuka (jika ada & shouldRestore)
  useEffect(() => {
    if (!open) {
      isFirstOpen.current = true;
      return;
    }
    if (!isFirstOpen.current) return;
    isFirstOpen.current = false;

    if (!shouldRestore) return;

    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as T;
      setForm((prev) => ({ ...prev, ...saved }));
    } catch {
      // abaikan jika data korup
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Panggil ini setelah submit berhasil untuk menghapus draft */
  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
