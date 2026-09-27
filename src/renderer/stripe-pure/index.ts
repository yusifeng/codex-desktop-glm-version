import "@rchunk/rolldown-runtime";

interface StripeInstance {
  _registerWrapper?(metadata: {
    name: string;
    startTime: number;
    version: string;
  }): void;
}

interface StripeFactory {
  (publishableKey: string, ...arguments_: unknown[]): StripeInstance;
}

interface StripeWindow extends Window {
  Stripe?: StripeFactory;
}

interface LoadParameters {
  advancedFraudSignals: boolean;
}

interface LoadStripe {
  (publishableKey: string, ...arguments_: unknown[]): Promise<StripeInstance | null>;
  setLoadParameters(parameters: LoadParameters): void;
}

const STRIPE_JS_URL = "https://js.stripe.com/basil/stripe.js";
const WRAPPER_VERSION = "7.9.0";
const SCRIPT_PATTERN =
  /^https:\/\/js\.stripe\.com\/(?:v3\/?(?:\?.*)?|(?:v3|[a-z]+)\/stripe\.js(?:\?.*)?)$/;

let loadParameters: LoadParameters | undefined;
let loadStarted = false;
let stripePromise: Promise<StripeFactory | null> | null = null;

function validateLoadParameters(parameters: LoadParameters): LoadParameters {
  if (
    parameters == null ||
    typeof parameters !== "object" ||
    Object.keys(parameters).length !== 1 ||
    typeof parameters.advancedFraudSignals !== "boolean"
  ) {
    throw new Error(
      `invalid load parameters; expected object of shape\n\n    {advancedFraudSignals: boolean}\n\nbut received\n\n    ${JSON.stringify(parameters)}\n`,
    );
  }
  return parameters;
}

function findStripeScript(): HTMLScriptElement | null {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src^="https://js.stripe.com"]',
  );
  return [...scripts].find((script) => SCRIPT_PATTERN.test(script.src)) ?? null;
}

function createStripeScript(parameters?: LoadParameters): HTMLScriptElement {
  const script = document.createElement("script");
  const query = parameters?.advancedFraudSignals === false
    ? "?advancedFraudSignals=false"
    : "";
  script.src = `${STRIPE_JS_URL}${query}`;
  const parent = document.head ?? document.body;
  if (parent == null) {
    throw new Error(
      "Expected document.body not to be null. Stripe.js requires a <body> element.",
    );
  }
  parent.appendChild(script);
  return script;
}

function loadStripeScript(
  parameters?: LoadParameters,
): Promise<StripeFactory | null> {
  if (stripePromise != null) return stripePromise;

  stripePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(null);
      return;
    }

    const stripeWindow = window as StripeWindow;
    if (stripeWindow.Stripe != null) {
      if (parameters != null) {
        console.warn(
          "loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used",
        );
      }
      resolve(stripeWindow.Stripe);
      return;
    }

    try {
      const existingScript = findStripeScript();
      if (existingScript != null && parameters != null) {
        console.warn(
          "loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used",
        );
      }
      const script = existingScript ?? createStripeScript(parameters);
      script.addEventListener(
        "load",
        () => {
          const factory = (window as StripeWindow).Stripe;
          if (factory == null) reject(new Error("Stripe.js not available"));
          else resolve(factory);
        },
        { once: true },
      );
      script.addEventListener(
        "error",
        (cause) => reject(new Error("Failed to load Stripe.js", { cause })),
        { once: true },
      );
    } catch (error) {
      reject(error);
    }
  });

  stripePromise.catch(() => {
    stripePromise = null;
  });
  return stripePromise;
}

const loadStripe = (async (
  publishableKey: string,
  ...arguments_: unknown[]
) => {
  loadStarted = true;
  const startTime = Date.now();
  const factory = await loadStripeScript(loadParameters);
  if (factory == null) return null;
  const stripe = factory(publishableKey, ...arguments_);
  stripe._registerWrapper?.({
    name: "stripe-js",
    version: WRAPPER_VERSION,
    startTime,
  });
  return stripe;
}) as LoadStripe;

loadStripe.setLoadParameters = (parameters) => {
  const validated = validateLoadParameters(parameters);
  if (
    loadStarted &&
    loadParameters != null &&
    validated.advancedFraudSignals === loadParameters.advancedFraudSignals
  ) {
    return;
  }
  if (loadStarted) {
    throw new Error("You cannot change load parameters after calling loadStripe");
  }
  loadParameters = validated;
};

function initializeStripePure(): void {}
function initializeStripeLoader(): void {
  initializeStripePure();
}

export {
  initializeStripePure as n,
  loadStripe as r,
  initializeStripeLoader as t,
};
