import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProjectList } from './components/ProjectList';
import { WorkspaceView } from './components/WorkspaceView';
import { SettingsView } from './components/SettingsView';
import { useSettings } from './hooks/useSettings';
import type { Project } from './types';

type Screen =
  | { kind: 'home' }
  | { kind: 'workspace'; project: Project }
  | { kind: 'settings' };

export default function App() {
  const { settings, ready: settingsReady, update: updateSettings, reset: resetSettings } = useSettings();
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });

  if (!settingsReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black text-white">
      <AnimatePresence mode="wait">
        {screen.kind === 'workspace' && (
          <motion.div
            key={`ws-${screen.project.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <WorkspaceView
              project={screen.project}
              settings={settings}
              onBack={() => setScreen({ kind: 'home' })}
            />
          </motion.div>
        )}

        {screen.kind === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <SettingsView
              settings={settings}
              onUpdate={updateSettings}
              onReset={resetSettings}
              onBack={() => setScreen({ kind: 'home' })}
            />
          </motion.div>
        )}

        {screen.kind === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectList
              onOpenProject={(p) => setScreen({ kind: 'workspace', project: p })}
              onOpenSettings={() => setScreen({ kind: 'settings' })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
