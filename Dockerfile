FROM denoland/deno:distroless-2.5-3@sha256:fa186b5128ad3a95cca539ab3af738c522ba793bfbe71b7aa983daaba573bcd4

WORKDIR /app

COPY .output /app/
COPY deno.jsonc /app/server

EXPOSE 3000

ENV NODE_ENV=production
ENV DENO_TRACE_PERMISSIONS=1

CMD ["--no-prompt", "-P", "server/index.mjs"]
