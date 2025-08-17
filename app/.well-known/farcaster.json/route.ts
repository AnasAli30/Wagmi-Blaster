import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
      "accountAssociation": {
        "header": "eyJmaWQiOjI0OTcwMiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweGU2Q2ZkQWY3NGJGRUMwMEZhZmRFOTcyNEE0NmNiMDUyNTQ4Qzg0ODgifQ",
        "payload": "eyJkb21haW4iOiJ3YWdtaS1ibGFzdGVyLnZlcmNlbC5hcHAifQ",
        "signature": "MUW8qKxH1VNznYOLPzLq8CpYlcdUTlm6OlyLF4PKgklXfCskrc9B8QX8frS1hSMsLwOaqOQSX1sBkV/RbYYyfBw="
      },
    
    frame: {
      version: "1",
      name: "WAGMI Blaster",
      iconUrl: `${APP_URL}/images/icon.jpg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["arbitrum", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: "Chain Crush",
      description: "Play and Earn",
      tagline:"Play and Earn",
      ogTitle:"Chain Crush",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.jpg`,
      heroImageUrl: `${APP_URL}/images/feed.jpg`,
      requiredChains: ["eip155:42161"],
    },
    "baseBuilder": {
      "allowedAddresses": ["0xE7503b8d192DcE2895327878ECE5a0a401821a66"]
    }
  };

  return NextResponse.json(farcasterConfig);
}
