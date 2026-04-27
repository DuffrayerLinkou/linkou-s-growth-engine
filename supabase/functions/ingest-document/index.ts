import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Text chunking ────────────────────────────────────────────────────
// Approx tokens: ~4 chars/token. Target 600 tokens (~2400 chars), overlap 80 tokens (~320 chars).
const CHUNK_CHARS = 2400;
const OVERLAP_CHARS = 320;

function chunkText(text: string): Array<{ content: string; tokens: number }> {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  // Split by paragraphs first to preserve context
  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length <= CHUNK_CHARS) {
      current = current ? current + "\n\n" + p : p;
    } else {
      if (current) chunks.push(current);
      // If single paragraph is bigger than chunk, hard-split
      if (p.length > CHUNK_CHARS) {
        for (let i = 0; i < p.length; i += CHUNK_CHARS - OVERLAP_CHARS) {
          chunks.push(p.slice(i, i + CHUNK_CHARS));
        }
        current = "";
      } else {
        current = p;
      }
    }
  }
  if (current) chunks.push(current);

  // Add overlap between adjacent chunks
  const withOverlap: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      withOverlap.push(chunks[i]);
    } else {
      const prevTail = chunks[i - 1].slice(-OVERLAP_CHARS);
      withOverlap.push(prevTail + "\n\n" + chunks[i]);
    }
  }

  return withOverlap.map((content) => ({
    content,
    tokens: Math.ceil(content.length / 4),
  }));
}

