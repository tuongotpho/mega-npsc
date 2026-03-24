
import { GoogleGenAI, Type } from "@google/genai";
import { Initiative, SimilarityInfo, InitiativeScope } from "../types";

// --- SECURITY & RATE LIMITING CONFIG ---
const RATE_LIMIT_WINDOW = 60000; // 1 phút
const MAX_REQUESTS_PER_MINUTE = 15; // Tối đa 15 request/phút
let requestTimestamps: number[] = [];

/**
 * Kiểm tra giới hạn tốc độ gọi API
 * @throws Error nếu vượt quá giới hạn
 */
const checkRateLimit = () => {
  const now = Date.now();
  // Lọc bỏ các request đã quá hạn window
  requestTimestamps = requestTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error(`Hệ thống đang bận. Vui lòng thử lại sau ${Math.ceil((RATE_LIMIT_WINDOW - (now - requestTimestamps[0])) / 1000)} giây để bảo đảm chất lượng dịch vụ.`);
  }
  
  requestTimestamps.push(now);
};
// ----------------------------------------

export const getAIInstance = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // Security Check: Đảm bảo API Key tồn tại
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    console.error("CRITICAL SECURITY ERROR: Gemini API Key is missing or invalid.");
    throw new Error("Lỗi cấu hình bảo mật: Không tìm thấy khóa API Gemini. Vui lòng kiểm tra file .env.local và đảm bảo VITE_GEMINI_API_KEY đã được thiết lập.");
  }
  return new GoogleGenAI({ apiKey });
};

export const AI_SYSTEM_INSTRUCTION = `Bạn là chuyên gia cố vấn chiến lược và quản lý sáng kiến tại NPSC Hub. 

QUY TẮC TRẢ LỜI:
1. Chỉ sử dụng thông tin trong "Dữ liệu hệ thống" được cung cấp bên dưới. Nếu không có thông tin, hãy trả lời "Dữ liệu hiện tại không có thông tin này".
2. Phải trả lời chính xác số lượng, tên đơn vị, cấp công nhận và tác giả nếu có trong dữ liệu.
3. KHÔNG tự bịa đặt thông tin ngoài kho dữ liệu.

QUY TẮC TRÌNH BÀY:
1. KHÔNG sử dụng các ký tự Markdown như dấu sao (*), dấu thăng (#), dấu backtick để định dạng văn bản.
2. Sử dụng dấu gạch đầu dòng (-) cho danh sách.
3. Tiêu đề viết hoa, xuống dòng rõ ràng giữa các ý.
4. Ngôn ngữ hành chính, chuyên nghiệp, súc tích.`;

const initiativeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Tên đầy đủ của sáng kiến" },
      authors: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Danh sách tên các tác giả"
      },
      unit: { 
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tên các đơn vị áp dụng/thực hiện"
      },
      year: { type: Type.INTEGER, description: "Năm công nhận" },
      content: { type: Type.STRING, description: "Tóm tắt ngắn gọn nội dung giải pháp" },
      field: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Lĩnh vực chuyên môn"
      },
      level: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING, enum: ["HLH", "NPSC", "NPC", "EVN"] },
        description: "Các cấp công nhận"
      }
    },
    required: ["title", "year"]
  }
};

const similaritySchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      tempId: { type: Type.STRING },
      score: { type: Type.NUMBER, description: "Điểm trùng lặp từ 0-100" },
      status: { type: Type.STRING, enum: ["new", "similar", "duplicate"] },
      reason: { type: Type.STRING, description: "Lý do đánh giá mức độ trùng lặp" },
      referenceTitle: { type: Type.STRING, description: "Tiêu đề sáng kiến cũ bị trùng (nếu có)" }
    },
    required: ["tempId", "score", "status", "reason"]
  }
};

