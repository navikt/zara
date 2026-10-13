# zara

Internal dev tool for TSM(@navikt/tsm) https://zara.ansatt.nav.no/

## Run locally

Prerequisites: Node.js 24, Yarn 4, and Docker with Docker Compose.

1. Install Node.js 24 (for example, with `mise install`) and enable Corepack:

   ```sh
   corepack enable
   ```

2. Install dependencies:

   ```sh
   yarn install
   ```

3. Make sure `.env.development` is configured for your environment. The development command loads
   this file automatically.
4. Start the app:

   ```sh
   yarn dev
   ```

   This starts the required local Docker Compose services and runs the app at
   <http://localhost:3005>.

To stop the local services, run `docker compose down`.
