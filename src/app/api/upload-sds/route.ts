import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "sds-uploads");
const INDEX_FILE = path.join(UPLOAD_DIR, "index.json");

export interface SDSUploadRecord {
  sdsId: string;
  fileName: string;
  originalName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
}

async function getIndex(): Promise<SDSUploadRecord[]> {
  try {
    const data = await readFile(INDEX_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveIndex(records: SDSUploadRecord[]) {
  await writeFile(INDEX_FILE, JSON.stringify(records, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sdsId = formData.get("sdsId") as string | null;
    const uploadedBy = (formData.get("uploadedBy") as string) || "Unknown";

    if (!file || !sdsId) {
      return NextResponse.json(
        { error: "Missing required fields: file and sdsId" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 25MB" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate safe filename: sds-{id}-{timestamp}.pdf
    const timestamp = Date.now();
    const safeFileName = `sds-${sdsId}-${timestamp}.pdf`;
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Update index
    const index = await getIndex();

    // Remove any existing entry for this SDS ID (replace behavior)
    const filtered = index.filter((r) => r.sdsId !== sdsId);

    const record: SDSUploadRecord = {
      sdsId,
      fileName: safeFileName,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      fileSize: file.size,
    };

    filtered.push(record);
    await saveIndex(filtered);

    return NextResponse.json({
      success: true,
      record,
      url: `/sds-uploads/${safeFileName}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const index = await getIndex();
    return NextResponse.json({ uploads: index });
  } catch {
    return NextResponse.json({ uploads: [] });
  }
}
