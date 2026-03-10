import { defineCloudflareConfig } from "@opennextjs/cloudflare"

export default {
  ...defineCloudflareConfig({}),
  buildCommand: "node update-version.js && next build",
}
