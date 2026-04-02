const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm phân tích ghi chú thành danh sách lỗi và điểm trừ
async function parseViolationNote(note) {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        // Cấu hình để AI luôn trả về JSON
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Bạn là chuyên gia kiểm soát dữ liệu thi đua ký túc xá. 
    Dựa trên quy tắc chấm điểm sau:
    1. Không đi ăn: -10 điểm/học sinh.
    2. Chăn màn/giường không gọn: -5 điểm/lỗi (mỗi giường tính 1 lỗi).
    3. Nền phòng bẩn: -10 điểm/phòng.
    4. Không khóa cửa/Không treo chìa khóa: -10 điểm/phòng.
    5. Đổ rác muộn/không đổ rác: -10 điểm/lượt.

    Nhiệm vụ: Phân tích đoạn ghi chú sau và trích xuất các lỗi vi phạm, số lượng và tính tổng điểm trừ.
    Ghi chú: "${note}"

    Yêu cầu trả về định dạng JSON duy nhất như sau:
    {
      "violations": [
        {"criteria": "tên lỗi", "quantity": số_lượng, "penalty": tổng_điểm_trừ_mục_này}
      ],
      "totalDeduction": tổng_tất_cả_điểm_trừ
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Lỗi Gemini Parser:", error);
        return { violations: [], totalDeduction: 0 };
    }
}

module.exports = { parseViolationNote };