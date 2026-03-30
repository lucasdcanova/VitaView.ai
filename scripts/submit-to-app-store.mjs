#!/usr/bin/env node
/**
 * Script to create a new App Store version, attach a build, and submit for review.
 *
 * Usage:
 *   node scripts/submit-to-app-store.mjs \
 *     --version 1.2 \
 *     --build 151 \
 *     --key-id YOUR_KEY_ID \
 *     --issuer-id YOUR_ISSUER_ID \
 *     --key-path secrets/AuthKey_XXXX.p8
 *
 * Environment variables (alternative to flags):
 *   ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH
 */

import { readFileSync } from "fs";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function flag(name, envVar) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return process.env[envVar] || null;
}

const VERSION = flag("version", "ASC_VERSION") || "1.2";
const BUILD_NUMBER = flag("build", "ASC_BUILD") || "151";
const KEY_ID = flag("key-id", "ASC_KEY_ID");
const ISSUER_ID = flag("issuer-id", "ASC_ISSUER_ID");
const KEY_PATH = flag("key-path", "ASC_KEY_PATH");
const APP_BUNDLE_ID = "br.com.lucascanova.vitaview";
const PLATFORM = "IOS"; // IOS | MAC_OS

if (!KEY_ID || !ISSUER_ID || !KEY_PATH) {
  console.error("Missing required credentials. Provide --key-id, --issuer-id, and --key-path");
  process.exit(1);
}

function generateJWT() {
  const privateKey = readFileSync(KEY_PATH, "utf8");
  const normalizedPrivateKey = privateKey.includes("\\n")
    ? privateKey.replace(/\\n/g, "\n")
    : privateKey;
  return jwt.sign({}, normalizedPrivateKey, {
    algorithm: "ES256",
    expiresIn: "20m",
    issuer: ISSUER_ID,
    audience: "appstoreconnect-v1",
    header: { alg: "ES256", kid: KEY_ID, typ: "JWT" },
  });
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
const BASE = "https://api.appstoreconnect.apple.com/v1";
let token = generateJWT();

async function api(method, path, body) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    console.error(`❌ ${method} ${path} → ${res.status}`);
    if (json?.errors) json.errors.forEach((e) => console.error(`   ${e.detail}`));
    else console.error(`   ${text.substring(0, 500)}`);
    return null;
  }
  return json;
}

async function createSubmission(path, relationshipType, relatedType, relatedId) {
  return api("POST", `/${path}`, {
    data: {
      type: path,
      relationships: {
        [relationshipType]: {
          data: { type: relatedType, id: relatedId },
        },
      },
    },
  });
}

