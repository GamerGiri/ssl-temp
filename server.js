const express = require("express");
const https = require("https");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.send("EMO Proxy is running!");
});

// Text endpoint — GET /ask?q=hello
app.get("/ask", (req, res) => {
  const prompt = req.query.q || "hello";
  const system =
    "You are EMO, a cute small desk robot. " +
    "You are playful, funny, friendly and emotional. " +
    "Keep answers short, under 50 words. " +
    "Never describe yourself as an AI unless asked. " +
    "Talk naturally like a little robot friend.";

  const path =
    "/v1/chat/completions";

  const body = JSON.stringify({
    model: "openai",
    messages: [
      { role: "system", content: system },
      { role: "user",   content: prompt }
    ]
  });

  const options = {
    hostname: "text.pollinations.ai",
    path: path,
    method: "POST",
    headers: {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", chunk => (data += chunk));
    proxyRes.on("end", () => {
      try {
        const json = JSON.parse(data);
        const text = json.choices[0].message.content || "";
        // Return plain text so ESP32 doesn't need JSON parsing
        res.status(200).send(text);
      } catch (e) {
        // Fallback: return raw response
        res.status(200).send(data);
      }
    });
  });

  proxyReq.on("error", (e) => {
    console.error("Proxy error:", e.message);
    res.status(500).send("ERROR: " + e.message);
  });

  proxyReq.write(body);
  proxyReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("EMO proxy running on port " + PORT);
});
