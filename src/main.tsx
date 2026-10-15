import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { auth } from './config/firebase';
import { completeFirebaseAuthRedirect } from './db/firebaseAuthRedirect';

const rootEl = document.getElementById('root')!;

async function bootstrap() {
  if (auth) {
    try {
      await completeFirebaseAuthRedirect(auth);
    } catch {
      /* lagres i sessionStorage og vises under Innstillinger */
    }
  }
  createRoot(rootEl).render(<App />);
}

void bootstrap();
