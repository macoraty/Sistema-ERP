import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini SDK with telemetry header and the recommended gemini-2.5-flash model
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, mimeType, products } = await req.json();

    if (!fileBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing file content or MIME type" }, { status: 400 });
    }

    // Clean base64 string (remove data prefix if present)
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");

    const filePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const promptText = `
    You are an ERP integration assistant.
    Analyze this purchase quote, budget, or invoice document (which can be a PDF document or an image of a table).
    The document is in Portuguese. It contains a table with columns like Code (Código), Description (Descrição), Qtd (Quantity), Unid (Unit), Valor Unit (Unit Price), and Valor Total (Total).

    Your task is to extract all items and match them to our registered product catalog.
    If an item is NOT in our catalog, do not ignore it. Instead, mark it as isNew: true and provide a recommended code (codigo), description (descricao), and unit (unidade) so we can register it in our catalog automatically!

    Here is our registered product catalog in JSON format:
    ${JSON.stringify(products)}

    Please perform these steps:
    1. Carefully locate the table of items in the uploaded document. It has columns like "Código", "Descrição", "Qtd", "Unid", "Valor Unit" (or similar).
    2. Extract EVERY item present in the table. Do not miss any item!
    3. Match each extracted item to a product in our catalog. Look at the "codigo" (code) and "descricao" (description) fields in our catalog.
       - If a catalog product has a matching or highly similar code or description, assign its "prodId".
       - If there is NO matching product in our catalog, set "isNew" to true, "prodId" to null/0, and fill in:
         - "codigo": A clean uppercase code for the new product, e.g. following the style of other catalog items (like MP-XYZ for materials, IN-ABC for insumos, SA-GAV for semi-finished, or general standard SKU like COD-XYZ).
         - "descricao": The full name/description of the item.
         - "unidade": The unit of measure (e.g., "UN", "KG", "L", "M", "M2").
    4. Calculate the quantity (qtd) and unit price (valorUnitario) adjusted to the catalog's unit of measure (or directly if it is a new item). Ensure you convert comma-decimal numbers (e.g., "12,50", "0,45", "0,08") to standard numbers (12.5, 0.45, 0.08).

    Return a JSON array where each element contains:
    - prodId: number (optional, the ID of the matched catalog product)
    - isNew: boolean (optional, true if the item is not in the catalog)
    - codigo: string (optional, the code for the new product)
    - descricao: string (optional, the description for the new product)
    - unidade: string (optional, the unit for the new product)
    - qtd: number (the quantity adjusted to match the catalog product's unit)
    - valorUnitario: number (the unit price adjusted to match the catalog product's unit)

    Ensure EVERY item is extracted. Double check the count of rows and do not omit any row!
    `;

    // We use gemini-2.5-flash as it is highly recommended for multimodal and text tasks.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [filePart, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prodId: { type: Type.INTEGER, description: "The ID of the matched product in our catalog, or null if new" },
              isNew: { type: Type.BOOLEAN, description: "Whether this product is not in the catalog and should be registered" },
              codigo: { type: Type.STRING, description: "The code of the product (generate/recommend one if isNew is true)" },
              descricao: { type: Type.STRING, description: "The description of the product (required if isNew is true)" },
              unidade: { type: Type.STRING, description: "The unit of measure (required if isNew is true)" },
              qtd: { type: Type.NUMBER, description: "The quantity of items adjusted to catalog unit" },
              valorUnitario: { type: Type.NUMBER, description: "The unit price of the item adjusted to catalog unit" }
            },
            required: ["qtd", "valorUnitario"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedItems = JSON.parse(resultText.trim());
    console.log("Parsed items by Gemini:", parsedItems);
    return NextResponse.json({ items: parsedItems });

  } catch (error: any) {
    console.error("Error parsing quote file with Gemini:", error);
    return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 });
  }
}
