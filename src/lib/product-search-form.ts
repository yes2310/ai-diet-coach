export type ProductSearchFormInput = {
  readonly amountPhoto: File | null;
  readonly barcode: string;
  readonly query: string;
};

export function hasProductSearchInput(input: ProductSearchFormInput) {
  return (
    Boolean(input.amountPhoto) ||
    Boolean(input.barcode.trim()) ||
    Boolean(input.query.trim())
  );
}

export function buildProductSearchFormData(input: ProductSearchFormInput) {
  const formData = new FormData();

  if (input.amountPhoto) {
    formData.append("image", input.amountPhoto);
  }

  formData.append("barcode", input.barcode);
  formData.append("query", input.query);

  return formData;
}
