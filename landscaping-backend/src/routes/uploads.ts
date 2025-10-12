// src/routes/uploads.ts
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post("/sign", async (req, res) => {
  const { fileName, contentType } = req.body;
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUploadUrl(fileName, { upsert: true, contentType });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
