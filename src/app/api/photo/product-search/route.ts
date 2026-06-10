import { NextResponse } from "next/server";
import {
  createAiClient,
  extractChatText,
  getAiModel,
  parseJsonFromModelText,
  productPhotoIdentityJsonSchema,
} from "@/lib/ai";
import { requireUserId } from "@/lib/auth-guard";
import {
  createPhotoLabelProduct,
  searchProductCandidates,
  type ProductNutritionCandidate,
} from "@/lib/product-search";
import { validateProductImageFile } from "@/lib/product-photo-upload";
import {
  productSearchRequestTooLarge,
  readProductSearchForm,
} from "@/lib/product-search-request";
import { withApiLogging } from "@/lib/request-log";
import { productPhotoIdentitySchema } from "@/lib/validations";

export const runtime = "nodejs";

async function postHandler(request: Request) {
  const auth = await requireUserId();

  if (!auth.ok) {
    return auth.error;
  }

  if (productSearchRequestTooLarge(request)) {
    return NextResponse.json(
      { error: "상품 사진은 10MB 이하로 업로드하세요." },
      { status: 413 },
    );
  }

  const formData = await readProductSearchForm(request);
  const file = formData.get("image");
  const barcode = formText(formData.get("barcode"));
  const query = formText(formData.get("query"));
  const imageFile = file instanceof File && file.size > 0 ? file : null;

  if (imageFile) {
    const imageValidation = validateProductImageFile(imageFile);

    if (!imageValidation.ok) {
      return NextResponse.json(
        { error: imageValidation.error },
        { status: imageValidation.status },
      );
    }
  }

  if (!imageFile && !barcode && !query) {
    return NextResponse.json(
      { error: "상품 사진, 바코드, 상품명 중 하나를 입력하세요." },
      { status: 400 },
    );
  }

  const detected = imageFile
    ? await identifyProductFromPhoto(imageFile)
    : productPhotoIdentitySchema.parse({
        barcode,
        productName: query,
        confidence: 0,
        note: "직접 입력한 검색어를 사용했습니다.",
      });
  const identity = productPhotoIdentitySchema.parse({
    ...detected,
    barcode: barcode || detected.barcode,
    productName: query || detected.productName,
  });
  const products = await searchProductCandidates({
    barcode: identity.barcode,
    query: buildSearchQuery(identity.brand, identity.productName),
    limit: 4,
  });
  const labelProduct = createPhotoLabelProduct(identity);

  return NextResponse.json({
    identity,
    products: appendPhotoLabelProduct(products, labelProduct),
  });
}

export const POST = withApiLogging(postHandler);

function formText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSearchQuery(brand: string, productName: string) {
  return [brand, productName].map((part) => part.trim()).filter(Boolean).join(" ");
}

function appendPhotoLabelProduct(
  products: ProductNutritionCandidate[],
  labelProduct: ProductNutritionCandidate | null,
) {
  if (!labelProduct) {
    return products;
  }

  const alreadyCovered = products.some(
    (product) => labelProduct.barcode && product.barcode === labelProduct.barcode,
  );

  return alreadyCovered ? products : [...products, labelProduct].slice(0, 5);
}

async function identifyProductFromPhoto(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}`;

  try {
    const response = await createAiClient().chat.completions.create({
      model: getAiModel(),
      messages: [
        {
          role: "system",
          content:
            "Read packaged food photos for nutrition logging. Extract a visible barcode, product name, brand, serving/package grams, likely eaten grams if visible, and nutrition facts per 100g if shown. Return only valid JSON. Use empty strings or null when uncertain.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `사진 속 포장식품 정보를 다음 JSON Schema에 맞춰 추출해줘. 바코드는 숫자만, nutritionPer100g는 100g 기준이 보일 때만 채워줘: ${JSON.stringify(productPhotoIdentityJsonSchema)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "low",
              },
            },
          ],
        },
      ],
    });
    const text = extractChatText(response.choices[0]?.message?.content);

    if (!text) {
      throw new Error("AI returned an empty product photo response.");
    }

    return productPhotoIdentitySchema.parse(parseJsonFromModelText(text));
  } catch (error) {
    if (error instanceof Error) {
      console.error("[product photo identity error]", error);
      return productPhotoIdentitySchema.parse({
        confidence: 0,
        note: "사진에서 상품 정보를 읽지 못했습니다. 바코드나 상품명을 직접 입력하세요.",
      });
    }

    throw error;
  }
}
