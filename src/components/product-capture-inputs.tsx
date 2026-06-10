"use client";

import { Camera } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { PhotoInput } from "@/components/photo-input";

export function ProductCaptureInputs({
  amountPhoto,
  barcode,
  loading,
  previewUrl,
  onAmountPhotoChange,
  onBarcodeDetected,
}: {
  readonly amountPhoto: File | null;
  readonly barcode: string;
  readonly loading: boolean;
  readonly previewUrl: string;
  readonly onAmountPhotoChange: (file: File | null) => void;
  readonly onBarcodeDetected: (barcode: string) => void;
}) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <BarcodeScanner disabled={loading} onDetected={onBarcodeDetected} />
        <PhotoInput
          label="섭취량 사진"
          icon={<Camera className="h-4 w-4" />}
          capture
          onChange={onAmountPhotoChange}
        />
      </div>
      {amountPhoto ? (
        <p className="truncate text-xs text-zinc-500">{amountPhoto.name}</p>
      ) : null}
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="업로드한 섭취량 사진"
          className="aspect-[4/3] w-full rounded-lg object-cover"
        />
      ) : null}
      {barcode.trim() && amountPhoto ? (
        <p className="rounded-md bg-blue-50 px-3 py-3 text-sm font-medium text-blue-800">
          바코드와 섭취량 사진을 함께 사용합니다.
        </p>
      ) : null}
    </>
  );
}
