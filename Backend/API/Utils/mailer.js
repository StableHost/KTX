import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Gửi email thông báo chung
export const sendNotificationEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: '"Ban Quản Lý KTX" <' + (process.env.EMAIL_USER || 'your-email@gmail.com') + '>',
    to,
    subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

// Gửi email phê duyệt yêu cầu đón học sinh
export const sendPickupApprovalEmail = async (to, studentName, studentId, roomTitle, pickupTime, reason) => {
  const subject = `[Phê duyệt] Yêu cầu đón học sinh ${studentName}`;
  const htmlContent = `
    <h2 style="color: #2ecc71;">✓ Yêu cầu Đón học sinh Đã Được Phê duyệt</h2>
    <p>Kính thông báo,</p>
    <p>Yêu cầu đón học sinh sau đây đã được <strong>phê duyệt</strong>:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Họ tên học sinh:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${studentName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Mã số học viên:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${studentId}</td>
      </tr>
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Phòng:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${roomTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Thời gian đón:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${new Date(pickupTime).toLocaleString('vi-VN')}</td>
      </tr>
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Lý do:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${reason}</td>
      </tr>
    </table>
    <p style="color: #e74c3c;"><strong>Lưu ý:</strong> Vui lòng kiểm tra chữ ký của người đón trước khi để học sinh rời khỏi ký túc xá.</p>
    <p>Trân trọng,</p>
    <p><strong>Ban Quản Lý Ký Túc Xá</strong></p>
  `;

  return sendNotificationEmail(to, subject, htmlContent);
};

// Gửi email từ chối yêu cầu đón học sinh
export const sendPickupRejectionEmail = async (to, studentName, studentId, roomTitle, reason, rejectionReason) => {
  const subject = `[Từ chối] Yêu cầu đón học sinh ${studentName}`;
  const htmlContent = `
    <h2 style="color: #e74c3c;">✗ Yêu cầu Đón học sinh Đã Bị Từ chối</h2>
    <p>Kính thông báo,</p>
    <p>Yêu cầu đón học sinh sau đây đã được <strong>từ chối</strong>:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Họ tên học sinh:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${studentName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Mã số học viên:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${studentId}</td>
      </tr>
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Phòng:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${roomTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Lý do yêu cầu:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${reason}</td>
      </tr>
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Lý do từ chối:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${rejectionReason}</td>
      </tr>
    </table>
    <p>Nếu có thắc mắc, vui lòng liên hệ Ban Quản Lý Ký Túc Xá.</p>
    <p>Trân trọng,</p>
    <p><strong>Ban Quản Lý Ký Túc Xá</strong></p>
  `;

  return sendNotificationEmail(to, subject, htmlContent);
};

// Gửi email thông báo học sinh đã được trả
export const sendDropoffNotificationEmail = async (to, studentName, studentId, roomTitle, dropoffTime) => {
  const subject = `[Hoàn tất] Học sinh ${studentName} đã được trả`;
  const htmlContent = `
    <h2 style="color: #3498db;">✓ Học sinh Đã Được Trả</h2>
    <p>Kính thông báo,</p>
    <p>Học sinh sau đây đã hoàn tất quá trình đón/trả:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Họ tên học sinh:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${studentName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Mã số học viên:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${studentId}</td>
      </tr>
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Phòng:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${roomTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Thời gian trả:</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${new Date(dropoffTime).toLocaleString('vi-VN')}</td>
      </tr>
    </table>
    <p><strong>Lưu ý:</strong> Đơn yêu cầu đón/trả học sinh đã hoàn thành. Vui lòng cập nhật trạng thái học sinh trong hệ thống.</p>
    <p>Trân trọng,</p>
    <p><strong>Ban Quản Lý Ký Túc Xá</strong></p>
  `;

  return sendNotificationEmail(to, subject, htmlContent);
};