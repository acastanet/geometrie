import { useEffect, useRef } from "react";

interface GeoGebraRendererProps {
  containerId: string;
  commands: string[];
  width?: number;
  height?: number;
  coordSystem?: [number, number, number, number];
  appName?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GGBApplet: any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GgbApi = any;

const GGB_BASE_CONFIG = {
  showToolBar: false,
  showMenuBar: false,
  showAlgebraInput: false,
  enableShiftDragZoom: true,
  enableLabelDrags: false,
  showResetIcon: false,
  enableRightClick: false,
  preventFocus: true,
};

const DEFAULT_COORD_SYSTEM: [number, number, number, number] = [-6, 6, -6, 6];

export default function GeoGebraRenderer({
  containerId,
  commands,
  width = 240,
  height = 240,
  coordSystem = DEFAULT_COORD_SYSTEM,
  appName = "graphing",
}: GeoGebraRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.GGBApplet) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const [xMin, xMax, yMin, yMax] = coordSystem;

    const params = {
      ...GGB_BASE_CONFIG,
      appName,
      width,
      height,
      appletOnLoad(api: GgbApi) {
        api.setPerspective("G");
        api.setCoordSystem(xMin, xMax, yMin, yMax);
        api.setGridVisible(true);
        commands.forEach((cmd) => api.evalCommand(cmd));
      },
    };

    const applet = new window.GGBApplet(params, true);
    applet.inject(container);

    return () => {
      container.innerHTML = "";
    };
  }, [containerId, commands]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="overflow-hidden"
    />
  );
}
