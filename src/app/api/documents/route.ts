import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDocument } from "@/lib/document-parser";
import { chunkText } from "@/lib/chunker";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { uploadedAt: "desc" },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 100MB" },
        { status: 400 }
      );
    }

    const ALLOWED_TYPES = ["application/pdf", "text/plain", "text/markdown"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (
      !ALLOWED_TYPES.includes(file.type) &&
      !extension?.match(/^(md|markdown|txt)$/)
    ) {
      return NextResponse.json(
        { error: "Only PDF, Markdown, and plain text files are allowed" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existingDoc = await prisma.document.findFirst({
      where: {
        userId: session.user.id,
        filename: file.name,
      },
    });

    if (existingDoc) {
      return NextResponse.json(
        { error: "A document with this name already exists" },
        { status: 409 }
      );
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: "processing",
      },
    });

    // Process document asynchronously
    processDocument(document.id, file).catch((error) => {
      console.error("Document processing failed:", error);
      prisma.document
        .update({
          where: { id: document.id },
          data: {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          },
        })
        .catch(console.error);
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

async function processDocument(documentId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Parse document
  const parsed = await parseDocument(buffer, file.name);
  
  // Chunk text
  const chunks = chunkText(parsed.text, parsed.pages || []);
  
  // Save chunks without embeddings (keyword-based search)
  for (const chunk of chunks) {
    await prisma.chunk.create({
      data: {
        documentId,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        heading: chunk.heading,
        chunkIndex: chunk.chunkIndex,
      },
    });
  }
  
  // Mark document as completed
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "completed",
      processedAt: new Date(),
    },
  });
}
