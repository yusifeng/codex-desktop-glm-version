// wallet-onboarding-announcement-modal —— ChatGPT Wallet 引导弹窗与卡片展开动画。
// 原版：app/webview/assets/wallet-onboarding-announcement-modal-5f24c11f1adc.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;

const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;

type AnimationMode = "animate" | "fanned" | "tucked";
type AnimationSpeed = "normal" | "slow";

interface WalletLayer {
  id: string;
  image: string;
  cardClassName: string;
  pocketClassName: string;
  openCardX: number;
  openCardRotation: number;
  cardTravelDistance: number;
  pocketTravelDistance: number;
}

interface WalletOnboardingAnnouncementModalProps {
  animationMode?: AnimationMode;
  animationSpeed?: AnimationSpeed;
  dismissAnnouncement(): void;
  footer?: unknown;
  isSettingUpWallet?: boolean;
  onSetUpWallet(): void;
}

const styles = {
  scene: "_scene_1qp35_2",
  cardScene: "_cardScene_1qp35_2",
  layer: "_layer_1qp35_2",
  card: "_card_1qp35_2",
  cardTop: "_cardTop_1qp35_2",
  cardMiddle: "_cardMiddle_1qp35_2",
  cardBottom: "_cardBottom_1qp35_2",
  cardTexture: "_cardTexture_1qp35_2",
  cardMark: "_cardMark_1qp35_2",
  pocket: "_pocket_1qp35_2",
  pocketTop: "_pocketTop_1qp35_2",
  pocketMiddle: "_pocketMiddle_1qp35_2",
  pocketBottom: "_pocketBottom_1qp35_2",
  isAnimating: "_isAnimating_1qp35_2",
};

const SPRING = { stiffness: 123, damping: 18, mass: 1, velocity: 10.24 };
const ANIMATION_DELAY_MS = 2_000;
const SETTLE_DISTANCE_PX = 30;
const RELEASE_DISTANCE_RATIO = 0.25;
const VELOCITY_SCALE = 0.05;
const OVERSHOOT_ROTATION = -15;
const NORMAL_SPEED = 1.1;
const CARD_STAGGER_MS = 50;
const RELEASE_STAGGER_MS = 150;

let React: any;
let jsx: any;
let initialized = false;
let layers: readonly WalletLayer[];

function assetUrl(filename: string): string {
  return new URL(filename, import.meta.url).href;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function rotationPivotOffset(degrees: number): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: 60 - (60 * Math.cos(radians) - 38 * Math.sin(radians)),
    y: 38 - (60 * Math.sin(radians) + 38 * Math.cos(radians)),
  };
}

