import GradingLog from '../Models/GradingLog.js';
import Room from '../Models/Room.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ExcelJS from 'exceljs';

// Tiêu chí chấm điểm
const GRADING_CRITERIA = {
  DEFAULT_SCORE: 120,
  PENALTIES: {
    'nen_ban': 10, // Nền phòng bẩn
    'do_rac_muon': 10, // Đổ rác muộn
    'chan_man_cau_tha': 5, // Chăn màn không gọn
    'khong_di_an': 10, // Không đi ăn
    'mtt_gio_ngu': 10 // Mất trật tự giờ ngủ
  }
};

/**
 * Hàm phân tích ghi chú bằng Gemini AI
 * Input: rawNote - Ghi chú tự do (VD: "ĐAN, MAI ko đi ăn, 3 giường chưa gọn")
 * Output: {
 *   violations: [{type, count, note}],
 *   totalDeduction: số điểm trừ
 * }
 */
const parseViolationNote = async (rawNote) => {
  try {
    // Kiểm tra API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY không được cấu hình trong .env');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // gemini-2.5-flash

    // Prompt yêu cầu Gemini phân tích ghi chú
    const prompt = `
Bạn là chuyên gia phân tích ghi chú vi phạm của học sinh trong ký túc xá. 
Phân tích ghi chú sau và trích xuất các vi phạm:

"${rawNote}"

Các loại vi phạm có sẵn:
- nen_ban: Nền phòng bẩn (trừ 10 điểm)
- do_rac_muon: Đổ rác muộn (trừ 10 điểm)
- chan_man_cau_tha: Chăn màn không gọn (trừ 5 điểm)
- khong_di_an: Không đi ăn (trừ 10 điểm)
- mtt_gio_ngu: Mất trật tự giờ ngủ (trừ 10 điểm)

Trả lời dưới dạng JSON:
{
  "violations": [
    {"type": "tên_loại", "count": số_lần, "note": "ghi chú chi tiết"}
  ],
  "analysis": "Giải thích ngắn"
}

Chỉ trả lại JSON, không có text khác.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Không thể phân tích ghi chú');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const violations = analysis.violations || [];

    // Tính tổng điểm trừ
    let totalDeduction = 0;
    violations.forEach((v) => {
      const penalty = GRADING_CRITERIA.PENALTIES[v.type] || 0;
      totalDeduction += penalty * (v.count || 1);
    });

    return {
      violations,
      totalDeduction,
      analysis: analysis.analysis
    };
  } catch (error) {
    console.error('Error parsing violation note:', error);
    // Trả về lỗi chi tiết để debug
    const errorMsg = error.message || 'Không thể phân tích ghi chú bằng AI';
    throw new Error(`Lỗi AI: ${errorMsg}`);
  }
};

/**
 * Analyze - Chỉ phân tích ghi chú bằng AI, không lưu
 * 
 * Request body:
 * {
 *   rawNote: "ĐAN, MAI ko đi ăn, 3 giường chưa gọn"
 * }
 */
export const analyzeViolation = async (req, res, next) => {
  try {
    const { rawNote } = req.body;
    
    if (!rawNote) {
      return res.status(400).json({
        message: 'Thiếu thông tin: rawNote'
      });
    }

    // Gọi AI để phân tích ghi chú
    const analysis = await parseViolationNote(rawNote);

    // Tính điểm cuối cùng
    const finalScore = Math.max(0, GRADING_CRITERIA.DEFAULT_SCORE - analysis.totalDeduction);

    res.status(200).json({
      message: 'Phân tích thành công',
      data: {
        violations: analysis.violations,
        totalDeduction: analysis.totalDeduction,
        finalScore,
        defaultScore: GRADING_CRITERIA.DEFAULT_SCORE,
        analysis: analysis.analysis
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Grade - Lưu điểm sau khi người dùng xác nhận
 * 
 * Request body:
 * {
 *   roomId: "A5" hoặc "65abc123...",
 *   date: "2026-03-03",
 *   rawNote: "ĐAN, MAI ko đi ăn, 3 giường chưa gọn",
 *   supervisor: "Nguyễn Văn A",
 *   violations: [{type, count, note}],
 *   finalScore: 100
 * }
 */
export const saveGrade = async (req, res, next) => {
  try {
    const { roomId, date, rawNote, supervisor, violations, finalScore } = req.body;
    
    if (!roomId || !date || !violations) {
      return res.status(400).json({
        message: 'Thiếu thông tin: roomId, date hoặc violations'
      });
    }

    // Lấy thông tin phòng
    let room;
    try {
      room = await Room.findById(roomId);
    } catch (e) {
      room = await Room.findOne({ Title: roomId.toUpperCase() });
    }
    
    if (!room) {
      room = await Room.findOne({ Title: roomId.toUpperCase() });
    }
    
    if (!room) {
      return res.status(404).json({ message: `Không tìm thấy phòng: ${roomId}` });
    }

    // Tính tổng điểm trừ từ violations
    let totalPenalty = 0;
    violations.forEach((v) => {
      const penalty = GRADING_CRITERIA.PENALTIES[v.type] || 0;
      totalPenalty += penalty * (v.count || 1);
    });

    // Lấy ngày trong tuần
    const dateObj = new Date(date);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = days[dateObj.getDay()];

    // Kiểm tra xem đã có kết quả chấm điểm cho ngày này chưa
    const existingGrade = await GradingLog.findOne({
      roomId: room._id,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    });

    let grade;
    if (existingGrade) {
      // Cập nhật
      grade = await GradingLog.findByIdAndUpdate(
        existingGrade._id,
        {
          violations,
          totalPenalty,
          finalScore: finalScore || Math.max(0, GRADING_CRITERIA.DEFAULT_SCORE - totalPenalty),
          supervisor,
          rawNote,
          updatedBy: req.user?.details?.CMND || 'System'
        },
        { new: true }
      );
    } else {
      // Tạo mới
      grade = await GradingLog.create({
        roomId: room._id,
        roomTitle: room.Title,
        date: new Date(date),
        dayOfWeek,
        violations,
        defaultScore: GRADING_CRITERIA.DEFAULT_SCORE,
        totalPenalty,
        finalScore: finalScore || Math.max(0, GRADING_CRITERIA.DEFAULT_SCORE - totalPenalty),
        supervisor,
        status: 0,
        rawNote,
        createdBy: req.user?.details?.CMND || 'System'
      });
    }

    res.status(201).json({
      message: 'Lưu kết quả chấm điểm thành công',
      data: grade
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick Submit - Gửi ghi chú tự do, AI phân tích
 * 
 * Request body:
 * {
 *   roomId: "A5" hoặc "65abc123...",
 *   date: "2026-03-03",
 *   rawNote: "ĐAN, MAI ko đi ăn, 3 giường chưa gọn",
 *   supervisor: "Nguyễn Văn A"
 * }
 */
export const quickSubmitGrade = async (req, res, next) => {
  try {
    const { roomId, date, rawNote, supervisor } = req.body;
    
    if (!roomId || !date || !rawNote) {
      return res.status(400).json({
        message: 'Thiếu thông tin: roomId, date hoặc rawNote'
      });
    }

    // Lấy thông tin phòng - tìm theo Title trước (nếu roomId là string như "A5"),
    // sau đó tìm theo _id (nếu roomId là MongoDB ObjectId)
    let room;
    try {
      // Nếu roomId là MongoDB ObjectId
      room = await Room.findById(roomId);
    } catch (e) {
      // Nếu không phải ObjectId, tìm theo Title
      room = await Room.findOne({ Title: roomId.toUpperCase() });
    }
    
    // Nếu vẫn không tìm thấy, tìm theo Title (dù là ObjectId hay string)
    if (!room) {
      room = await Room.findOne({ Title: roomId.toUpperCase() });
    }
    
    if (!room) {
      return res.status(404).json({ message: `Không tìm thấy phòng: ${roomId}` });
    }

    // Gọi AI để phân tích ghi chú
    const analysis = await parseViolationNote(rawNote);

    // Tính điểm cuối cùng
    const finalScore = Math.max(0, GRADING_CRITERIA.DEFAULT_SCORE - analysis.totalDeduction);

    // Lấy ngày trong tuần
    const dateObj = new Date(date);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = days[dateObj.getDay()];

    // Kiểm tra xem đã có kết quả chấm điểm cho ngày này chưa
    const existingGrade = await GradingLog.findOne({
      roomId: room._id,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    });

    let grade;
    if (existingGrade) {
      // Cập nhật
      grade = await GradingLog.findByIdAndUpdate(
        existingGrade._id,
        {
          violations: analysis.violations,
          totalPenalty: analysis.totalDeduction,
          finalScore,
          supervisor,
          rawNote,
          updatedBy: req.user?.details?.CMND || 'System'
        },
        { new: true }
      );
    } else {
      // Tạo mới
      grade = await GradingLog.create({
        roomId: room._id,
        roomTitle: room.Title,
        date: new Date(date),
        dayOfWeek,
        violations: analysis.violations,
        defaultScore: GRADING_CRITERIA.DEFAULT_SCORE,
        totalPenalty: analysis.totalDeduction,
        finalScore,
        supervisor,
        status: 0, // Chưa duyệt
        rawNote,
        createdBy: req.user?.details?.CMND || 'System'
      });
    }

    res.status(201).json({
      message: 'Lưu kết quả chấm điểm thành công',
      data: grade,
      aiAnalysis: analysis.analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Weekly Report - Xuất báo cáo chấm điểm trong tuần
 */
export const exportWeekly = async (req, res, next) => {
  try {
    // 1. Logic tính toán thời gian (Friday to Thursday)
    const dateParam = req.query.date || new Date().toISOString().split('T')[0];
    const today = new Date(dateParam);
    const dayOfWeek = today.getDay();
    // Tính khoảng cách từ hôm nay về Friday gần nhất (0=CN, 1=T2,..., 5=T6)
    const diff = today.getDate() - ((dayOfWeek + 2) % 7);
    
    const startOfWeek = new Date(new Date(today).setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekNumber = Math.ceil(startOfWeek.getDate() / 7); // Tính tuần tương đối

    // 2. Lấy dữ liệu từ Database trong khoảng tuần
    const grades = await GradingLog.find({
      date: { $gte: startOfWeek, $lte: endOfWeek }
    }).lean();

    // 3. Xây dựng ma trận dữ liệu theo Phòng và Thứ
    const matrixData = {};
    grades.forEach(g => {
      const room = g.roomTitle || 'N/A';
      // getDay() trả về 0 (CN) -> 6 (Thứ 7). Ta cần map lại cho đúng thứ tự bảng
      const dayIdx = new Date(g.date).getDay(); 
      if (!matrixData[room]) {
        matrixData[room] = { scores: {}, supervisor: g.supervisor || 'N/A' };
      }
      matrixData[room].scores[dayIdx] = g.finalScore;
    });

    // 4. Chuẩn bị danh sách và tính Xếp hạng (Rank)
    const daysArr = [5, 6, 0, 1, 2, 3, 4]; // Thứ 6, 7, CN, Thứ 2, 3, 4, 5 (Friday to Thursday)
    const roomList = Object.keys(matrixData).map(roomTitle => {
      let total = 0;
      const weeklyScores = {};
      daysArr.forEach(d => {
        const score = matrixData[roomTitle].scores[d] !== undefined ? matrixData[roomTitle].scores[d] : 120;
        weeklyScores[d] = score;
        total += score;
      });
      return { roomTitle, weeklyScores, total, supervisor: matrixData[roomTitle].supervisor };
    });

    roomList.sort((a, b) => b.total - a.total);
    let currentRank = 1;
    for (let i = 0; i < roomList.length; i++) {
      if (i > 0 && roomList[i].total < roomList[i - 1].total) currentRank = i + 1;
      roomList[i].rank = currentRank;
    }

    // 5. Khởi tạo Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Thi Đua Tuần');

    // Header 1: Tên trường
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'ĐOÀN TRƯỜNG PTDTNT THCS & THPT HUYỆN HÀM YÊN';
    worksheet.getCell('A1').font = { bold: true };

    // Header 2: Tiêu đề tuần (Bỏ alignment center theo yêu cầu)
    worksheet.mergeCells('A3:L3');
    const titleCell = worksheet.getCell('A3');
    const startDateStr = startOfWeek.toLocaleDateString('vi-VN');
    const endDateStr = endOfWeek.toLocaleDateString('vi-VN');
    titleCell.value = `TỔNG HỢP ĐIỂM THI ĐUA KÝ TÚC XÁ TUẦN ${weekNumber} NĂM ${startOfWeek.getFullYear()} (Từ ${startDateStr} đến ${endDateStr})`;
    titleCell.font = { bold: true, size: 14 };

    // 6. Dòng 6: Hiển thị THỨ TRONG TUẦN
    const headerValues = ['TT', 'PHÒNG', 'THỨ 6', 'THỨ 7', 'CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'TỔNG ĐIỂM', 'GV PHỤ TRÁCH', 'XL'];
    const headerRow = worksheet.getRow(6);
    headerRow.values = headerValues;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // 7. Đổ dữ liệu
    roomList.forEach((room, idx) => {
      const rowData = [
        idx + 1, 
        room.roomTitle,
        room.weeklyScores[5], room.weeklyScores[6], room.weeklyScores[0],
        room.weeklyScores[1], room.weeklyScores[2], room.weeklyScores[3], 
        room.weeklyScores[4],
        room.total,
        room.supervisor,
        room.rank
      ];

      const row = worksheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { horizontal: 'center' };
        
        // Bôi đỏ điểm vi phạm (< 120) ở các cột thứ
        if (colNumber >= 3 && colNumber <= 9 && cell.value < 120) {
          cell.font = { color: { argb: 'FFFF0000' }, bold: true };
        }
      });
    });

    // Cấu hình độ rộng cột
    worksheet.getColumn(2).width = 12; // Cột Phòng
    worksheet.getColumn(10).width = 25; // Cột TỔNG ĐIỂM
    worksheet.getColumn(11).width = 25; // Cột GV phụ trách

    // 8. Xuất file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Thi_Dua_Tuan_${weekNumber}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
};

/**
 * Export Monthly Report - Xuất báo cáo chấm điểm trong tháng
 */
export const exportMonthly = async (req, res, next) => {
  try {
    // 1. Xử lý thời gian
    const dateParam = req.query.date || new Date().toISOString().split('T')[0];
    const today = new Date(dateParam);
    const year = today.getFullYear();
    const month = today.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // 2. Lấy dữ liệu từ Database
    const grades = await GradingLog.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).lean();

    // 3. Chuyển đổi dữ liệu sang dạng Ma trận: { "A5": { 1: 120, 2: 110, ... } }
    const matrixData = {};
    grades.forEach(g => {
      const room = g.roomTitle || 'N/A';
      const day = new Date(g.date).getDate();
      if (!matrixData[room]) {
        matrixData[room] = { scores: {}, supervisor: g.supervisor || 'Chưa phân công' };
      }
      // Lưu điểm cuối cùng của ngày (mặc định 120 nếu không có lỗi)
      matrixData[room].scores[day] = g.finalScore;
    });

    // 4. Tính toán Tổng điểm và chuẩn bị danh sách để Xếp hạng
    const roomList = Object.keys(matrixData).map(roomTitle => {
      let total = 0;
      const dailyScores = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const score = matrixData[roomTitle].scores[d] !== undefined ? matrixData[roomTitle].scores[d] : 120;
        dailyScores[d] = score;
        total += score;
      }
      return {
        roomTitle,
        dailyScores,
        total,
        supervisor: matrixData[roomTitle].supervisor
      };
    });

    // 5. Logic Xếp hạng (Rank)
    roomList.sort((a, b) => b.total - a.total);
    let currentRank = 1;
    for (let i = 0; i < roomList.length; i++) {
      if (i > 0 && roomList[i].total < roomList[i - 1].total) {
        currentRank = i + 1;
      }
      roomList[i].rank = currentRank;
    }

    // 6. Khởi tạo Workbook và Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo Cáo Tháng');

    // Header 1: Tên trường
    worksheet.mergeCells('A1:E1');
    const schoolCell = worksheet.getCell('A1');
    schoolCell.value = 'ĐOÀN TRƯỜNG PTDTNT THCS & THPT HUYỆN HÀM YÊN';
    schoolCell.font = { bold: true, size: 11 };

    // Header 2: Tiêu đề báo cáo
    const lastColLetter = String.fromCharCode(65 + daysInMonth + 4); // Cột cuối (XL)
    worksheet.mergeCells(`A3:${lastColLetter}3`);
    const titleCell = worksheet.getCell('A3');
    titleCell.value = `TỔNG HỢP ĐIỂM THI ĐUA KÝ TÚC XÁ THÁNG ${month + 1} NĂM ${year}`;
    titleCell.font = { bold: true, size: 14 };
    // titleCell.alignment = { horizontal: 'center' };

    // Header 3: Dòng tiêu đề bảng (Dòng 6)
    const headerValues = ['TT', 'PHÒNG'];
    for (let d = 1; d <= daysInMonth; d++) headerValues.push(d);
    headerValues.push('TỔNG ĐIỂM', 'GIÁO VIÊN PHỤ TRÁCH', 'XL');

    const headerRow = worksheet.getRow(6);
    headerRow.values = headerValues;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // 7. Đổ dữ liệu vào hàng
    roomList.forEach((room, idx) => {
      const rowData = [idx + 1, room.roomTitle];
      for (let d = 1; d <= daysInMonth; d++) {
        rowData.push(room.dailyScores[d]);
      }
      rowData.push(room.total, room.supervisor, room.rank);

      const row = worksheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        // Kẻ bảng cho tất cả các ô
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { horizontal: 'center' };

        // Highlight màu đỏ cho những ngày bị trừ điểm (điểm < 120)
        if (colNumber > 2 && colNumber <= daysInMonth + 2 && cell.value < 120) {
          cell.font = { color: { argb: 'FFFF0000' }, bold: true };
        }
        
        // In đậm cột tổng và xếp loại
        if (colNumber === daysInMonth + 3 || colNumber === daysInMonth + 5) {
          cell.font = { bold: true };
        }
      });
    });

    // Cấu hình độ rộng cột
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(daysInMonth + 4).width = 25; // Cột GV phụ trách

    // 8. Xuất file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="THI_DUA_THANG_${month + 1}_${year}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Lỗi Export:", error);
    res.status(500).send("Lỗi server khi xuất file");
  }
};

/**
 * Get Weekly History - Lấy lịch sử chấm điểm trong tuần (JSON)
 */
export const getWeeklyHistory = async (req, res, next) => {
  try {
    // Logic tính toán thời gian (Friday to Thursday)
    const dateParam = req.query.date || new Date().toISOString().split('T')[0];
    const today = new Date(dateParam);
    const dayOfWeek = today.getDay();
    // Tính khoảng cách từ hôm nay về Friday gần nhất (0=CN, 1=T2,..., 5=T6)
    const diff = today.getDate() - ((dayOfWeek + 2) % 7);
    
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Lấy dữ liệu từ database, sắp xếp theo ngày mới nhất
    const grades = await GradingLog.find({
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    })
    .sort({ date: -1, createdAt: -1 })
    .lean();

    res.status(200).json({
      message: 'Lấy lịch sử chấm điểm tuần thành công',
      data: {
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
        totalRecords: grades.length,
        grades
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Grade - Xóa một bản ghi chấm điểm
 * 
 * Request params:
 * {
 *   id: "65abc123..."
 * }
 */
export const deleteGrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        message: 'Thiếu thông tin: id'
      });
    }

    const deletedGrade = await GradingLog.findByIdAndDelete(id);
    
    if (!deletedGrade) {
      return res.status(404).json({
        message: 'Không tìm thấy bản ghi chấm điểm'
      });
    }

    res.status(200).json({
      message: 'Xóa bản ghi chấm điểm thành công',
      data: deletedGrade
    });
  } catch (error) {
    next(error);
  }
};
