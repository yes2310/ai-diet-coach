export async function readJsonResponse(response: Response): Promise<unknown | null> {
  try {
    const body: unknown = await response.json();
    return body;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return null;
    }

    throw error;
  }
}
