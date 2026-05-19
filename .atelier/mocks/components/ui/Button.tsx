import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";
import { useSceneAction } from "../../../SceneActionContext";
import type { Outcome } from "../../../registry/types";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Keep these in sync with components/ui/Button.tsx. We intentionally do NOT
// `import { Button } from '../../../../components/ui/Button'` here because the
// Vite alias `^.*/components/ui/Button$` matches relative paths as well as
// `@/`-prefixed ones, which would re-route the import back into this file and
// recurse forever. Inlining the styling keeps the mock self-contained.
const variantClasses: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white border-transparent hover:bg-indigo-700",
  secondary: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
  ghost: "bg-transparent text-gray-600 border-transparent hover:bg-gray-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

function RealButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Decides whether a Button instance should be the inline scene-action surface.
 * Match heuristic: form submits and explicitly primary buttons. Secondary and
 * ghost buttons stay as their real selves even inside scene mode so we don't
 * hijack cancel / back actions.
 */
function isSceneActionButton({ type, variant }: ButtonProps): boolean {
  if (type === "submit") return true;
  if (!variant) return true; // default variant is primary
  return variant === "primary";
}

function pickDefault(outcomes: Outcome[]): Outcome | undefined {
  if (outcomes.length === 0) return undefined;
  return outcomes.find((o) => o.default) ?? outcomes[0];
}

function Caret() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Scene-aware drop-in for `@/components/ui/Button`. Vite aliases this file
 * over the real Button when the preview runs, so every component in the
 * codebase automatically participates in scenes without modification.
 *
 * - Outside scenes: re-exports the real Button verbatim.
 * - Inside scenes, on submit/primary buttons: renders a split-button dropdown
 *   whose primary face fires the default outcome and whose menu items each
 *   fire their own outcome on click.
 * - Inside scenes, on secondary/ghost buttons: still the real Button.
 */
export function Button(props: ButtonProps) {
  const action = useSceneAction();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(event: globalThis.MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  if (!action || !isSceneActionButton(props) || action.outcomes.length === 0) {
    return <RealButton {...props} />;
  }

  const { outcomes, dispatch } = action;
  const primary = pickDefault(outcomes);
  if (!primary) return <RealButton {...props} />;

  const { size = "md", disabled } = props;
  const sizing = sizeClasses[size];

  function fire(outcomeId: string) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      // Stop form submission and any real handlers — the outcome is the answer.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      dispatch(outcomeId);
    };
  }

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      data-atelier-scene-action="true"
    >
      <div className="inline-flex overflow-hidden rounded-lg border border-transparent shadow-sm">
        <button
          type="button"
          disabled={disabled}
          onClick={fire(primary.id)}
          title={primary.description}
          className={`inline-flex items-center justify-center bg-indigo-600 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 ${sizing}`}
        >
          Go to {primary.id}
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Choose outcome"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className={`flex items-center justify-center bg-indigo-600 px-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 ${
            size === "sm" ? "py-1.5" : "py-2"
          }`}
        >
          <Caret />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 flex min-w-56 flex-col rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Scene outcomes
          </div>
          {outcomes.map((outcome) => {
            const isPrimary = outcome.id === primary.id;
            return (
              <button
                key={outcome.id}
                type="button"
                role="menuitem"
                onClick={fire(outcome.id)}
                className="flex flex-col items-start gap-0.5 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  Go to {outcome.id}
                  {isPrimary && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-indigo-700">
                      Default
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
