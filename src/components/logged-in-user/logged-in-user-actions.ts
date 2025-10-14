import { createServerFn } from "@tanstack/react-start";

export const getLoggedInUser = createServerFn().handler(async () => {
  if (import.meta.env.DEV) {
    return {
      name: "Test Bruker",
      email: "test.bruker@nav.no",
    };
  }

  const { getRequest } = await import("@tanstack/start-server-core");
  const { getToken, parseAzureUserToken } = await import("@navikt/oasis");

  const token = getToken(getRequest());
  if (!token) return null;

  try {
    const parsedToken = parseAzureUserToken(token);
    if (!parsedToken.ok) {
      console.error(`Unable to parse token: ${parsedToken.error}`);
      return null;
    }

    return {
      name: parsedToken.name,
      email: parsedToken.NAVident,
    };
  } catch (e) {
    console.error("Failed to introspect token", e);
    return null;
  }
});
