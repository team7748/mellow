import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import dotenv from "dotenv"
import speakAnswerHandler from "./api/speak-answer-check"

// Load environment variables from .env.local so the API can access GEMINI_API_KEY
dotenv.config({ path: ".env.local" })

const apiMiddleware = () => ({
  name: "api-middleware",
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === "/api/speak-answer-check" && req.method === "POST") {
        let body = ""
        req.on("data", (chunk: any) => {
          body += chunk.toString()
        })
        req.on("end", async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {}
            const vercelReq = { method: req.method, body: parsedBody }
            const vercelRes = {
              status: (code: number) => {
                res.statusCode = code
                return vercelRes
              },
              json: (data: any) => {
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(data))
              },
            }
            await speakAnswerHandler(vercelReq as any, vercelRes as any)
          } catch (err) {
            console.error("API Plugin Error:", err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: "server_error" }))
          }
        })
        return
      }
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddleware()],
  build: { rollupOptions: { output: { manualChunks: { vocabulary: ["./src/data/vocabulary-2000.json", "./src/utils/vocabulary.ts"], grammar: ["./src/data/grammar/registry.ts", "./src/data/grammar/loader.ts"] } } } },
})
