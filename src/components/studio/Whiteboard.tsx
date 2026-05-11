import { useRef, useState } from "react";
import { Palette, Eraser, RotateCcw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhiteboardProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
  onSaveAnnotation?: (annotatedImage: string) => Promise<void>;
}

export function Whiteboard({ imageUrl, imageName, onClose, onSaveAnnotation }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(3);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [saving, setSaving] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (mode === "draw") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = "destination-out";
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const annotatedImage = canvas.toDataURL("image/png");
      await onSaveAnnotation?.(annotatedImage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-black to-transparent flex items-center justify-between p-6">
        <div>
          <h2 className="text-white text-xl font-semibold">Annotate: {imageName}</h2>
          <p className="text-white/60 text-sm mt-1">Draw and mark up your image</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Tools */}
      <div className="bg-slate-900 border-b border-slate-800 flex items-center gap-3 p-4 flex-wrap">
        {/* Mode */}
        <div className="flex gap-2 border-r border-slate-700 pr-4">
          <Button
            variant={mode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("draw")}
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            Draw
          </Button>
          <Button
            variant={mode === "erase" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("erase")}
            className="gap-2"
          >
            <Eraser className="w-4 h-4" />
            Erase
          </Button>
        </div>

        {/* Color picker */}
        {mode === "draw" && (
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <label className="text-white text-sm">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Brush size */}
        <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
          <label className="text-white text-sm">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 cursor-pointer"
          />
          <span className="text-white text-xs">{brushSize}px</span>
        </div>

        {/* Clear */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="gap-2 ml-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </Button>

        {/* Save */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div className="relative">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain"
            id="background"
          />
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="absolute inset-0 cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
}
