import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post("/sign", async (req, res) => {
  try {
    const { fileName } = req.body; // e.g., 'user/<uid>/<uuid>-receipt.jpg'
    if (!fileName) return res.status(400).json({ error: "fileName required" });

    const { data, error } = await supabase
      .storage
      .from("receipts")
      .createSignedUploadUrl(fileName, { upsert: true }); 

    if (error) return res.status(400).json({ error: error.message });

    // data includes: signedUrl, path, token
    return res.json({
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl
    });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
