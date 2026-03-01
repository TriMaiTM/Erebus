// supabase/functions/ai-description/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Xử lý CORS Preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Lấy API Key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in Edge Function Secrets')
    }

    const { text, mode } = await req.json()
    if (!text) throw new Error('No text provided')

    // 3. Tạo Prompt
    let prompt = ""
    if (mode === 'fix') {
      prompt = `Sửa lỗi chính tả và viết lại câu sau cho tự nhiên, ngắn gọn (Tiếng Việt): "${text}"`
    }
    else if (mode === 'expand') {
      prompt = `
      Toàn bộ nội dung phải viết bằng tiếng Việt.
Giữ nguyên tên các section (Summary, Problem, Scope...) bằng tiếng Anh.

Bạn là Senior Technical Lead 8+ năm kinh nghiệm xây dựng sản phẩm SaaS.

Nhiệm vụ của bạn:
- Phân tích vấn đề trong input.
- Xác định rõ nguyên nhân kỹ thuật nếu có.
- Chuyển thành Planning Ticket thực tế dùng trong công ty product.
- Không được chỉ viết lại nội dung.
- Phải thể hiện tư duy hệ thống và quyết định kỹ thuật.

YÊU CẦU BẮT BUỘC:
1. Không sử dụng icon, emoji.
2. Không dùng markdown (** hoặc __).
3. Không viết văn hoa.
4. Viết ngắn gọn, thực tế.
5. Acceptance Criteria phải measurable (có thể kiểm chứng).
6. Nếu input là mục tiêu lớn, hãy coi đây là Sprint 0 planning task.

FORMAT OUTPUT (giữ đúng cấu trúc và xuống dòng):

Summary
(Mục tiêu cụ thể của task trong 1 câu rõ ràng)

Problem
- Mô tả vấn đề hiện tại
- Nguyên nhân kỹ thuật hoặc giới hạn hệ thống

Scope
- In scope:
- Out of scope:

Acceptance Criteria
- Điều kiện hoàn thành có thể kiểm chứng
- Không viết chung chung

Technical Direction
- Hướng giải pháp kỹ thuật cụ thể
- API, method, kiến trúc nếu có

Risks
- Rủi ro kỹ thuật hoặc vận hành nếu có

Input: "${text}"
`
    }
    else if (mode === 'subtasks') {
      prompt = `
VAI TRÒ: Bạn là một bộ tạo JSON nghiêm ngặt.
Bạn KHÔNG được trả lời giải thích.
Bạn KHÔNG được đưa lời khuyên.
Bạn CHỈ được xuất ra JSON hợp lệ.

NHIỆM VỤ:
Phân rã INPUT thành 5-7 công việc con cụ thể.
Mỗi công việc phải:
- Ngắn gọn
- Dạng mệnh lệnh
- Có thể thực hiện được

QUY TẮC BẮT BUỘC:
1. Output PHẢI là một JSON Array hợp lệ gồm các chuỗi.
2. Không dùng Markdown (không có \`\`\`).
3. Không có bất kỳ văn bản nào trước hoặc sau JSON.
4. Ngôn ngữ: Tiếng Việt.
5. Không thêm giải thích.

INPUT: "${text}"

VÍ DỤ OUTPUT:
["Thiết kế UI trên Figma", "Xây dựng layout HTML/CSS", "Triển khai API backend", "Viết unit test", "Kiểm thử tích hợp"]
`
    } else {
      prompt = text
    }

    // 4. Gọi Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2048
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API Error: ${errorData}`)
    }

    const data = await response.json()
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating text"
    if (mode === 'subtasks') {
      generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    // 5. Trả về kết quả thành công
    return new Response(
      JSON.stringify({ result: generatedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    // 6. QUAN TRỌNG: Trả về lỗi nhưng PHẢI CÓ CORS HEADERS
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 // Báo lỗi 500 để Frontend biết
      }
    )
  }
})