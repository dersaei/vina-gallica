import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./ResponsivePreview.css";

type Device = "desktop" | "mobile";

const WIDTHS: Record<Device, number> = {
  desktop: 1000,
  mobile: 390,
};

interface Props {
  labels: { desktop: string; mobile: string };
  children: ReactNode;
}

// Renders children inside an <iframe> whose width we control, so the card's
// own @media queries resolve against the iframe viewport — a faithful
// responsive preview. Parent stylesheets are mirrored into the iframe.
export default function ResponsivePreview({ labels, children }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Base document: reset margins, inherit page background.
    doc.documentElement.style.height = "100%";
    doc.body.style.margin = "0";
    doc.body.style.padding = "16px";
    doc.body.style.background = "transparent";
    doc.body.style.fontFamily = "inherit";

    // Mirror parent stylesheets (linked + inline) so pcp-* rules + fonts apply.
    const mirror = () => {
      // Clear previously mirrored nodes.
      doc.head
        .querySelectorAll("[data-rp-mirror]")
        .forEach((n) => n.remove());
      document
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((node) => {
          const clone = node.cloneNode(true) as HTMLElement;
          clone.setAttribute("data-rp-mirror", "");
          doc.head.appendChild(clone);
        });
      // Carry over CSS custom properties defined on :root (design tokens).
      const rootStyle = getComputedStyle(document.documentElement);
      const tokens = [
        "--color-sand",
        "--color-elegant-black",
        "--color-gold",
        "--font-heading",
        "--font-label",
        "--font-hero",
        "--font-extra",
      ];
      const decl = tokens
        .map((t) => {
          const v = rootStyle.getPropertyValue(t);
          return v ? `${t}:${v};` : "";
        })
        .join("");
      if (decl) {
        const s = doc.createElement("style");
        s.setAttribute("data-rp-mirror", "");
        s.textContent = `:root{${decl}}`;
        doc.head.appendChild(s);
      }
    };
    mirror();

    let container = doc.getElementById("rp-root") as HTMLElement | null;
    if (!container) {
      container = doc.createElement("div");
      container.id = "rp-root";
      doc.body.appendChild(container);
    }
    setMountNode(container);
  }, []);

  return (
    <div className="rp">
      <div className="rp-toolbar">
        <button
          type="button"
          className={`rp-tab${device === "desktop" ? " rp-tab--active" : ""}`}
          onClick={() => setDevice("desktop")}
        >
          {labels.desktop}
        </button>
        <button
          type="button"
          className={`rp-tab${device === "mobile" ? " rp-tab--active" : ""}`}
          onClick={() => setDevice("mobile")}
        >
          {labels.mobile}
        </button>
      </div>

      <div className="rp-stage">
        <iframe
          ref={iframeRef}
          className="rp-frame"
          title="Responsive preview"
          style={{ width: `${WIDTHS[device]}px` }}
        />
        {mountNode && createPortal(children, mountNode)}
      </div>
    </div>
  );
}