// ─── Text extraction ──────────────────────────────────────────────────
async function extractText(blob: Blob, mime: string, fileName: string): Promise<string> {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mime || "").toLowerCase();

  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
    const arrayBuf = await blob.arrayBuffer();
    const pdfMod: any = await import("https://esm.sh/pdf-parse@1.1.1?target=deno");
    const PDFParser = pdfMod.default || pdfMod;
    const pdfData = await PDFParser(new Uint8Array(arrayBuf));
    return (pdfData?.text || "").trim();
  }

  if (
    lowerMime.startsWith("text/") ||
    lowerMime.includes("json") ||
    lowerMime.includes("csv") ||
    /\.(txt|md|csv|json|log|xml|html?)$/i.test(lowerName)
  ) {
    return (await blob.text()).trim();
  }

  if (/\.docx$/i.test(lowerName) || lowerMime.includes("wordprocessingml")) {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const mammoth: any = await import("https://esm.sh/mammoth@1.6.0?target=deno");
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
      return (result?.value || "").trim();
    } catch (e) {
      throw new Error(`DOCX parse failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (/\.(xlsx|xls)$/i.test(lowerName) || lowerMime.includes("spreadsheetml") || lowerMime.includes("ms-excel")) {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const xlsxMod: any = await import("https://esm.sh/xlsx@0.18.5?target=deno");
      const wb = xlsxMod.read(new Uint8Array(arrayBuf), { type: "array" });
      const parts: string[] = [];
      const MAX_ROWS_PER_SHEET = 5000;
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        // CSV-like (tab-separated) preserving header context
        const tsv: string = xlsxMod.utils.sheet_to_csv(sheet, { FS: "\t", blankrows: false });
        const lines = tsv.split("\n");
        const truncated = lines.length > MAX_ROWS_PER_SHEET;
        const limited = truncated ? lines.slice(0, MAX_ROWS_PER_SHEET) : lines;
        parts.push(`### Aba: ${sheetName}\n${limited.join("\n")}${truncated ? `\n[... truncado em ${MAX_ROWS_PER_SHEET} linhas de ${lines.length} ...]` : ""}`);
      }
      return parts.join("\n\n").trim();
    } catch (e) {
      throw new Error(`XLSX parse failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (/\.pptx$/i.test(lowerName) || lowerMime.includes("presentationml")) {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const jszipMod: any = await import("https://esm.sh/jszip@3.10.1?target=deno");
      const JSZipCtor = jszipMod.default || jszipMod;
      const zip = await JSZipCtor.loadAsync(new Uint8Array(arrayBuf));
      // Collect slide XMLs and sort by numeric index
      const slideEntries: Array<{ idx: number; path: string }> = [];
      zip.forEach((path: string) => {
        const m = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
        if (m) slideEntries.push({ idx: parseInt(m[1], 10), path });
      });
      slideEntries.sort((a, b) => a.idx - b.idx);
      if (slideEntries.length === 0) return "";
      const parts: string[] = [];
      for (const { idx, path } of slideEntries) {
        const xml: string = await zip.file(path).async("string");
        // Extract <a:t>...</a:t> text runs
        const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
        const texts = matches
          .map((m) => m.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
          .map((t) => t.trim())
          .filter(Boolean);
        if (texts.length === 0) continue;
        const title = texts[0];
        const body = texts.slice(1).join("\n");
        parts.push(`### Slide ${idx}: ${title}${body ? `\n${body}` : ""}`);
      }
      return parts.join("\n\n").trim();
    } catch (e) {
      throw new Error(`PPTX parse failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(`Formato não suportado para indexação: ${mime || "desconhecido"} (${fileName}). Suportados: PDF, TXT, MD, CSV, JSON, HTML, DOCX, XLSX, PPTX.`);
}

// ─── Embedding generation ─────────────────────────────────────────────
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/text-embedding-004",
      input: text,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Embedding gateway error ${response.status}: ${t.slice(0, 200)}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("Invalid embedding response shape");
  }
  return embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const fileId = body?.file_id as string | undefined;
    if (!fileId) return json({ error: "file_id required" }, 400);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch file row
    const { data: fileRow, error: fileErr } = await db
      .from("files")
      .select("id, client_id, name, file_path, mime_type, file_type")
      .eq("id", fileId)
      .maybeSingle();

    if (fileErr || !fileRow) return json({ error: "Arquivo não encontrado" }, 404);

    // Authorization: caller must have access to this client
    const { data: profile } = await db
      .from("profiles")
      .select("client_id")
      .eq("id", userId)
      .maybeSingle();

    const { data: roles } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = (roles || []).some((r: { role: string }) => r.role === "admin" || r.role === "account_manager");
    const isClientUser = profile?.client_id === fileRow.client_id;

    if (!isAdmin && !isClientUser) {
      return json({ error: "Forbidden" }, 403);
    }

    // Download file from storage
    const { data: blob, error: dlErr } = await db.storage
      .from("client-files")
      .download(fileRow.file_path as string);

    if (dlErr || !blob) {
      return json({ error: `Falha ao baixar arquivo: ${dlErr?.message || "sem dados"}` }, 500);
    }

    // Extract text
    let text: string;
    try {
      text = await extractText(blob, fileRow.mime_type as string, fileRow.name as string);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : String(e) }, 400);
    }

    if (!text || text.length < 20) {
      return json({ error: "Arquivo vazio ou sem texto extraível." }, 400);
    }

    // Chunk
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return json({ error: "Não foi possível dividir o texto em chunks." }, 400);
    }

    // Idempotent: delete previous chunks (cascades to embeddings)
    await db.from("document_chunks").delete().eq("file_id", fileId);

    // Generate embeddings + insert (sequential to respect rate limits)
    let chunksCreated = 0;
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      try {
        // Insert chunk
        const { data: chunkRow, error: chunkErr } = await db
          .from("document_chunks")
          .insert({
            file_id: fileId,
            client_id: fileRow.client_id,
            chunk_index: i,
            content: c.content,
            token_count: c.tokens,
          })
          .select("id")
          .single();

        if (chunkErr || !chunkRow) {
          console.error(`Chunk ${i} insert failed:`, chunkErr);
          continue;
        }

        // Generate embedding
        const embedding = await generateEmbedding(c.content, LOVABLE_API_KEY);

        // Insert embedding (vector type accepts JSON-stringified array)
        const { error: embErr } = await db.from("document_embeddings").insert({
          chunk_id: chunkRow.id,
          client_id: fileRow.client_id,
          embedding: JSON.stringify(embedding),
          model: "google/text-embedding-004",
        });

        if (embErr) {
          console.error(`Embedding ${i} insert failed:`, embErr);
          await db.from("document_chunks").delete().eq("id", chunkRow.id);
          continue;
        }

        chunksCreated++;
        totalTokens += c.tokens;
      } catch (e) {
        console.error(`Chunk ${i} processing error:`, e);
      }
    }

    // Log action
    try {
      await db.from("client_actions").insert({
        client_id: fileRow.client_id,
        action_type: "ingest_document",
        payload: { file_id: fileId, file_name: fileRow.name, chunks_created: chunksCreated, total_tokens: totalTokens },
        executed_by: userId,
        status: chunksCreated > 0 ? "success" : "failed",
        error_message: chunksCreated === 0 ? "Nenhum chunk gerado" : null,
      });
    } catch (e) {
      console.error("Failed to log client_action:", e);
    }

    return json({
      success: true,
      file_id: fileId,
      file_name: fileRow.name,
      chunks_created: chunksCreated,
      tokens_processed: totalTokens,
    });
  } catch (e) {
    console.error("ingest-document error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});