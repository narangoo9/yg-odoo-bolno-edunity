import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const envPath = path.resolve(process.cwd(), ".env");

const planCatalog = [
  {
    plan: "STUDENT",
    productName: "ELearn Student",
    monthlyAmount: 19000,
    yearlyAmount: 199000,
  },
  {
    plan: "INSTRUCTOR",
    productName: "ELearn Instructor",
    monthlyAmount: 49000,
    yearlyAmount: 499000,
  },
  {
    plan: "ORGANIZATION",
    productName: "ELearn Organization",
    monthlyAmount: 199000,
    yearlyAmount: 1990000,
  },
];

const webhookEvents = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`.env file not found: ${filePath}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function parseEnv(text) {
  const env = {};

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"(.*)"\s*$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }

  return env;
}

function escapeEnvValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function setEnvValue(text, key, value) {
  const line = `${key}="${escapeEnvValue(value)}"`;
  const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, "m");

  if (pattern.test(text)) {
    return text.replace(pattern, line);
  }

  const suffix = text.endsWith("\n") ? "" : "\n";
  return `${text}${suffix}${line}\n`;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function getCurrency() {
  const cliArg = process.argv.find((arg) => arg.startsWith("--currency="));
  if (cliArg) {
    return cliArg.split("=")[1].trim().toLowerCase();
  }

  return "mnt";
}

async function findOrCreateProduct(stripe, plan) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find(
    (product) =>
      product.metadata?.app === "elearn" &&
      product.metadata?.plan === plan.plan,
  );

  if (existing) {
    return existing;
  }

  return stripe.products.create({
    name: plan.productName,
    metadata: {
      app: "elearn",
      plan: plan.plan,
    },
  });
}

async function findOrCreatePrice(stripe, productId, plan, interval, amount, currency) {
  const lookupKey = `elearn_${plan.plan.toLowerCase()}_${interval}`;
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 10,
  });

  const matched = existing.data.find(
    (price) =>
      price.product === productId &&
      price.currency === currency &&
      price.recurring?.interval === (interval === "monthly" ? "month" : "year") &&
      price.unit_amount === amount,
  );

  if (matched) {
    return matched;
  }

  return stripe.prices.create({
    product: productId,
    currency,
    unit_amount: amount,
    recurring: {
      interval: interval === "monthly" ? "month" : "year",
    },
    lookup_key: lookupKey,
    nickname: `${plan.plan} ${interval}`,
    metadata: {
      app: "elearn",
      plan: plan.plan,
      interval,
    },
  });
}

async function createWebhookIfPossible(stripe, env) {
  const appUrl = env.NEXT_PUBLIC_APP_URL || env.NEXTAUTH_URL || "";
  if (!appUrl) {
    return {
      created: false,
      reason: "NEXT_PUBLIC_APP_URL is empty",
    };
  }

  const baseUrl = normalizeBaseUrl(appUrl);
  if (!baseUrl.startsWith("https://")) {
    return {
      created: false,
      reason: "NEXT_PUBLIC_APP_URL must be public https:// URL for Stripe webhooks",
    };
  }

  if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    return {
      created: false,
      reason: "localhost cannot receive Stripe dashboard webhooks",
    };
  }

  const webhookUrl = `${baseUrl}/api/webhooks/stripe`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((endpoint) => endpoint.url === webhookUrl);

  if (existing) {
    return {
      created: false,
      reason: `Webhook endpoint already exists at ${webhookUrl}. Stripe does not return the secret again for existing endpoints.`,
    };
  }

  const webhook = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: webhookEvents,
    description: "ELearn subscription webhook",
    metadata: {
      app: "elearn",
    },
  });

  return {
    created: true,
    secret: webhook.secret,
    url: webhookUrl,
  };
}

async function main() {
  const originalEnv = loadEnvFile(envPath);
  const env = parseEnv(originalEnv);
  const secretKey = env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is empty. Put your sk_test_ or sk_live_ key into .env first.");
  }

  const currency = getCurrency();
  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });

  let nextEnv = originalEnv;

  for (const plan of planCatalog) {
    const product = await findOrCreateProduct(stripe, plan);
    const monthlyPrice = await findOrCreatePrice(
      stripe,
      product.id,
      plan,
      "monthly",
      plan.monthlyAmount,
      currency,
    );
    const yearlyPrice = await findOrCreatePrice(
      stripe,
      product.id,
      plan,
      "yearly",
      plan.yearlyAmount,
      currency,
    );

    if (plan.plan === "STUDENT") {
      nextEnv = setEnvValue(nextEnv, "STRIPE_STUDENT_MONTHLY_PRICE_ID", monthlyPrice.id);
      nextEnv = setEnvValue(nextEnv, "STRIPE_STUDENT_YEARLY_PRICE_ID", yearlyPrice.id);
    }

    if (plan.plan === "INSTRUCTOR") {
      nextEnv = setEnvValue(nextEnv, "STRIPE_INSTRUCTOR_MONTHLY_PRICE_ID", monthlyPrice.id);
      nextEnv = setEnvValue(nextEnv, "STRIPE_INSTRUCTOR_YEARLY_PRICE_ID", yearlyPrice.id);
    }

    if (plan.plan === "ORGANIZATION") {
      nextEnv = setEnvValue(nextEnv, "STRIPE_ORG_MONTHLY_PRICE_ID", monthlyPrice.id);
      nextEnv = setEnvValue(nextEnv, "STRIPE_ORG_YEARLY_PRICE_ID", yearlyPrice.id);
    }
  }

  const publishableKey =
    env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    "";

  if (publishableKey) {
    nextEnv = setEnvValue(nextEnv, "STRIPE_PUBLISHABLE_KEY", publishableKey);
    nextEnv = setEnvValue(nextEnv, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", publishableKey);
  }

  const webhookResult = await createWebhookIfPossible(stripe, env);
  if (webhookResult.created && webhookResult.secret) {
    nextEnv = setEnvValue(nextEnv, "STRIPE_WEBHOOK_SECRET", webhookResult.secret);
  }

  fs.writeFileSync(envPath, nextEnv, "utf8");

  console.log(`Stripe subscription prices synced to ${envPath}`);
  console.log(`Currency: ${currency}`);

  if (!publishableKey) {
    console.log("Publishable key not auto-filled. Stripe API does not return pk_ keys. Add STRIPE_PUBLISHABLE_KEY manually.");
  }

  if (webhookResult.created) {
    console.log(`Webhook created: ${webhookResult.url}`);
  } else {
    console.log(`Webhook not auto-filled: ${webhookResult.reason}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
