import { NextRequest, NextResponse } from 'next/server';

interface AdvisorRequestBody {
  ticker: string;
  assetName: string;
  category: string;
  price: number;
  prevClose: number;
  holdingQty?: number;
  avgPrice?: number;
  realizedPL?: number;
  prompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdvisorRequestBody;
    const {
      ticker,
      assetName,
      category,
      price,
      prevClose,
      holdingQty = 0,
      avgPrice = 0,
      realizedPL = 0,
      prompt,
    } = body;

    const pctChange = prevClose > 0 ? (((price - prevClose) / prevClose) * 100).toFixed(2) : '0.00';
    const unrealizedPL = holdingQty > 0 && avgPrice > 0 ? (price - avgPrice) * holdingQty : 0;

    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = process.env.AI_MODEL || 'deepseek-chat';

    const systemPrompt =
      'Kamu adalah asisten analisis investasi pasar modal dan portofolio RUPORA dalam Bahasa Indonesia. Jawab ringkas, objektif, terstruktur, dan tekankan bahwa ini investasi edukatif (bukan saran investasi keuangan pasti).';

    const userContext = [
      `Aset: ${ticker} (${assetName}) - Kategori: ${category}`,
      `Harga investasi terkini: Rp ${price.toLocaleString('id-ID')} (Perubahan sesi: ${pctChange}%)`,
      `Kepemilikan saat ini: ${holdingQty.toLocaleString('id-ID')} unit, Avg beli: Rp ${avgPrice.toLocaleString('id-ID')}`,
      `Unrealized P/L: Rp ${unrealizedPL.toLocaleString('id-ID')} | Realized P/L aset ini: Rp ${realizedPL.toLocaleString('id-ID')}`,
      `Pertanyaan user: ${prompt || 'Berikan ringkasan kondisi pergerakan aset, posisi portofolio, dan risiko investasi saat ini.'}`,
    ].join('\n');

    if (apiKey) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContext },
          ],
          temperature: 0.4,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply =
          data?.choices?.[0]?.message?.content?.trim() ||
          'Respons AI kosong, silakan coba lagi.';
        return NextResponse.json({ reply, source: 'llm' });
      }
    }

    const directionLabel =
      Number(pctChange) > 0
        ? `menguat +${pctChange}%`
        : Number(pctChange) < 0
        ? `melemah ${pctChange}%`
        : 'bergerak datar (0,00%)';

    const positionNote =
      holdingQty > 0
        ? `Kamu memegang ${holdingQty.toLocaleString('id-ID')} unit dengan rata-rata beli Rp ${avgPrice.toLocaleString('id-ID')} (posisi berjalan ${unrealizedPL >= 0 ? '+' : ''}Rp ${unrealizedPL.toLocaleString('id-ID')}).`
        : 'Kamu belum memegang unit aset ini di portofolio investasi saat ini.';

    const fallbackReply = [
      `• **Pergerakan ${ticker} (${category}):** Harga investasi berada di **Rp ${price.toLocaleString('id-ID')}**, ${directionLabel} dibanding penutupan sebelumnya.`,
      `• **Posisi & Realized P/L:** ${positionNote} Akumulasi profit/loss terealisasi pada aset ini: **${realizedPL >= 0 ? '+' : ''}Rp ${realizedPL.toLocaleString('id-ID')}**.`,
      `• **Catatan Investasi:** Perhatikan volatilitas harga dan ukuran lot/unit sebelum eksekusi beli atau jual. *(Analisis investasi edukatif, bukan nasihat keuangan).*`,
    ].join('\n');

    return NextResponse.json({ reply: fallbackReply, source: 'local-engine' });
  } catch {
    return NextResponse.json(
      { reply: 'Gagal memproses analisis AI saat ini.', source: 'error' },
      { status: 500 }
    );
  }
}
