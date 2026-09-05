"use client";
import { createShapeId, Editor, Tldraw } from "tldraw";
export default function WarehouseCanvas() {
  function mount(editor: Editor) {
    const zones = [
      { id: "receiving", x: 80, y: 90, w: 240, h: 120, text: "PENERIMAAN\nDock A", color: "blue" as const },
      { id: "rack-a", x: 390, y: 70, w: 190, h: 165, text: "RAK A\nKertas", color: "violet" as const },
      { id: "rack-b", x: 640, y: 70, w: 190, h: 165, text: "RAK B\nTinta", color: "green" as const },
      { id: "production", x: 390, y: 300, w: 440, h: 125, text: "AREA PRODUKSI & PICKING", color: "orange" as const },
      { id: "dispatch", x: 80, y: 300, w: 240, h: 125, text: "PENGIRIMAN\nDock B", color: "light-green" as const },
    ];
    editor.createShapes(zones.map((zone) => ({ id: createShapeId(zone.id), type: "geo" as const, x: zone.x, y: zone.y, props: { geo: "rectangle" as const, w: zone.w, h: zone.h, color: zone.color, fill: "semi" as const, text: zone.text, size: "m" as const } })));
    editor.zoomToFit({ animation: { duration: 280 } });
  }
  return <Tldraw persistenceKey="stockflow-warehouse-map" onMount={mount} />;
}
