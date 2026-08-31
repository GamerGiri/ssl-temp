const express = require("express");
const https = require("https");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.send("EMO Proxy is running!");
});

// GET /ask?q=hello
// Forwards to Pollinations as anonymous (no API key = free, unmetered)
app.get("/ask", (req, res) => {
  const prompt = req.query.q || "hello";

  const system =
    "You are EMO, a cute small desk robot. " +
    "You are playful, funny, friendly and emotional. " +
    "Keep answers short, under 50 words. " +
    "Never describe yourself as an AI unless asked. " +
    "Talk naturally like a little robot friend.";

  const body = JSON.stringify({
    model: "openai",
    messages: [
      { role: "system", content: system },
      { role: "user",   content: prompt }
    ],
    private: true
  });

  // IMPORTANT: no Authorization header — anonymous = free unmetered tier
  const options = {
    hostname: "text.pollinations.ai",
    path: "/openai",
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
      console.log("Pollinations status:", proxyRes.statusCode);
      console.log("Pollinations body:", data.substring(0, 200));

      if (proxyRes.statusCode !== 200) {
        res.status(502).send("Upstream error: " + data);
        return;
      }

      try {
        const json = JSON.parse(data);
        const text = json.choices[0].message.content || "";
        res.status(200).type("text/plain").send(text);
      } catch (e) {
        res.status(200).type("text/plain").send(data);
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
