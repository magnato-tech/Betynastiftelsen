import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

export function publicMediaObjectPath(id: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'bilde.jpg';
  return `public/media/${id}-${safe}`;
}

export async function uploadPublicMediaFile(file: File, objectPath: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage er ikke konfigurert');
  }
  const objectRef = ref(storage, objectPath);
  await uploadBytes(objectRef, file, { contentType: file.type || 'application/octet-stream' });
  return getDownloadURL(objectRef);
}

export async function deletePublicMediaFile(objectPath: string): Promise<void> {
  if (!storage) return;
  try {
    await deleteObject(ref(storage, objectPath));
  } catch {
    /* fil kan allerede være borte */
  }
}
