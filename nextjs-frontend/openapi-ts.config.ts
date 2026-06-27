import { defineConfig } from "@hey-api/openapi-ts";
import { config } from "dotenv";

config({ path: ".env.local" });

const openapiFile = process.env.OPENAPI_OUTPUT_FILE ?? "./openapi.json";

export default defineConfig({
  input: openapiFile as string,
  output: {
    path: "app/openapi-client",
    postProcess: ["prettier"],
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      baseUrl: false,
    },
  ],
});
