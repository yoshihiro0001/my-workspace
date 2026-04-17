import { useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Smartphone, Tablet, Monitor, RotateCw } from 'lucide-react';
import type { InspectorElement } from '../types';

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  mobile: '100%',
  tablet: '768px',
  desktop: '1280px',
};

export type PreviewHandle = {
  refresh: () => void;
};

type Props = {
  previewUrl: string;
  onElementSelected: (el: InspectorElement) => void;
  inspectMode: boolean;
  onInspectModeChange: (enabled: boolean) => void;
  /** Split layout: iframe fills width; hide device frame toggles */
  workspaceSplit?: boolean;
};

export const PreviewLayer = forwardRef<PreviewHandle, Props>(
  function PreviewLayer(
    { previewUrl, onElementSelected, inspectMode, onInspectModeChange, workspaceSplit = false },
    ref,
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [device, setDevice] = useState<DeviceMode>('mobile');
    const [refreshKey, setRefreshKey] = useState(0);

    useImperativeHandle(ref, () => ({
      refresh() {
        setRefreshKey((k) => k + 1);
      },
    }));

    useEffect(() => {
      function handleMessage(e: MessageEvent) {
        if (e.data?.type === 'element-selected') {
          onElementSelected(e.data as InspectorElement);
        }
      }
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onElementSelected]);

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage({ type: 'inspector-toggle', enabled: inspectMode }, '*');
    }, [inspectMode]);

    const toggleInspect = useCallback(() => {
      onInspectModeChange(!inspectMode);
    }, [inspectMode, onInspectModeChange]);

    const refresh = useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, []);

    const iframeWidth = workspaceSplit ? '100%' : DEVICE_WIDTHS[device];

    return (
      <div className="relative flex h-full min-h-0 flex-col bg-black">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/5 bg-black/80 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={toggleInspect}
              className={`flex h-9 min-h-[44px] w-9 min-w-[44px] items-center justify-center rounded-lg transition-colors md:h-8 md:min-h-0 md:w-8 md:min-w-0 ${
                inspectMode
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
              title="インスペクタ"
            >
              <Crosshair size={16} />
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={refresh}
              className="flex h-9 min-h-[44px] w-9 min-w-[44px] items-center justify-center rounded-lg bg-white/5 text-white/40 transition-colors hover:bg-white/10 md:h-8 md:min-h-0 md:w-8 md:min-w-0"
              title="リロード"
            >
              <RotateCw size={14} />
            </motion.button>
          </div>

          {!workspaceSplit && (
            <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
              {([
                ['mobile', Smartphone],
                ['tablet', Tablet],
                ['desktop', Monitor],
              ] as const).map(([d, Icon]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors md:h-7 md:w-7 ${
                    device === d ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          )}

          {workspaceSplit && <div className="flex-1" />}

          {inspectMode && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
              インスペクタ ON
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 items-stretch justify-stretch overflow-auto bg-neutral-950">
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={previewUrl}
            title="プレビュー"
            className="min-h-0 border-0 bg-white"
            style={{
              width: iframeWidth,
              maxWidth: '100%',
              height: '100%',
              minHeight: workspaceSplit ? '100%' : undefined,
              flex: workspaceSplit ? '1 1 auto' : undefined,
            }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    );
  },
);