function transform(x: number, y: number, rotation: number): string {
  return `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
}

function cardTransform(layer: WalletLayer, state: "fanned" | "tucked"): string {
  const fanned = state === "fanned";
  const rotation = fanned ? layer.openCardRotation : 0;
  const pivot = rotationPivotOffset(rotation);
  return transform(
    (fanned ? layer.openCardX : 0) + pivot.x,
    (fanned ? -layer.cardTravelDistance : 0) + pivot.y,
    rotation,
  );
}

function pocketStyle(
  layer: WalletLayer,
  state: "fanned" | "tucked",
): Record<string, string | number> {
  const fanned = state === "fanned";
  const opacity = Number(!fanned);
  return {
    transform: `translateY(${fanned ? layer.pocketTravelDistance : 0}px)`,
    "--pocket-border-opacity": opacity,
    "--pocket-surface-opacity": opacity,
  };
}

function applyState(
  cards: HTMLElement[],
  pockets: HTMLElement[],
  state: "fanned" | "tucked",
): void {
  cards.forEach((card, index) => {
    card.style.transform = cardTransform(layers[index], state);
  });
  pockets.forEach((pocket, index) => {
    const fanned = state === "fanned";
    const opacity = String(Number(!fanned));
    pocket.style.transform = `translateY(${fanned ? layers[index].pocketTravelDistance : 0}px)`;
    pocket.style.setProperty("--pocket-border-opacity", opacity);
    pocket.style.setProperty("--pocket-surface-opacity", opacity);
  });
}

function animateLayer(
  card: HTMLElement,
  pocket: HTMLElement,
  layer: WalletLayer,
  speed: number,
  onSettled: () => void,
  onReleaseReady: () => void,
): { cancel(): void; release(): void } {
  const { stiffness, damping, mass, velocity } = SPRING;
  const fannedTarget = -16 / layer.cardTravelDistance;
  const releaseThreshold = SETTLE_DISTANCE_PX / layer.cardTravelDistance;
  let cardPosition = 0;
  let cardVelocity =
    -Math.abs(velocity) *
    VELOCITY_SCALE *
    (RELEASE_DISTANCE_RATIO / layer.cardTravelDistance);
  let pocketPosition = 0;
  let pocketVelocity = 0;
  let released = false;
  let releaseReady = false;
  let previousTime = performance.now();
  const positionTolerance = 0.001;
  const velocityTolerance = 0.01;
  let frame = 0;

  const tick = (time: number) => {
    let remaining = Math.min((time - previousTime) / 1_000, 0.04) * speed;
    previousTime = time;
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 120);
      const cardAcceleration =
        (stiffness * ((released ? 1 : fannedTarget) - cardPosition) -
          damping * cardVelocity) /
        mass;
      const pocketAcceleration =
        (stiffness * (Number(released) - pocketPosition) -
          damping * pocketVelocity) /
        mass;
      cardVelocity += cardAcceleration * step;
      cardPosition += cardVelocity * step;
      pocketVelocity += pocketAcceleration * step;
      pocketPosition += pocketVelocity * step;
      remaining -= step;
    }
    if (
      !released &&
      !releaseReady &&
      Math.abs(cardPosition - fannedTarget) <= releaseThreshold
    ) {
      releaseReady = true;
      onReleaseReady();
    }

    const cardY =
      -layer.cardTravelDistance + layer.cardTravelDistance * cardPosition;
    let rotation: number;
    let cardX: number;
    if (releaseReady) {
      const progress = clamp01(
        (cardPosition - fannedTarget) / (1 - fannedTarget),
      );
      rotation = (layer.openCardRotation + OVERSHOOT_ROTATION) * (1 - progress);
      cardX = layer.openCardX * (1 - progress);
    } else {
      const progress = clamp01(cardPosition / fannedTarget);
      rotation = layer.openCardRotation + OVERSHOOT_ROTATION * progress;
      cardX = layer.openCardX;
    }
    const pivot = rotationPivotOffset(rotation);
    card.style.transform = transform(
      cardX + pivot.x,
      cardY + pivot.y,
      rotation,
    );
    const opacity = clamp01(pocketPosition);
    pocket.style.transform = `translateY(${layer.pocketTravelDistance * (1 - pocketPosition)}px)`;
    pocket.style.setProperty("--pocket-border-opacity", String(opacity));
    pocket.style.setProperty("--pocket-surface-opacity", String(opacity));

    const cardDone =
      Math.abs(1 - cardPosition) <= positionTolerance &&
      Math.abs(cardVelocity) <= velocityTolerance;
    const pocketDone =
      Math.abs(1 - pocketPosition) <= positionTolerance &&
      Math.abs(pocketVelocity) <= velocityTolerance;
    if (cardDone && pocketDone) {
      card.style.transform = transform(0, 0, 0);
      pocket.style.transform = "translateY(0)";
      pocket.style.setProperty("--pocket-border-opacity", "1");
      pocket.style.setProperty("--pocket-surface-opacity", "1");
      onSettled();
      return;
    }
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);
  return {
    cancel: () => window.cancelAnimationFrame(frame),
    release: () => {
      released = true;
    },
  };
}

function animateScene(
  scene: HTMLElement,
  cards: HTMLElement[],
  pockets: HTMLElement[],
  animationSpeed: AnimationSpeed,
): () => void {
  const speed = animationSpeed === "slow" ? NORMAL_SPEED / 5 : NORMAL_SPEED;
  const animations = new Map<number, ReturnType<typeof animateLayer>>();
  const timers = new Set<number>();
  const ready = new Set<number>();
  let settled = 0;
  let cancelled = false;
  let released = false;
  const releaseAll = () => {
    if (cancelled || released || ready.size !== layers.length) return;
    released = true;
    layers.forEach((_, index) => {
      const delay = (index * RELEASE_STAGGER_MS) / speed;
      if (delay === 0) animations.get(index)?.release();
      else {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          animations.get(index)?.release();
        }, delay);
        timers.add(timer);
      }
    });
  };
  const start = (index: number) => {
    if (cancelled) return;
    const animation = animateLayer(
      cards[index],
      pockets[index],
      layers[index],
      speed,
      () => {
        animations.delete(index);
        settled += 1;
        if (!cancelled && settled === layers.length) {
          scene.classList.remove(styles.isAnimating);
        }
      },
      () => {
        ready.add(index);
        releaseAll();
      },
    );
    animations.set(index, animation);
  };

  scene.classList.add(styles.isAnimating);
  layers.forEach((_, index) => {
    const delay = (index * CARD_STAGGER_MS) / speed;
    if (delay === 0) start(index);
    else {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        start(index);
      }, delay);
      timers.add(timer);
    }
  });
  return () => {
    cancelled = true;
    timers.forEach((timer) => window.clearTimeout(timer));
    animations.forEach((animation) => animation.cancel());
    timers.clear();
    animations.clear();
    scene.classList.remove(styles.isAnimating);
  };
}

function WalletOnboardingAnnouncementModal({
  animationMode = "animate",
  animationSpeed = "normal",
  dismissAnnouncement,
  footer,
  isSettingUpWallet = false,
  onSetUpWallet,
}: WalletOnboardingAnnouncementModalProps): unknown {
  initializeWalletOnboardingAnnouncementModal();
  const FormattedMessage = appShared.Y2 ?? "span";
  const AnnouncementModal = appInitial.l2 ?? "AnnouncementModal";
  return jsx.jsx(AnnouncementModal, {
    actionLayout: "stacked",
    body: jsx.jsx("p", {
      className:
        "text-base leading-normal tracking-normal text-codex-description",
      children: jsx.jsx(FormattedMessage, {
        id: "codexWalletOnboardingAnnouncementModal.body",
        defaultMessage:
          "Add payment methods that can be securely used by ChatGPT to carry out tasks",
        description: "Body copy explaining what ChatGPT Wallet is for",
      }),
    }),
    closeButtonClassName: "dark:text-default",
    closeButtonTone: "dark",
    dismissLabel: jsx.jsx(FormattedMessage, {
      id: "codexWalletOnboardingAnnouncementModal.dismissLabel",
      defaultMessage: "Not right now",
      description: "Secondary action to dismiss ChatGPT Wallet onboarding",
    }),
    footer,
    isPrimaryActionLoading: isSettingUpWallet,
    media: jsx.jsx(WalletCardsMedia, { animationMode, animationSpeed }),
    mediaClassName: "h-[240px]",
    onDismiss: dismissAnnouncement,
    onPrimaryAction: onSetUpWallet,
    primaryActionLabel: jsx.jsx(FormattedMessage, {
      id: "codexWalletOnboardingAnnouncementModal.primaryActionLabel",
      defaultMessage: "Set up ChatGPT Wallet",
      description: "Primary action to begin setting up ChatGPT Wallet",
    }),
    title: jsx.jsx(FormattedMessage, {
      id: "codexWalletOnboardingAnnouncementModal.title",
      defaultMessage: "Introducing ChatGPT Wallet",
      description: "Title for the ChatGPT Wallet onboarding announcement",
    }),
  });
}

function WalletCardsMedia({
  animationMode,
  animationSpeed,
}: {
  animationMode: AnimationMode;
  animationSpeed: AnimationSpeed;
}): unknown {
  const tucked = appInitial.Slt?.() || animationMode === "tucked";
  const sceneRef = React.useRef(null);
  React.useEffect(() => {
    const scene: HTMLElement | null = sceneRef.current;
    if (scene == null) return;
    const cards = Array.from(
      scene.querySelectorAll<HTMLElement>("[data-wallet-card]"),
    );
    const pockets = Array.from(
      scene.querySelectorAll<HTMLElement>("[data-wallet-pocket]"),
    );
    scene.classList.remove(styles.isAnimating);
    if (tucked) {
      applyState(cards, pockets, "tucked");
      return;
    }
    applyState(cards, pockets, "fanned");
    if (animationMode === "fanned") return;
    let stop: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      stop = animateScene(scene, cards, pockets, animationSpeed);
    }, ANIMATION_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      stop?.();
    };
  }, [animationMode, animationSpeed, tucked]);

  return jsx.jsx("div", {
    ref: sceneRef,
    "aria-hidden": true,
    className: styles.scene,
    children: jsx.jsx("div", {
      className: styles.cardScene,
      children: layers.map((layer) =>
        jsx.jsx(
          WalletCardLayer,
          {
            initialState: tucked ? "tucked" : "fanned",
            layer,
          },
          layer.id,
        ),
      ),
    }),
  });
}

function WalletCardLayer({
  initialState,
  layer,
}: {
  initialState: "fanned" | "tucked";
  layer: WalletLayer;
}): unknown {
  const classNames =
    appShared.m4 ??
    ((...values: unknown[]) => values.filter(Boolean).join(" "));
  const WalletMark = appInitial.o3t ?? "span";
  return jsx.jsxs("div", {
    className: styles.layer,
    children: [
      jsx.jsxs("div", {
        className: classNames(styles.card, layer.cardClassName),
        "data-wallet-card": true,
        style: { transform: cardTransform(layer, initialState) },
        children: [
          jsx.jsx("img", {
            alt: "",
            className: styles.cardTexture,
            draggable: false,
            src: layer.image,
          }),
          jsx.jsx(WalletMark, {
            className: classNames(styles.cardMark, "text-white"),
          }),
        ],
      }),
      jsx.jsx("div", {
        className: classNames(styles.pocket, layer.pocketClassName),
        "data-wallet-pocket": true,
        style: pocketStyle(layer, initialState),
      }),
    ],
  });
}

function initializeWalletOnboardingAnnouncementModal(): void {
  if (initialized) return;
  initialized = true;
  appShared.$3?.();
  appShared.h4?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  appShared.K2?.();
  appInitial.u2?.();
  appInitial.xlt?.();
  appInitial.s3t?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  layers = [
    {
      id: "cyan",
      image: assetUrl("card-cyan-56def56cf458.png"),
      cardClassName: styles.cardTop,
      pocketClassName: styles.pocketTop,
      openCardX: -10,
      openCardRotation: -15,
      cardTravelDistance: 22,
      pocketTravelDistance: 80,
    },
    {
      id: "purple",
      image: assetUrl("card-purple-9662514d5440.png"),
      cardClassName: styles.cardMiddle,
      pocketClassName: styles.pocketMiddle,
      openCardX: 0,
      openCardRotation: 0,
      cardTravelDistance: 30,
      pocketTravelDistance: 72,
    },
    {
      id: "green",
      image: assetUrl("card-green-e3f7fd3abfac.png"),
      cardClassName: styles.cardBottom,
      pocketClassName: styles.pocketBottom,
      openCardX: -10,
      openCardRotation: 15,
      cardTravelDistance: 38,
      pocketTravelDistance: 64,
    },
  ];
}

initializeWalletOnboardingAnnouncementModal();

export { WalletOnboardingAnnouncementModal };
