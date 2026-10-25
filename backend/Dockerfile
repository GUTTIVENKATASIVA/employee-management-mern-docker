# ---- Backend image: Node.js + Express API ----
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy the application source
COPY src ./src

# Run as the unprivileged "node" user that ships with the image
USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=10 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