// Schema cho form đăng ký đơn lẻ
const registerFormSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Tên sáng kiến viết hoa" },
    authors: { type: Type.STRING, description: "Chuỗi tên các tác giả, phân cách bằng dấu phẩy" },
    unit: { type: Type.STRING, description: "Chuỗi tên các đơn vị, phân cách bằng dấu phẩy" },
    content: { type: Type.STRING, description: "Tóm tắt nội dung giải pháp. QUAN TRỌNG: Trả về chuỗi văn bản có chứa ký tự xuống dòng (\\n) giữa các ý. Bắt đầu mỗi ý bằng gạch đầu dòng (-)." },
    field: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Danh sách lĩnh vực liên quan nhất" 
    },
    year: { type: Type.INTEGER, description: "Năm viết đơn" },
    monthsApplied: { 
      type: Type.INTEGER, 
      description: "Số tháng đã áp dụng thực tế tính đến thời điểm hiện tại. Hãy tìm ngày bắt đầu áp dụng trong văn bản và tính khoảng thời gian đến nay. Nếu không tìm thấy thông tin, trả về 0." 
    }
  },
  required: ["title", "authors", "unit", "content", "field", "monthsApplied"]
};

// Schema cho kết quả rà soát phê duyệt
const approvalReviewSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Phần trăm trùng lặp (0-100)" },
    isDuplicate: { type: Type.BOOLEAN, description: "True nếu điểm trùng lặp >= 70" },
    mostSimilarTitle: { type: Type.STRING, description: "Tên của sáng kiến cũ giống nhất trong kho" },
    mostSimilarId: { type: Type.STRING, description: "ID của sáng kiến cũ giống nhất (lấy từ dữ liệu input)" },
    reason: { type: Type.STRING, description: "Giải thích ngắn gọn tại sao lại giống hoặc khác nhau. Nêu rõ điểm trùng (ý tưởng, giải pháp, phạm vi)." }
  },
  required: ["score", "isDuplicate", "reason"]
};

// Schema cho người dùng Public tự check (Thêm lời khuyên & Source Check)
const publicCheckSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Phần trăm trùng lặp (0-100)" },
    verdict: { type: Type.STRING, enum: ["Thấp", "Trung bình", "Cao"], description: "Đánh giá mức độ trùng lặp" },
    similarTitle: { type: Type.STRING, description: "Tên sáng kiến cũ có nội dung tương tự nhất (nếu có)" },
    similarId: { type: Type.STRING, description: "ID của sáng kiến cũ tương tự (để tạo link)" },
    similarScope: { type: Type.STRING, enum: ["Company", "NPC"], description: "Nguồn gốc của sáng kiến bị trùng (Công ty hay Toàn NPC)" },
    advice: { type: Type.STRING, description: "Lời khuyên chi tiết. BẮT BUỘC: Sử dụng ký tự xuống dòng (\\n) giữa các đoạn và gạch đầu dòng (-) cho các ý. KHÔNG dùng Markdown." }
  },
  required: ["score", "verdict", "advice"]
};

// Schema cho kiểm tra tuân thủ mẫu đơn (Compliance Check)
const complianceCheckSchema = {
  type: Type.OBJECT,
  properties: {
    overallStatus: { type: Type.STRING, enum: ['pass', 'fail', 'warning'], description: "Trạng thái tổng thể của hồ sơ" },
    score: { type: Type.NUMBER, description: "Điểm chất lượng hồ sơ từ 0-100" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criteria: { type: Type.STRING, description: "Tên tiêu chí (vd: Mô tả hiện trạng, Tính mới...)" },
          isMet: { type: Type.BOOLEAN, description: "True nếu tiêu chí được đáp ứng tốt" },
          comment: { type: Type.STRING, description: "Nhận xét chi tiết của AI về tiêu chí này" }
        },
        required: ["criteria", "isMet", "comment"]
      }
    },
    missingSections: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách các mục bắt buộc nhưng bị thiếu trong nội dung" },
    suggestion: { type: Type.STRING, description: "Lời khuyên tổng quan để hoàn thiện hồ sơ" }
  },
  required: ["overallStatus", "score", "items", "missingSections", "suggestion"]
};

// --- MỚI: Hàm tạo Embedding Vector cho văn bản ---
export const generateEmbedding = async (text: string) => {
  // Không check rate limit ở đây vì hàm này thường được gọi trong vòng lặp batch, 
  // cần xử lý rate limit ở nơi gọi để linh hoạt hơn.
  const ai = getAIInstance();
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001', // SỬA LỖI: Cập nhật model name được hỗ trợ cho v1beta
      contents: [{ parts: [{ text }] }]
    });
    return response.embeddings?.[0]?.values;
  } catch (error) {
    console.error("Embedding Generation Error:", error);
    throw error; // Quăng lỗi để ApprovalPage.tsx có thể catch
  }
};

