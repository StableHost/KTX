import mongoose from 'mongoose';

const PickupDropoffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentInfo: {
      HoTen: {
        type: String,
        required: true
      },
      MHV: {
        type: String,
        required: true
      },
      CMND: {
        type: String,
        required: true
      },
      roomTitle: {
        type: String,
        required: true
      },
      roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
      }
    },
    pickupPerson: {
      fullName: {
        type: String,
        required: true
      },
      relationship: {
        type: String,
        required: true
      },
      idCard: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      }
    },
    pickupTime: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    pickupSignature: {
      type: String,
      default: ''
    },
    dropoffTime: {
      type: Date,
      default: null
    },
    dropoffSignature: {
      type: String,
      default: ''
    },
    status: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0
      // 0: Chờ phê duyệt
      // 1: Đã phê duyệt - Đã đón
      // 2: Đã trả
      // 3: Từ chối
    },
    approvedBy: {
      type: String,
      default: ''
    },
    approverEmail: {
      type: String,
      default: ''
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedReason: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      required: true
    },
    updatedBy: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('PickupDropoff', PickupDropoffSchema);
