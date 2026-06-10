export async function readJsonRequest(request: Request): Promise<unknown | null> {
  try {
    const body: unknown = await request.json();
    return body;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return null;
    }

    throw error;
  }
}