// --- MỚI: Hàm tính Cosine Similarity (Dùng cho Client-side RAG) ---
export const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

export const extractInitiativesFromPDF = async (base64Data: string, mimeType: string = "application/pdf") => {
  checkRateLimit();
  const ai = getAIInstance();

  const runExtraction = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Hãy phân tích tài liệu đính kèm và trích xuất danh sách các sáng kiến. Trả về định dạng JSON chính xác theo schema." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: initiativeSchema,
        temperature: 0.1
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  };

  try {
    return await runExtraction('gemini-3-flash-preview');
  } catch (error: any) {
    console.warn(`Extraction with gemini-3-flash-preview failed: ${error.message}. Retrying with gemini-2.5-flash...`);
    try {
      return await runExtraction('gemini-2.5-flash');
    } catch (retryError: any) {
      console.error("Error extracting PDF data (both attempts failed):", retryError);
      let msg = retryError.message || "Unknown error";
      if (msg.includes("500") || msg.includes("Internal error")) {
        msg = "Lỗi máy chủ AI (500). File PDF có thể quá lớn hoặc bị lỗi. Vui lòng thử file nhỏ hơn hoặc thử lại sau.";
      }
      throw new Error(msg);
    }
  }
};

export const checkSimilarityBatch = async (newItems: any[], existingInitiatives: Initiative[]) => {
  checkRateLimit();
  const ai = getAIInstance();
  
  const catalog = existingInitiatives.map(i => ({
    id: i.id,
    title: i.title,
    content: i.content?.substring(0, 100)
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `KHO DỮ LIỆU CŨ:\n${JSON.stringify(catalog)}\n\nDANH SÁCH MỚI CẦN KIỂM TRA:\n${JSON.stringify(newItems)}`,
      config: {
        systemInstruction: "Bạn là chuyên gia kiểm soát trùng lặp sáng kiến. Hãy so sánh danh sách mới với kho dữ liệu cũ. 'duplicate' nếu giống >80%, 'similar' nếu giống 40-80%, 'new' nếu dưới 40%. Trả về JSON.",
        responseMimeType: "application/json",
        responseSchema: similaritySchema,
        temperature: 0.1
      }
    });

    return response.text ? JSON.parse(response.text) : [];
  } catch (error) {
    console.error("Similarity Check Error:", error);
    return [];
  }
};