function ensureBuildEligible(build) {
  const audienceType = build?.attributes?.buildAudienceType ?? "UNKNOWN";
  if (audienceType === "INTERNAL_ONLY") {
    console.error(
      `Build ${build.attributes?.version} is INTERNAL_ONLY and cannot be submitted to App Review. Upload a new App Store eligible build first.`
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🚀 Submitting VitaView v${VERSION} (build ${BUILD_NUMBER}) for App Store Review\n`);

  // 1. Get app ID
  console.log("1️⃣  Finding app...");
  const appsRes = await api("GET", `/apps?filter%5BbundleId%5D=${APP_BUNDLE_ID}`);
  if (!appsRes?.data?.length) { console.error("App not found"); process.exit(1); }
  const appId = appsRes.data[0].id;
  console.log(`   App ID: ${appId}`);

  // 2. Find build 151
  console.log(`2️⃣  Finding build ${BUILD_NUMBER}...`);
  const buildsRes = await api(
    "GET",
    `/builds?filter%5Bapp%5D=${appId}&filter%5Bversion%5D=${BUILD_NUMBER}&filter%5BprocessingState%5D=VALID`
  );
  if (!buildsRes?.data?.length) {
    // Try without processing state filter
    const buildsRes2 = await api("GET", `/builds?filter%5Bapp%5D=${appId}&filter%5Bversion%5D=${BUILD_NUMBER}`);
    if (!buildsRes2?.data?.length) {
      console.error(`Build ${BUILD_NUMBER} not found`);
      process.exit(1);
    }
    const build = buildsRes2.data[0];
    ensureBuildEligible(build);
    var buildId = build.id;
    console.log(
      `   Build ID: ${buildId} (state: ${build.attributes?.processingState}, audience: ${build.attributes?.buildAudienceType})`
    );
  } else {
    const build = buildsRes.data[0];
    ensureBuildEligible(build);
    var buildId = build.id;
    console.log(`   Build ID: ${buildId} (audience: ${build.attributes?.buildAudienceType})`);
  }

  // 3. Check if version 1.2 already exists
  console.log(`3️⃣  Checking for existing version ${VERSION}...`);
  const versionsRes = await api("GET", `/apps/${appId}/appStoreVersions?filter%5BplatformId%5D=IOS&filter%5BversionString%5D=${VERSION}`);

  let versionId;
  if (versionsRes?.data?.length) {
    versionId = versionsRes.data[0].id;
    const state = versionsRes.data[0].attributes?.appStoreState;
    console.log(`   Version ${VERSION} already exists (ID: ${versionId}, state: ${state})`);

    // If in editable state, update the build
    if (["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED"].includes(state)) {
      console.log("   Updating build assignment...");
      await api("PATCH", `/appStoreVersions/${versionId}/relationships/build`, {
        data: { type: "builds", id: buildId },
      });
    }
  } else {
    // 4. Create new version
    console.log(`4️⃣  Creating version ${VERSION}...`);
    const createRes = await api("POST", `/appStoreVersions`, {
      data: {
        type: "appStoreVersions",
        attributes: {
          versionString: VERSION,
          platform: PLATFORM,
        },
        relationships: {
          app: { data: { type: "apps", id: appId } },
          build: { data: { type: "builds", id: buildId } },
        },
      },
    });
    if (!createRes) process.exit(1);
    versionId = createRes.data.id;
    console.log(`   Created version ID: ${versionId}`);
  }

  // 5. Get the appStoreVersionSubmission (check if ready)
  console.log("5️⃣  Checking submission readiness...");
  const versionDetail = await api("GET", `/appStoreVersions/${versionId}?include=appStoreVersionLocalizations,appStoreVersionSubmission`);
  if (versionDetail) {
    const state = versionDetail.data.attributes?.appStoreState;
    console.log(`   Current state: ${state}`);
  }

  // 6. Submit subscriptions for review
  console.log("6️⃣  Submitting subscriptions for review...");
  const subscriptionGroupsRes = await api("GET", `/apps/${appId}/subscriptionGroups?limit=200`);
  const subscriptionGroupId = subscriptionGroupsRes?.data?.[0]?.id;
  if (subscriptionGroupId) {
    const subscriptionsRes = await api(
      "GET",
      `/subscriptionGroups/${subscriptionGroupId}/subscriptions?limit=200`
    );
    const subscriptions = subscriptionsRes?.data ?? [];
    for (const subscription of subscriptions) {
      const productId = subscription.attributes?.productId ?? subscription.id;
      const state = subscription.attributes?.state;
      if (state === "WAITING_FOR_REVIEW") {
        console.log(`   Subscription already waiting for review: ${productId}`);
        continue;
      }

      const submissionRes = await createSubmission(
        "subscriptionSubmissions",
        "subscription",
        "subscriptions",
        subscription.id
      );
      if (submissionRes) {
        console.log(`   Submitted subscription: ${productId}`);
      }
    }

    const groupSubmissionRes = await createSubmission(
      "subscriptionGroupSubmissions",
      "subscriptionGroup",
      "subscriptionGroups",
      subscriptionGroupId
    );
    if (groupSubmissionRes) {
      console.log(`   Submitted subscription group: ${subscriptionGroupId}`);
    }
  } else {
    console.log("   No subscription group found for the app.");
  }

  // 7. Submit app version for review
  console.log("7️⃣  Creating review submission...");
  const reviewSubmissionRes = await api("POST", `/reviewSubmissions`, {
    data: {
      type: "reviewSubmissions",
      relationships: {
        app: { data: { type: "apps", id: appId } },
      },
    },
  });

  const reviewSubmissionId = reviewSubmissionRes?.data?.id;
  if (!reviewSubmissionId) {
    console.log("\n⚠️  Failed to create review submission.");
    process.exit(1);
  }

  const reviewItemRes = await api("POST", `/reviewSubmissionItems`, {
    data: {
      type: "reviewSubmissionItems",
      relationships: {
        reviewSubmission: { data: { type: "reviewSubmissions", id: reviewSubmissionId } },
        appStoreVersion: { data: { type: "appStoreVersions", id: versionId } },
      },
    },
  });

  if (reviewItemRes) {
    console.log(`\n✅ Version ${VERSION} (build ${BUILD_NUMBER}) submitted for App Store review!`);
  } else {
    console.log("\n⚠️  Submission may have failed. Check App Store Connect for details.");
    console.log("   Common issues:");
    console.log("   - Build not yet selectable for the App Store version");
    console.log("   - Missing screenshots or metadata");
    console.log("   - Missing export compliance information");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
