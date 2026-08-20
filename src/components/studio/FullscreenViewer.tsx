import { MediaViewer } from "@/components/MediaViewer";

interface FullscreenViewerProps {
  item: {
    url: string;
    name: string;
    type: "image" | "video" | "pdf" | "audio" | "file" | string;
  };
  onClose: () => void;
  autoPlay?: boolean;
}

/** Thin wrapper kept for backwards compatibility — modern chrome lives in MediaViewer. */
export function FullscreenViewer({ item, onClose }: FullscreenViewerProps) {
  return (
    <MediaViewer
      item={{ url: item.url, name: item.name, kind: item.type, subtitle: `${item.type} preview` }}
      onClose={onClose}
    />
  );
}

export default FullscreenViewer;
