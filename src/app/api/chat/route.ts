import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveRelevantChunks } from "@/lib/retrieval";
import { generateAnswer, RAGResponse } from "@/lib/rag";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error("Chat error: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    console.log("Chat request:", { message, conversationId, userId: session.user.id });

    if (!message) {
      console.error("Chat error: Message is required");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!conversationId) {
      console.error("Chat error: conversationId is required");
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: message,
      },
    });

    console.log("User message saved:", userMessage.id);

    // Retrieve relevant chunks
    console.log("Retrieving chunks...");
    const retrievedChunks = await retrieveRelevantChunks(message, session.user.id);
    console.log("Retrieved chunks:", retrievedChunks.length);

    // Generate answer
    console.log("Generating answer...");
    const ragResponse: RAGResponse = await generateAnswer(message, retrievedChunks);
    console.log("Answer generated");

    // Save assistant message with citations
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: ragResponse.answer,
        citations: JSON.stringify(ragResponse.citations),
      },
    });

    console.log("Assistant message saved:", assistantMessage.id);

    return NextResponse.json({
      userMessage,
      assistantMessage,
      citations: ragResponse.citations,
      hasAnswer: ragResponse.hasAnswer,
    });
  } catch (error) {
    console.error("Chat error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Failed to process chat message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
