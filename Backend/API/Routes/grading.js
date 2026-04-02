import express from 'express';
import {
  analyzeViolation,
  saveGrade,
  quickSubmitGrade,
  exportWeekly,
  exportMonthly,
  getWeeklyHistory,
  deleteGrade
} from '../Controllers/grading.js';

const router = express.Router();

// POST - Phân tích ghi chú bằng AI (không lưu)
router.post('/analyze', analyzeViolation);

// POST - Lưu điểm sau khi người dùng xác nhận
router.post('/save', saveGrade);

// POST - Quick Submit (gửi ghi chú tự do, AI phân tích & lưu ngay)
router.post('/quick-submit', quickSubmitGrade);

// GET - Lấy lịch sử chấm điểm tuần (JSON)
router.get('/history/weekly', getWeeklyHistory);

// GET - Xuất báo cáo tuần
router.get('/export/weekly', exportWeekly);

// GET - Xuất báo cáo tháng
router.get('/export/monthly', exportMonthly);

// DELETE - Xóa chấm điểm
router.delete('/:id', deleteGrade);

export default router;
