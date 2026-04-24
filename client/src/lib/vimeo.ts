declare global {
  interface Window {
    Vimeo?: {
      Player: new (element: HTMLIFrameElement) => VimeoPlayer;
    };
  }
}

export interface VimeoPlayer {
  on(event: string, callback: (payload?: any) => void): void;
  off(event: string, callback?: (payload?: any) => void): void;
  play(): Promise<void>;
  pause(): Promise<void>;
  setCurrentTime(seconds: number): Promise<number>;
  getDuration(): Promise<number>;
}

let vimeoScriptPromise: Promise<void> | null = null;

export function loadVimeoPlayerApi() {
  if (window.Vimeo?.Player) {
    return Promise.resolve();
  }

  if (vimeoScriptPromise) {
    return vimeoScriptPromise;
  }

  vimeoScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-vimeo-player-api="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Vimeo player API.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    script.dataset.vimeoPlayerApi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Vimeo player API."));
    document.head.appendChild(script);
  });

  return vimeoScriptPromise;
}
