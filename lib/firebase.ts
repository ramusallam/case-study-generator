import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import type { CaseStudy, SavedCase } from '@/lib/schema';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const CASES_COLLECTION = 'savedCases';

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export async function saveCaseToFirebase(
  caseStudy: CaseStudy,
  discipline: string,
  course: string,
  tags?: string[]
): Promise<string> {
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
  await setDoc(doc(db, CASES_COLLECTION, id), {
    ...saved,
    _createdAt: Timestamp.now(),
  });
  return id;
}

export async function getAllSavedCases(): Promise<SavedCase[]> {
  const q = query(collection(db, CASES_COLLECTION), orderBy('_createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _createdAt, ...rest } = data;
    return { ...rest, id: d.id } as SavedCase;
  });
}

export async function getSavedCase(id: string): Promise<SavedCase | null> {
  const snap = await getDoc(doc(db, CASES_COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _createdAt, ...rest } = data;
  return { ...rest, id: snap.id } as SavedCase;
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  await updateDoc(doc(db, CASES_COLLECTION, id), { favorite });
}

export async function updateCaseTags(id: string, tags: string[]): Promise<void> {
  await updateDoc(doc(db, CASES_COLLECTION, id), { tags });
}

export async function deleteSavedCase(id: string): Promise<void> {
  await deleteDoc(doc(db, CASES_COLLECTION, id));
}

// --- Shared cases (for student sharing via short URLs) ---

const SHARED_COLLECTION = 'sharedCases';

export async function saveSharedCase(payload: Record<string, unknown>): Promise<string> {
  const id = crypto.randomUUID().slice(0, 8);
  await setDoc(doc(db, SHARED_COLLECTION, id), {
    ...payload,
    _sharedAt: Timestamp.now(),
  });
  return id;
}

export async function getSharedCase(id: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db, SHARED_COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _sharedAt, ...rest } = data;
  return rest;
}
