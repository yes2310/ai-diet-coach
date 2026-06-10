"use client";

import { Barcode, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  barcodePhotoScanFailureMessage,
  decodeProductBarcodeFromImageFile,
} from "@/lib/barcode-scanner";

export function BarcodeScanner({
  disabled,
  onDetected,
}: {
  readonly disabled?: boolean;
  readonly onDetected: (barcode: string) => void;
}) {
  const [decoding, setDecoding] = useState(false);
  const [message, setMessage] = useState("");

  async function readBarcodePhoto(file: File | null) {
    if (!file || disabled || decoding) {
      return;
    }

    setDecoding(true);
    setMessage("사진에서 바코드를 읽고 있습니다.");

    try {
      const barcode = await decodeProductBarcodeFromImageFile(file);

      if (!barcode) {
        setMessage(barcodePhotoScanFailureMessage);
        return;
      }

      setMessage(`바코드 ${barcode} 추출됨`);
      onDetected(barcode);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(barcodePhotoScanFailureMessage);
        return;
      }

      throw error;
    } finally {
      setDecoding(false);
    }
  }

  const unavailable = Boolean(disabled) || decoding;

  return (
    <div className="space-y-2">
      <label
        aria-disabled={unavailable}
        className={[
          "flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white hover:bg-zinc-800",
          unavailable ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ].join(" ")}
      >
        {decoding ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Barcode className="h-4 w-4" aria-hidden />
        )}
        {decoding ? "바코드 읽는 중" : "바코드 촬영"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={unavailable}
          onChange={(event) => {
            const selectedFile = event.currentTarget.files?.[0] ?? null;
            event.currentTarget.value = "";
            void readBarcodePhoto(selectedFile);
          }}
          className="sr-only"
        />
      </label>

      {message ? (
        <p aria-live="polite" className="text-xs text-zinc-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
