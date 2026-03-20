import type { CaseStudy, SavedCase } from '@/lib/schema';
import {
  isFirebaseConfigured,
  saveCaseToFirebase,
  getAllSavedCases as getAllFromFirebase,
  toggleFavorite as toggleFavoriteFirebase,
  deleteSavedCase as deleteFromFirebase,
} from '@/lib/firebase';

const LOCAL_KEY = 'casegen_saved_cases';

// --- localStorage layer (always available) ---

function getLocalCases(): SavedCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCases(cases: SavedCase[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(cases));
}

// --- Public API: uses Firebase when configured, localStorage always ---

export async function saveCase(
  caseStudy: CaseStudy,
  discipline: string,
  course: string,
  tags?: string[]
): Promise<SavedCase> {
  const id = caseStudy.id || crypto.randomUUID();
  const saved: SavedCase = {
    ...caseStudy,
    id,
    savedAt: new Date().toISOString(),
    discipline,
    course,
    tags: tags ?? [],
    favorite: false,
  };

  // Always save to localStorage
  const local = getLocalCases();
  const existing = local.findIndex((c) => c.id === id);
  if (existing >= 0) {
    local[existing] = saved;
  } else {
    local.unshift(saved);
  }
  setLocalCases(local);

  // Also save to Firebase if configured
  if (isFirebaseConfigured()) {
    try {
      await saveCaseToFirebase(caseStudy, discipline, course, tags);
    } catch (err) {
      console.warn('[storage] Firebase save failed, localStorage used:', err);
    }
  }

  return saved;
}

export async function getAllCases(): Promise<SavedCase[]> {
  // Try Firebase first if configured
  if (isFirebaseConfigured()) {
    try {
      const firebaseCases = await getAllFromFirebase();
      // Sync to localStorage
      setLocalCases(firebaseCases);
      return firebaseCases;
    } catch (err) {
      console.warn('[storage] Firebase fetch failed, using localStorage:', err);
    }
  }

  return getLocalCases();
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  // Update localStorage
  const local = getLocalCases();
  const idx = local.findIndex((c) => c.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], favorite };
    setLocalCases(local);
  }

  // Update Firebase
  if (isFirebaseConfigured()) {
    try {
      await toggleFavoriteFirebase(id, favorite);
    } catch (err) {
      console.warn('[storage] Firebase favorite toggle failed:', err);
    }
  }
}

export async function deleteCase(id: string): Promise<void> {
  // Remove from localStorage
  const local = getLocalCases();
  setLocalCases(local.filter((c) => c.id !== id));

  // Remove from Firebase
  if (isFirebaseConfigured()) {
    try {
      await deleteFromFirebase(id);
    } catch (err) {
      console.warn('[storage] Firebase delete failed:', err);
    }
  }
}

export function getStorageMode(): 'firebase' | 'local' {
  return isFirebaseConfigured() ? 'firebase' : 'local';
}
