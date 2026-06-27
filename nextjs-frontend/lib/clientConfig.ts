import { client } from "@/app/openapi-client/client.gen";

const configureClient = () => {
  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    "http://localhost:8000";

  client.setConfig({
    baseUrl: baseURL,
  });
};

configureClient();
