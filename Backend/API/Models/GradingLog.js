import mongoose from 'mongoose';

const gradingLogSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    roomTitle: String,
    date: {
      type: Date,
      required: true
    },
    dayOfWeek: {
      type: String,
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
    },
    violations: [
      {
        type: { // Loại vi phạm
          type: String,
          enum: ['nen_ban', 'do_rac_muon', 'chan_man_cau_tha', 'khong_di_an', 'mtt_gio_ngu'],
          required: true
        },
        count: { // Số lần vi phạm
          type: Number,
          default: 1
        },
        note: String // Ghi chú
      }
    ],
    defaultScore: {
      type: Number,
      default: 120 // Điểm gốc mỗi ngày
    },
    totalPenalty: {
      type: Number,
      default: 0 // Tổng điểm trừ
    },
    finalScore: {
      type: Number,
      default: 120 // Điểm cuối (gốc - trừ)
    },
    supervisor: String, // Giáo viên phụ trách
    rawNote: String, // Ghi chú tự do (dùng cho quick-submit với AI)
    status: {
      type: Number,
      enum: [0, 1], // 0: Nháp, 1: Đã duyệt
      default: 0
    },
    approvedBy: String,
    approvedAt: Date,
    createdBy: String,
    updatedBy: String
  },
  { timestamps: true }
);

export default mongoose.model('GradingLog', gradingLogSchema);
