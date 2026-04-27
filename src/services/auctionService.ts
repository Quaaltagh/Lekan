const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CreateAuctionForm {
  name: string;
  species?: string;
  grade?: string;
  weight_kg: string;
  start_price: string;
  duration_hours: string;
  image_file?: File | null;
}

// Konversi File ke base64
async function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      base64: reader.result as string,
      mime: file.type,
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const auctionService = {
  create: async (sellerId: string, token: string, form: CreateAuctionForm) => {
    let image_base64: string | undefined;
    let image_mime: string | undefined;

    // Konversi gambar ke base64 jika ada
    if (form.image_file) {
      const result = await fileToBase64(form.image_file);
      image_base64 = result.base64;
      image_mime = result.mime;
    }

    const payload = {
      name: form.name,
      species: form.species || undefined,
      grade: form.grade || undefined,
      weight_kg: form.weight_kg,
      start_price: form.start_price,
      duration_hours: form.duration_hours,
      image_base64,
      image_mime,
    };

    const res = await fetch(`${API_URL}/api/auctions/seller/${sellerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal membuat lelang.');
    return data;
  },
};