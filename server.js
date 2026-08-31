const express = require("express");
const https = require("https");
const app = express();

app.get("/", (req, res) => {
  res.send("EMO Proxy is running!");
});

// GET /ask?q=hello
// Uses Pollinations GET endpoint — confirmed anonymous, no key involved
app.get("/ask", (req, res) => {
  const userMsg = req.query.q || "hello";

  const system =
    "You are EMO, a cute small desk robot. " +
    "You are playful, funny, friendly and emotional. " +
    "Keep answers short, under 50 words. " +
    "Never describe yourself as an AI unless asked. " +
    "Talk naturally like a little robot friend.";

  // Build full prompt as a single string
  const fullPrompt = encodeURIComponent(
    "System: " + system + "\nUser: " + userMsg
  );

  // GET endpoint — no body, no auth, just a URL
  // https://text.pollinations.ai/{prompt}?model=openai
  const path = "/" + fullPrompt + "?model=openai&private=true";

  console.log("Requesting path length:", path.length);

  const options = {
    hostname: "text.pollinations.ai",
    port: 443,
    path: path,
    method: "GET",
    headers: {
      "Host":       "text.pollinations.ai",
      "User-Agent": "emo-proxy/1.0",
      "Accept":     "text/plain"
      // Zero auth headers
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", chunk => (data += chunk));
    proxyRes.on("end", () => {
      console.log("Status:", proxyRes.statusCode);
      console.log("Body:", data.substring(0, 200));

      if (proxyRes.statusCode !== 200) {
        res.status(502).send("Upstream error: " + data);
        return;
      }

      // GET endpoint returns plain text directly
      res.status(200).type("text/plain").send(data.trim());
    });
  });

  proxyReq.on("error", (e) => {
    console.error("Error:", e.message);
    res.status(500).send("ERROR: " + e.message);
  });

  proxyReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("EMO proxy on port " + PORT);
});