export const autoFillRegisterForm = async (data: string, isText: boolean = false) => {
  checkRateLimit();
  const ai = getAIInstance();
  const today = new Date();
  const currentDateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  try {
    const parts = isText 
      ? [{ text: `Dữ liệu trích xuất từ file văn bản:\n${data}` }]
      : [{ inlineData: { mimeType: 'application/pdf', data: data } }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          ...parts,
          { text: `Hãy đóng vai trò là thư ký nhập liệu. Phân tích dữ liệu được cung cấp (từ file đơn đăng ký sáng kiến) và trích xuất thông tin để điền vào form đăng ký.
          
          LƯU Ý QUAN TRỌNG: HÔM NAY LÀ NGÀY ${currentDateStr}.

          Yêu cầu:
          1. Tên sáng kiến: Viết hoa chữ cái đầu.
          2. Tác giả & Đơn vị: Liệt kê đầy đủ.
          3. Nội dung: Tóm tắt giải pháp thành các ý gãy gọn. 
             - BẮT BUỘC: Mỗi ý chính phải nằm trên một dòng riêng biệt.
             - BẮT BUỘC: Sử dụng ký tự xuống dòng (\\n) trước mỗi gạch đầu dòng (-).
             - Định dạng mong muốn:
               - Ý thứ nhất
               - Ý thứ hai
               - Ý thứ ba
             - Cấm: Không sử dụng ký tự Markdown như dấu sao (*), dấu thăng (#) hay in đậm. 
             - Văn phong: Chuyên nghiệp, rõ ràng, dễ đọc.
          4. Lĩnh vực: Chọn từ danh sách (Thiết bị điện, Thí nghiệm điện, Tư vấn, CNTT, SC MBA, Giải pháp, Hành chính, An toàn, Kinh doanh).
          5. Thời gian áp dụng: 
             - Hãy tìm thông tin "Thời điểm bắt đầu áp dụng" hoặc các cụm từ tương tự (ví dụ: "Ngày.../../...", "Bắt đầu từ...").
             - Tính số tháng từ thời điểm đó đến HÔM NAY (${currentDateStr}).
             - Trả về số nguyên (làm tròn xuống). 
             - Ví dụ: Nếu bắt đầu 15/01/2025 và hôm nay là 15/03/2025 -> trả về 2.
             - Nếu KHÔNG tìm thấy thông tin ngày áp dụng, hãy trả về 0.
          ` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: registerFormSchema,
        temperature: 0.1
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Auto Fill Error:", error);
    throw error;
  }
};

export const checkApprovalSimilarity = async (newItem: {title: string, content: string}, existingInitiatives: Initiative[]) => {
  checkRateLimit();
  const ai = getAIInstance();
  
  const catalog = existingInitiatives.map(i => ({
    id: i.id,
    title: i.title,
    content: i.content ? i.content.substring(0, 300) : "" 
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `KHO SÁNG KIẾN ĐÃ DUYỆT (REFERENCE_DB):\n${JSON.stringify(catalog)}\n\nSÁNG KIẾN CẦN RÀ SOÁT (TARGET):\nTiêu đề: ${newItem.title}\nNội dung: ${newItem.content}`,
      config: {
        systemInstruction: `Bạn là thẩm định viên sáng kiến. Nhiệm vụ:
        1. Tìm trong REFERENCE_DB xem có sáng kiến nào có nội dung hoặc ý tưởng cốt lõi trùng lặp với TARGET không.
        2. Đánh giá mức độ trùng lặp (score) từ 0-100%.
        3. Nếu score >= 70, đánh dấu isDuplicate = true.
        4. Trích xuất ID và Title của sáng kiến giống nhất (nếu có).
        5. Đưa ra lý do ngắn gọn, súc tích bằng tiếng Việt.`,
        responseMimeType: "application/json",
        responseSchema: approvalReviewSchema,
        temperature: 0.1
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Approval Check Error:", error);
    throw error;
  }
};

export const checkPublicSimilarity = async (draft: {title: string, content: string}, existingInitiatives: Initiative[]) => {
  checkRateLimit();
  const ai = getAIInstance();
  
  const catalog = existingInitiatives.map(i => ({
    id: i.id,
    title: i.title,
    content: i.content ? i.content.substring(0, 200) : "",
    scope: i.scope || 'Company'
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `KHO SÁNG KIẾN HIỆN CÓ:\n${JSON.stringify(catalog)}\n\nÝ TƯỞNG MỚI ĐANG SOẠN THẢO:\nTiêu đề: ${draft.title}\nNội dung: ${draft.content}`,
      config: {
        systemInstruction: `Bạn là Cố vấn Sáng kiến chuyên nghiệp của NPSC.
        
        NHIỆM VỤ:
        1. So sánh "Ý TƯỞNG MỚI" với "KHO SÁNG KIẾN HIỆN CÓ".
        2. Đánh giá điểm trùng lặp (score).
        3. Nếu tìm thấy sự trùng lặp đáng kể, hãy TRẢ VỀ ID và Scope của sáng kiến gốc để người dùng tham khảo.

        QUAN TRỌNG VỀ PHẠM VI DỮ LIỆU:
        - Dữ liệu cung cấp bao gồm cả sáng kiến Nội bộ (scope='Company') và sáng kiến Toàn NPC (scope='NPC').
        - Khi tìm thấy trùng lặp, BẮT BUỘC phải chỉ rõ trong phần 'advice' là sáng kiến đó thuộc nguồn nào (Nội bộ hay NPC).
        - Trường 'similarScope' phải trả về chính xác 'Company' hoặc 'NPC' nếu tìm thấy.

        QUY ĐỊNH ĐỊNH DẠNG VĂN BẢN TRẢ VỀ (TUÂN THỦ TUYỆT ĐỐI CHO TRƯỜNG "advice"):
        1. TRẢ VỀ VĂN BẢN THUẦN (PLAIN TEXT).
        2. TUYỆT ĐỐI KHÔNG sử dụng ký tự Markdown như: dấu thăng (#) cho tiêu đề, dấu sao (*) để in đậm/nghiêng.
        3. Để phân tách các ý, BẮT BUỘC sử dụng dấu gạch đầu dòng (-) ở đầu dòng.
        4. Sử dụng ký tự xuống dòng (\\n) để tách biệt rõ ràng các đoạn văn.
        5. Trình bày thoáng, dễ đọc.

        NỘI DUNG LỜI KHUYÊN:
        - Nếu Score > 50: Cảnh báo trùng lặp, chỉ ra tên sáng kiến cũ giống nhất (ghi rõ nguồn Công ty hay NPC). Gạch đầu dòng các điểm cần điều chỉnh để tạo khác biệt.
        - Nếu Score <= 50: Khen ngợi tính mới. Gạch đầu dòng các gợi ý để phát triển thêm.
        `,
        responseMimeType: "application/json",
        responseSchema: publicCheckSchema,
        temperature: 0.2
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Public Check Error:", error);
    throw error;
  }
};

export const validateInitiativeCompliance = async (data: { title: string, content: string, monthsApplied: number }) => {
  checkRateLimit();
  const ai = getAIInstance();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `NỘI DUNG SÁNG KIẾN:\nTiêu đề: ${data.title}\nThời gian áp dụng: ${data.monthsApplied} tháng\nNội dung chi tiết: ${data.content}`,
      config: {
        systemInstruction: `Bạn là Cán bộ Thẩm định Sáng kiến tại EVNNPC. Nhiệm vụ của bạn là kiểm tra xem nội dung sáng kiến có đáp ứng đầy đủ các yêu cầu trong "Mẫu Đơn yêu cầu công nhận sáng kiến" (theo Quyết định 1271/QĐ-EVNNPC) hay không.

        CÁC TIÊU CHÍ BẮT BUỘC (CHECKLIST):
        1. [Mô tả hiện trạng]: Có nêu rõ tình trạng kỹ thuật/tổ chức sản xuất *trước khi* có sáng kiến không? Có chỉ rõ nhược điểm của giải pháp cũ không?
        2. [Nội dung giải pháp]: Có mô tả chi tiết bản chất, các bước thực hiện của giải pháp mới không?
        3. [Tính mới/Sáng tạo]: Có nêu rõ điểm cải tiến, khắc phục được nhược điểm cũ không?
        4. [Thời gian áp dụng]: Hệ thống ghi nhận đã áp dụng ${data.monthsApplied} tháng. Yêu cầu bắt buộc là >= 3 tháng. Nếu < 3 tháng, tiêu chí này KHÔNG ĐẠT.
        5. [Hiệu quả]: Có so sánh lợi ích kinh tế/xã hội (Số tiền làm lợi) so với giải pháp cũ không? Hoặc có nêu rõ hiệu quả về mặt kỹ thuật/an toàn/môi trường không?
        6. [Khả năng nhân rộng]: Có đề cập đến khả năng áp dụng cho các đơn vị khác không?

        NHIỆM VỤ:
        - Đánh giá từng tiêu chí trên là True (Đạt) hay False (Không đạt).
        - Đưa ra nhận xét ngắn gọn cho từng tiêu chí.
        - Liệt kê các phần bị thiếu.
        - Tính điểm chất lượng hồ sơ (0-100).
        - Đưa ra kết luận tổng thể (pass/fail/warning).`,
        responseMimeType: "application/json",
        responseSchema: complianceCheckSchema,
        temperature: 0.1
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Compliance Check Error:", error);
    return {
      overallStatus: 'warning',
      score: 0,
      items: [],
      missingSections: ["Lỗi kết nối AI, không thể thẩm định."],
      suggestion: "Vui lòng thử lại sau."
    };
  }
};
