import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    
      "accountAssociation": {
        "header": "",
        "payload": "",
        "signature": ""
      },
    
    frame: {
      version: "1",
      name: "WAGMI Blaster",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["arbitrum", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: "Chain Crush",
      description: "Play and Earn",
      tagline:"Play and Earn",
      ogTitle:"Chain Crush",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.png`,
      heroImageUrl: `${APP_URL}/images/feed.png`,
      requiredChains: ["eip155:42161"],
    },
    "baseBuilder": {
      "allowedAddresses": ["0xE7503b8d192DcE2895327878ECE5a0a401821a66"]
    }
  };

  return NextResponse.json(farcasterConfig);
}
