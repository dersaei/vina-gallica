import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./ResponsivePreview.css";

type Device = "desktop" | "mobile";

// Rendered at the *real* widths the live site sees. The card's CSS uses vw
// units, so the iframe viewport width must match reality — anything narrower
// silently changes typography and trips the card's own breakpoints. We keep
// these honest and scale the result down visually instead.
const WIDTHS: Record<Device, number> = {
  desktop: 1440,
  mobile: 390,
};

// Starting height before the first measurement; roughly a filled card, so the
// stage does not visibly jump when the real height arrives a frame later.
const INITIAL_HEIGHT = 420;

interface Props {
  labels: { desktop: string; mobile: string };
  children: ReactNode;
}

// Renders children inside an <iframe> at a true device width, then applies a
// CSS transform so it fits the available space. Because the iframe viewport
// keeps its real width, vw units and @media queries resolve exactly as they
// do on the live site — the preview is proportionally faithful, just smaller.
export default function ResponsivePreview({ labels, children }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(INITIAL_HEIGHT);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Base document: reset margins, inherit page background. The frame is
    // sized to its content, so its own scrollbars would only be noise.
    doc.documentElement.style.height = "auto";
    doc.documentElement.style.overflow = "hidden";
    doc.body.style.margin = "0";
    // No padding: it would show through as a frame of the surrounding
    // background around the card. The card supplies its own spacing.
    doc.body.style.padding = "0";
    doc.body.style.background = "transparent";
    doc.body.style.fontFamily = "inherit";

    // Mirror parent stylesheets (linked + inline) so pcp-* rules + fonts apply.
    const mirror = () => {
      doc.head.querySelectorAll("[data-rp-mirror]").forEach((n) => n.remove());
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
      // Block flow, height driven purely by content — this element is what we
      // measure to size the frame.
      container.style.display = "flow-root";
      doc.body.appendChild(container);
    }
    setMountNode(container);
  }, []);

  // Scale the frame to fit the stage width, and crop the stage to the card's
  // real height so a short card doesn't leave a tall empty gap.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const available = stage.clientWidth;
      const target = WIDTHS[device];
      // Never scale up — a mobile frame that fits stays at 1:1.
      const next = available > 0 ? Math.min(1, available / target) : 1;
      setScale(next);

      // Measure the card itself, not the body. We set the body's height from
      // this value, so measuring the body would feed its own output back in.
      const root = iframeRef.current?.contentDocument?.getElementById("rp-root");
      if (root) {
        const h = Math.ceil(root.getBoundingClientRect().height);
        setContentHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    // The card grows and shrinks as the user edits, so watch the card element.
    const root = iframeRef.current?.contentDocument?.getElementById("rp-root");
    let rootRo: ResizeObserver | undefined;
    if (root) {
      rootRo = new ResizeObserver(measure);
      rootRo.observe(root);
    }

    return () => {
      ro.disconnect();
      rootRo?.disconnect();
    };
  }, [device, mountNode, children]);

  return (
    <div className="rp">
      <div className="rp-toolbar">
        <div className="rp-tabs" role="group">
          <button
            type="button"
            className={`rp-tab${device === "desktop" ? " rp-tab--active" : ""}`}
            aria-pressed={device === "desktop"}
            onClick={() => setDevice("desktop")}
          >
            {labels.desktop}
          </button>
          <button
            type="button"
            className={`rp-tab${device === "mobile" ? " rp-tab--active" : ""}`}
            aria-pressed={device === "mobile"}
            onClick={() => setDevice("mobile")}
          >
            {labels.mobile}
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`rp-stage rp-stage--${device}`}
        style={{ height: `${contentHeight * scale}px` }}
      >
        {/* Sized to the *scaled* footprint so it never overflows the stage;
            the inner scaler is the real-width element being shrunk. */}
        <div
          className="rp-scaler-box"
          style={{
            width: `${WIDTHS[device] * scale}px`,
            height: `${contentHeight * scale}px`,
          }}
        >
          <div
            className="rp-scaler"
            style={{
              width: `${WIDTHS[device]}px`,
              height: `${contentHeight}px`,
              transform: `scale(${scale})`,
            }}
          >
            <iframe
              ref={iframeRef}
              className="rp-frame"
              title="Responsive preview"
              style={{
                width: `${WIDTHS[device]}px`,
                height: `${contentHeight}px`,
              }}
            />
            {mountNode && createPortal(children, mountNode)}
          </div>
        </div>
      </div>

    </div>
  );
}
