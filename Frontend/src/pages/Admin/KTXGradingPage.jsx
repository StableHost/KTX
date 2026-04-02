import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import DatePicker from '../../components/DatePicker';
import { 
  Send, 
  FileSpreadsheet, 
  ClipboardCheck, 
  Loader2, 
  History, 
  AlertCircle,
  CheckCircle2,
  Building2,
  Lock,
  WarningCircle
} from 'lucide-react';
import { 
  canGradePoint, 
  canEditGrade, 
  canExportReport,
  getPermissionsByRole,
  getRoleDescription,
  ROLES 
} from '../../utils/permissions';
import { RoleBadge, PermissionDeniedAlert } from '../../components/PermissionControl/PermissionControl';

const KTXGradingPage = () => {
  // State quản lý dữ liệu nhập
  const [targetId, setTargetId] = useState('');
  const [rawNote, setRawNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  
  // State cho Modal xác nhận
  const [showModal, setShowModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [editableViolations, setEditableViolations] = useState([]);
  const [editableFinalScore, setEditableFinalScore] = useState(120);
  
  // State quản lý danh sách đã chấm trong phiên làm việc
  const [history, setHistory] = useState([]);
  
  // State cho chọn ngày
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State cho quyền
  const [userRole, setUserRole] = useState('student');
  const [userInfo, setUserInfo] = useState(null);
  const [permissions, setPermissions] = useState({});
  
  // State cho xem chi tiết lỗi
  const [showViolationsDetail, setShowViolationsDetail] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  
  // State cho xem danh sách học sinh
  const [showStudentsDetail, setShowStudentsDetail] = useState(false);
  const [selectedRoomStudents, setSelectedRoomStudents] = useState(null);
  
  const baseURL = process.env.REACT_APP_API_URL;

  // Lấy thông tin người dùng từ localStorage khi component mount
  useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser) {
        // Tái sử dụng role string từ login response (backend trả về role.role)
        const role = currentUser.role?.role?.toLowerCase() || 
                     currentUser.details?.role?.toLowerCase() || 
                     'student';
        setUserRole(role);
        setUserInfo(currentUser);
        setPermissions(getPermissionsByRole(role));
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }, []);

  // 1. Xử lý gửi ghi chú cho Gemini phân tích (KHÔNG lưu ngay)
  const handleAISubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra quyền chấm điểm
    if (!canGradePoint(userRole)) {
      toast.error('❌ Bạn không có quyền chấm điểm. Chỉ BCH có thể thực hiện chức năng này.');
      return;
    }
    
    if (!targetId || !rawNote) return;

    setLoading(true);
    try {
      // Bước 1: Gọi API phân tích (không lưu)
      const response = await axios.post(`${baseURL}/grading/analyze`, {
        rawNote
      });

      const data = response.data.data;
      
      // Lưu kết quả AI vào state
      setAiSuggestion({
        violations: data.violations,
        totalDeduction: data.totalDeduction,
        finalScore: data.finalScore,
        analysis: data.analysis
      });
      
      // Khởi tạo dữ liệu có thể chỉnh sửa
      setEditableViolations(data.violations.map(v => ({...v})));
      setEditableFinalScore(data.finalScore);
      
      // Hiển thị Modal
      setShowModal(true);
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      toast.error(error.response?.data?.message || "Không thể kết nối với Server. Hãy kiểm tra Backend chạy trên port 8800!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý lưu điểm sau khi người dùng xác nhận
  const handleConfirmSave = async () => {
    // Kiểm tra quyền sửa điểm
    if (!canEditGrade(userRole)) {
      toast.error('❌ Bạn không có quyền sửa điểm. Chỉ BCH và Admin có thể thực hiện chức năng này.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${baseURL}/grading/save`, {
        roomId: targetId,
        date: selectedDate,
        rawNote,
        supervisor: userInfo?.details?.HoTen || 'Admin',
        violations: editableViolations,
        finalScore: editableFinalScore
      });

      const data = response.data.data;
      setGradingResult({
        targetId: data.roomTitle,
        score: data.finalScore,
        analysis: data.violations.map(v => ({
          criteria: v.type.replace(/_/g, ' '),
          quantity: v.count,
          penalty: (v.count || 1) * (getPenalty(v.type) || 0),
          note: v.note
        }))
      });
      
      // Refresh lịch sử từ API
      await handleViewWeeklyHistory();
      
      setRawNote(''); // Reset ô nhập ghi chú
      setShowModal(false); // Đóng modal
      
      toast.success('✅ Đã lưu kết quả chấm điểm thành công!');
    } catch (error) {
      console.error("Lỗi lưu điểm:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu điểm!");
    } finally {
      setLoading(false);
    }
  };

  // 3. Cập nhật vi phạm khi người dùng chỉnh sửa
  const handleViolationChange = (index, field, value) => {
    const newViolations = [...editableViolations];
    newViolations[index][field] = field === 'count' ? parseInt(value) || 1 : value;
    setEditableViolations(newViolations);
    
    // Tính lại điểm
    let totalPenalty = 0;
    newViolations.forEach(v => {
      totalPenalty += (getPenalty(v.type) || 0) * (v.count || 1);
    });
    setEditableFinalScore(Math.max(0, 120 - totalPenalty));
  };

  // 4. Xóa vi phạm
  const handleRemoveViolation = (index) => {
    const newViolations = editableViolations.filter((_, i) => i !== index);
    setEditableViolations(newViolations);
    
    // Tính lại điểm
    let totalPenalty = 0;
    newViolations.forEach(v => {
      totalPenalty += (getPenalty(v.type) || 0) * (v.count || 1);
    });
    setEditableFinalScore(Math.max(0, 120 - totalPenalty));
  };

  // 5. Thêm vi phạm mới
  const handleAddViolation = () => {
    const newViolations = [...editableViolations, {
      type: 'nen_ban',
      count: 1,
      note: ''
    }];
    setEditableViolations(newViolations);
    
    // Tính lại điểm
    let totalPenalty = 0;
    newViolations.forEach(v => {
      totalPenalty += (getPenalty(v.type) || 0) * (v.count || 1);
    });
    setEditableFinalScore(Math.max(0, 120 - totalPenalty));
  };

  // Helper: Lấy điểm trừ theo loại vi phạm
  const getPenalty = (type) => {
    const penalties = {
      'nen_ban': 10,
      'do_rac_muon': 10,
      'chan_man_cau_tha': 5,
      'khong_di_an': 10,
      'mtt_gio_ngu': 10
    };
    return penalties[type] || 0;
  };

  // Helper: Chuyển đổi ngày từ DD/MM/YYYY sang YYYY-MM-DD
  const handleDateChange = (dateString) => {
    if (!dateString) return;
    // dateString đang ở dạng DD/MM/YYYY
    const [day, month, year] = dateString.split('/');
    const isoDate = `${year}-${month}-${day}`;
    setSelectedDate(isoDate);
  };

  // 6. Xem lịch sử chấm điểm trong tuần
  const handleViewWeeklyHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/rooms/grades/all`);
      const data = response.data.data;
      
      // Cập nhật history với dữ liệu từ server
      setHistory(data);
      
      toast.success(`✅ Đã tải ${data.length} phòng với điểm chấm`);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tải lịch sử chấm điểm!");
    } finally {
      setLoading(false);
    }
  };

  // 7. Xóa bản ghi chấm điểm
  const handleDeleteGrade = async (recordId) => {
    if (!window.confirm('Xác nhận xóa bản ghi chấm điểm này?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${baseURL}/grading/${recordId}`);
      
      // Refresh lịch sử từ API
      await handleViewWeeklyHistory();
      
      toast.success('Đã xóa bản ghi chấm điểm thành công!');
    } catch (error) {
      console.error("Lỗi xóa bản ghi:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa bản ghi!");
    } finally {
      setLoading(false);
    }
  };

  // 8. Xem chi tiết lỗi của phòng
  const handleViewViolations = (record) => {
    setSelectedGrade(record);
    setShowViolationsDetail(true);
  };

  // 9. Xem danh sách học sinh trong phòng
  const handleViewStudents = (record) => {
    // Sử dụng dữ liệu students từ API response
    setSelectedRoomStudents({
      room: record.Title,
      students: record.students || []
    });
    setShowStudentsDetail(true);
  };

  // 2. Xử lý xuất file Excel (Trang tính Tuần)
  const handleExportExcel = async () => {
    // Kiểm tra quyền xuất báo cáo
    if (!canExportReport(userRole)) {
      toast.error('❌ Bạn không có quyền xuất báo cáo. Chỉ BCH và Admin có thể thực hiện chức năng này.');
      return;
    }
    
    try {
      const response = await axios.get(`${baseURL}/grading/export/weekly`, {
        responseType: 'blob',
        params: { date: selectedDate }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateObj = new Date(selectedDate);
      const weekNum = Math.ceil(dateObj.getDate() / 7);
      link.setAttribute('download', `THI_DUA_KTX_TUAN_${weekNum}_${dateObj.toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('✅ Xuất file báo cáo thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xuất file trang tính!");
    }
  };

  // 3. Xử lý xuất file Excel tháng
  // 3. Xử lý xuất file Excel tháng
  // const handleExportMonthly = async () => {
  //   try {
  //     const response = await axios.get(`${baseURL}/grading/export/monthly`, {
  //       responseType: 'blob',
  //       params: { date: selectedDate }
  //     });
  //     
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     const dateObj = new Date(selectedDate);
  //     const month = dateObj.getMonth() + 1;
  //     const year = dateObj.getFullYear();
  //     link.setAttribute('download', `THI_DUA_KTX_THANG_${month}_${year}.xlsx`);
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   } catch (error) {
  //     alert(error.response?.data?.message || "Lỗi khi xuất file trang tính!");
  //   }
  // };

  return (
    <div className="ktx-page">
      {/* Modal xác nhận */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🤖 Kết quả phân tích AI</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="ai-suggestion-box">
                <p className="ai-analysis">
                  <strong>Phân tích:</strong> {aiSuggestion?.analysis}
                </p>
              </div>

              <div className="grade-summary">
                <div className="summary-item">
                  <span>Phòng:</span>
                  <strong>{targetId}</strong>
                </div>
                <div className="summary-item">
                  <span>Điểm gốc:</span>
                  <strong>120</strong>
                </div>
                <div className="summary-item">
                  <span>Tổng trừ:</span>
                  <strong className="penalty-text">-{120 - editableFinalScore}</strong>
                </div>
                <div className="summary-item final">
                  <span>Điểm cuối:</span>
                  <strong className="final-score-text">{editableFinalScore}</strong>
                </div>
              </div>

              <h3>Chi tiết vi phạm (có thể chỉnh sửa)</h3>
              <div className="violations-list">
                {editableViolations.map((violation, index) => (
                  <div key={index} className="violation-item">
                    <div className="violation-info">
                      <label>Loại vi phạm:</label>
                      <select 
                        value={violation.type}
                        onChange={(e) => handleViolationChange(index, 'type', e.target.value)}
                      >
                        <option value="nen_ban">Nền bẩn</option>
                        <option value="do_rac_muon">Đổ rác muộn</option>
                        <option value="chan_man_cau_tha">Chăn màn không gọn</option>
                        <option value="khong_di_an">Không đi ăn</option>
                        <option value="mtt_gio_ngu">Mất trật tự giờ ngủ</option>
                      </select>
                    </div>
                    
                    <div className="violation-info">
                      <label>Số lần:</label>
                      <input 
                        type="number" 
                        min="1"
                        value={violation.count || 1}
                        onChange={(e) => handleViolationChange(index, 'count', e.target.value)}
                      />
                    </div>

                    <div className="violation-info full-width">
                      <label>Ghi chú:</label>
                      <input 
                        type="text"
                        value={violation.note || ''}
                        onChange={(e) => handleViolationChange(index, 'note', e.target.value)}
                      />
                    </div>

                    <div className="violation-penalty">
                      Trừ: <strong>{(getPenalty(violation.type) || 0) * (violation.count || 1)}đ</strong>
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveViolation(index)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {editableViolations.length === 0 && (
                <p className="no-violations">✅ Không có vi phạm nào</p>
              )}

              <button 
                className="btn-add-violation"
                onClick={handleAddViolation}
              >
                ➕ Thêm vi phạm mới
              </button>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="btn-confirm" onClick={handleConfirmSave} disabled={loading}>
                Đồng ý và Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="ktx-header">
        <div className="header-content">
          <div className="logo-section">
            <Building2 className="icon-blue" size={32} />
            <div>
              <h1>Quản Lý Thi Đua KTX (AI Mode)</h1>
              <p>Trường PTDTNT THCS và THPT Hàm Yên</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info-section">
              <div className="user-role">
                <span className="label">Vai trò:</span>
                <RoleBadge role={userRole} detailed={true} />
              </div>
              {userInfo && (
                <div className="user-name">
                  <span>{userInfo.details?.HoTen || 'Người dùng'}</span>
                </div>
              )}
            </div>
            <div className="btn-group">
              <div className="date-picker-group">
                <label htmlFor="report-date">Chọn ngày:</label>
                <DatePicker
                  setSelectedDate={handleDateChange}
                  defaultValue={selectedDate}
                  isStudent={false}
                  className=""
                />
              </div>
              {canExportReport(userRole) ? (
                <button className="btn-export" onClick={handleExportExcel}>
                  <FileSpreadsheet size={20} />
                  <span>Xuất Tuần</span>
                </button>
              ) : (
                <button className="btn-export btn-disabled" disabled title="Bạn không có quyền xuất báo cáo">
                  <FileSpreadsheet size={20} />
                  <span>Xuất Tuần</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ktx-main">
        <div className="grid-layout">
          
          {/* Phần thông báo quyền */}
          {!canGradePoint(userRole) && (
            <div className="permission-alert">
              <PermissionDeniedAlert 
                feature="Chấm điểm thi đua" 
                requiredRole="BCH / Admin"
              />
            </div>
          )}
          
          {/* Cột trái: Form nhập liệu AI */}
          <section className="form-section">
            <div className="card">
              <div className="card-header">
                <ClipboardCheck className="icon-green" size={24} />
                <h2>Chấm điểm nhanh với Gemini AI</h2>
              </div>
              
              <form onSubmit={handleAISubmit}>
                <div className="form-row">
                  <div className="input-group">
                    <label>Phòng / Lớp</label>
                    <input 
                      type="text" 
                      placeholder="VD: A5, B12, E22..." 
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Ngày chấm điểm</label>
                    <DatePicker
                      setSelectedDate={handleDateChange}
                      defaultValue={selectedDate}
                      isStudent={false}
                      className=""
                    />
                  </div>

                  <button type="submit" className="btn-submit-inline" disabled={loading || !canGradePoint(userRole)}>
                    Phân tích
                    {/* {loading ? <Loader2 className="spinner" size={16} /> : <><Send size={16} /> Phân tích</>} */}
                  </button>
                </div>

                <div className="input-group">
                  <label>Ghi chú vi phạm (Ngôn ngữ tự nhiên)</label>
                  <textarea 
                    placeholder="VD: Đan, Mai ko đi ăn, 2 giường chưa gọn, nền phòng có rác..." 
                    value={rawNote}
                    onChange={(e) => setRawNote(e.target.value)}
                    rows={3}
                    required
                  />
                  <p className="hint">AI sẽ tự động đọc hiểu và quy đổi ra điểm trừ theo tiêu chí 2025-2026</p>
                </div>
                {!canGradePoint(userRole) && (
                  <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={16} />
                    <span>Chỉ BCH có thể chấm điểm</span>
                  </div>
                )}
              </form>
            </div>

            {/* Kết quả phân tích tức thì */}
            {gradingResult && (
              <div className="card result-card animate-fade-in">
                <div className="result-header">
                  <h3>Kết quả: {gradingResult.targetId}</h3>
                  <div className="final-score">
                    <span>Điểm ngày:</span>
                    <strong>{gradingResult.score}</strong>
                  </div>
                </div>
                <ul className="violation-details">
                  {gradingResult.analysis.map((item, idx) => (
                    <li key={idx}>
                      <AlertCircle size={14} className="icon-red" />
                      <span className="desc">{item.criteria} (x{item.quantity})</span>
                      <span className="points">-{item.penalty}đ</span>
                    </li>
                  ))}
                </ul>
                <div className="success-msg">
                  <CheckCircle2 size={16} /> Đã đồng bộ vào dữ liệu tuần
                </div>
              </div>
            )}
          </section>

          {/* Cột phải: Lịch sử chấm gần đây */}
          <section className="history-section">
            <div className="card">
              <div className="card-header">
                <History size={24} />
                <h2>Lịch sử chấm gần đây</h2>
              </div>
              <div className="history-controls">
                <DatePicker
                  setSelectedDate={handleDateChange}
                  defaultValue={selectedDate}
                  isStudent={false}
                  className="date-input-small-custom"
                />
                <button className="btn-view-history" onClick={handleViewWeeklyHistory} disabled={loading}>
                  Tra cứu điểm
                  {/* {loading ? <Loader2 className="spinner" size={16} /> : 'Tra cứu điểm'} */}
                </button>
              </div>
              {loading ? (
                <div className="text-center py-8">Đang tải dữ liệu...</div>
              ) : (
                <div className="grading-history-table">
                  {history.length === 0 ? (
                    <p className="empty">Chưa có dữ liệu chấm trong phiên này.</p>
                  ) : (
                    <table className="history-data-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Phòng</th>
                          <th>Điểm</th>
                          <th>Ghi chú</th>
                          <th>Ngày chấm</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((log, i) => (
                          <tr key={i} className="history-row">
                            <td className="row-index">{i + 1}</td>
                            <td className="room-name">
                              <strong>{log.Title}</strong>
                            </td>
                            <td className="score">
                              <span className="badge-score">{log.gradings && log.gradings.length && log.gradings[0].latestScore || 120}</span>
                            </td>
                            <td className="note">
                              {log.gradings && log.gradings.length && log.gradings[0].latestGrade?.rawNote?.substring(0, 40) || '---'}
                            </td>
                            <td className="date">
                              {log.gradings && log.gradings.length && log.gradings[0].latestDate ? new Date(log.gradings[0].latestDate).toLocaleDateString('vi-VN') : ''}
                            </td>
                            <td className="actions">
                              <button 
                                className="btn-action btn-view-errors"
                                onClick={() => handleViewViolations(log.gradings && log.gradings.length && log.gradings[0].latestGrade)}
                                disabled={!(log.gradings && log.gradings.length && log.gradings[0].latestGrade)}
                                title="Xem chi tiết lỗi"
                              >
                                📋 Lỗi
                              </button>
                              <button 
                                className="btn-action btn-view-students"
                                onClick={() => handleViewStudents(log)}
                                title="Xem danh sách học sinh"
                              >
                                👥 HS
                              </button>
                              <button 
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteGrade(log.gradings && log.gradings.length && log.gradings[0].latestGrade?._id)}
                                disabled={!(log.gradings && log.gradings.length && log.gradings[0].latestGrade)}
                                title="Xóa bản ghi"
                              >
                                🗑️ Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              <div className="week-info">
                <span>Chu kỳ: {dayjs(selectedDate).format('DD/MM/YYYY')}</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Modal xem chi tiết lỗi */}
      {showViolationsDetail && selectedGrade && (
        <div className="modal-overlay" onClick={() => setShowViolationsDetail(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Chi tiết lỗi - {selectedGrade.roomTitle}</h2>
              <button className="close-btn" onClick={() => setShowViolationsDetail(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="violations-detail-grid">
                <div className="detail-item">
                  <span className="label">Phòng:</span>
                  <strong>{selectedGrade.roomTitle}</strong>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày chấm:</span>
                  <strong>{new Date(selectedGrade.date).toLocaleDateString('vi-VN')}</strong>
                </div>
                <div className="detail-item">
                  <span className="label">Người chấm:</span>
                  <strong>{selectedGrade.supervisor || 'Admin'}</strong>
                </div>
                <div className="detail-item">
                  <span className="label">Điểm cuối cùng:</span>
                  <strong className="final-score">{selectedGrade.finalScore}</strong>
                </div>
              </div>
              
              <h3 style={{ marginTop: '20px' }}>Danh sách lỗi:</h3>
              {selectedGrade.violations && selectedGrade.violations.length > 0 ? (
                <div className="violations-detail-list">
                  {selectedGrade.violations.map((violation, idx) => (
                    <div key={idx} className="violation-detail-item">
                      <div className="violation-type">
                        {violation.type.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="violation-count">
                        <span>Số lần:</span> {violation.count}
                      </div>
                      <div className="violation-penalty">
                        <span>Trừ điểm:</span> -{(violation.count || 1) * getPenalty(violation.type)}đ
                      </div>
                      {violation.note && (
                        <div className="violation-note">
                          <span>Ghi chú:</span> {violation.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">Không có lỗi nào được ghi nhận.</p>
              )}
              
              <p style={{ marginTop: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                <strong>Ghi chú gốc:</strong> {selectedGrade.rawNote}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowViolationsDetail(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem danh sách học sinh */}
      {showStudentsDetail && selectedRoomStudents && (
        <div className="modal-overlay" onClick={() => setShowStudentsDetail(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👥 Danh sách học sinh - {selectedRoomStudents.room}</h2>
              <button className="close-btn" onClick={() => setShowStudentsDetail(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedRoomStudents.students && selectedRoomStudents.students.length > 0 ? (
                <div className="students-table-wrapper">
                  <table className="students-data-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Mã học sinh</th>
                        <th>Lớp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoomStudents.students.map((student, idx) => (
                        <tr key={idx} className="student-row">
                          <td>{idx + 1}</td>
                          <td className="student-name">{student.name || student.HoTen}</td>
                          <td className="student-id">{student.code || student.MSSV}</td>
                          <td>{student.class || student.Lop}</td>
                          {/* <td>{student.phone || student.SDT || 'N/A'}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty">Không có học sinh nào trong phòng.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowStudentsDetail(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ktx-page { background: #f1f5f9; min-height: 100vh; font-family: 'Inter', sans-serif; color: #1e293b; }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
        .modal-content { background: white; border-radius: 16px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 2px solid #e2e8f0; }
        .modal-header h2 { margin: 0; font-size: 1.3rem; color: #1e293b; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; transition: 0.2s; }
        .close-btn:hover { color: #dc2626; }
        
        .modal-body { padding: 25px; }
        .ai-suggestion-box { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
        .ai-analysis { margin: 0; font-size: 0.95rem; color: #1e40af; }
        
        .grade-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .summary-item { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; }
        .summary-item span { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 5px; }
        .summary-item strong { font-size: 1.2rem; color: #1e293b; }
        .summary-item.final { background: #dbeafe; border: 2px solid #2563eb; }
        .penalty-text { color: #dc2626; }
        .final-score-text { color: #2563eb; font-size: 1.5rem; }
        
        .modal-body h3 { font-size: 1rem; margin: 20px 0 15px; color: #334155; }
        
        .violations-list { display: flex; flex-direction: column; gap: 15px; }
        .violation-item { display: grid; grid-template-columns: 2fr 1fr 3fr 1fr auto; gap: 10px; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .violation-info { display: flex; flex-direction: column; }
        .violation-info.full-width { grid-column: span 3; }
        .violation-info label { font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: 600; }
        .violation-info select, .violation-info input { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; font-family: inherit; }
        .violation-info select:focus, .violation-info input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .violation-penalty { background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; text-align: center; }
        .remove-btn { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 1rem; }
        .remove-btn:hover { background: #fee2e2; }
        
        .no-violations { text-align: center; padding: 30px; color: #16a34a; font-size: 1.1rem; }
        
        .btn-add-violation { width: 100%; background: #10b981; color: white; border: 2px dashed #059669; padding: 12px 16px; margin-top: 15px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
        .btn-add-violation:hover { background: #059669; border-color: #047857; }
        
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 25px; border-top: 2px solid #e2e8f0; }
        
        .btn-submit-inline { background: #2563eb; color: white; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; }
        .btn-submit-inline:hover:not(:disabled) { background: #1d4ed8; }
        .btn-submit-inline:disabled { background: #cbd5e1; cursor: not-allowed; }
        
        .btn-submit { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; transition: 0.2s; font-size: 0.95rem; margin-top: 12px; }
        .btn-submit:hover:not(:disabled) { background: #1d4ed8; }
        .btn-submit:disabled { background: #cbd5e1; cursor: not-allowed; }
        
        .btn-view-history { background: #6366f1; color: white; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; }
        .btn-view-history:hover:not(:disabled) { background: #4f46e5; }
        .btn-view-history:disabled { background: #cbd5e1; cursor: not-allowed; }
        .btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-cancel:hover { background: #e2e8f0; }
        .btn-confirm { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-confirm:hover:not(:disabled) { background: #1d4ed8; }
        .btn-confirm:disabled { background: #cbd5e1; cursor: not-allowed; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        /* Existing Styles */
        .ktx-header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 0; position: sticky; top: 0; z-index: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; gap: 20px; flex-wrap: wrap; }
        .logo-section { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 300px; }
        .logo-section h1 { font-size: 1.25rem; margin: 0; font-weight: 800; color: #1e40af; }
        .logo-section p { font-size: 0.85rem; margin: 0; color: #64748b; }
        
        .header-right { display: flex; gap: 20px; align-items: center; flex: 1; min-width: 300px; justify-content: flex-end; flex-wrap: wrap; }
        .user-info-section { display: flex; gap: 15px; align-items: center; padding: 10px 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .user-role { display: flex; gap: 8px; align-items: center; }
        .user-role .label { font-size: 0.85rem; font-weight: 600; color: #475569; }
        .user-name { font-size: 0.9rem; font-weight: 600; color: #334155; display: flex; align-items: center; }
        .user-name span::before { content: '👤 '; }
        
        .btn-group { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .date-picker-group { display: flex; gap: 8px; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .date-picker-group label { font-size: 0.85rem; font-weight: 600; color: #475569; white-space: nowrap; }
        .date-input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; font-size: 0.9rem; font-family: inherit; color: #334155; }
        .date-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .btn-export { background: #16a34a; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; display: flex; gap: 8px; cursor: pointer; transition: 0.2s; align-items: center; }
        .btn-export:hover:not(:disabled) { background: #15803d; }
        .btn-export.btn-disabled { background: #cbd5e1; cursor: not-allowed; opacity: 0.6; }
        
        .history-controls { display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; margin-bottom: 15px; align-items: flex-start; }
        .date-input-small { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; font-size: 0.85rem; font-family: inherit; color: #334155; }
        .date-input-small:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .date-input-small-custom { flex: 1; }
        
        /* Custom DatePicker Styles */
        .date-picker-group .ant-picker { border-color: #cbd5e1; border-radius: 6px; }
        .date-picker-group .ant-picker:hover { border-color: #2563eb; }
        .date-picker-group .ant-picker-focused { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .history-controls .ant-picker { width: 100%; border-color: #cbd5e1; border-radius: 6px; }
        .history-controls .ant-picker:hover { border-color: #2563eb; }
        .history-controls .ant-picker-focused { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

        .ktx-main { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
        .grid-layout { display: grid; grid-template-columns: 1fr; gap: 25px; }

        .permission-alert { grid-column: 1 / -1; margin-bottom: 20px; }

        .form-section { grid-column: 1; }
        .history-section { grid-column: 1; }

        .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
        .card-header h2 { font-size: 1.1rem; margin: 0; font-weight: 700; }

        .form-section .card { padding: 16px; }
        .form-section .card-header { margin-bottom: 16px; }

        .form-row { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr; gap: 12px; align-items: flex-end; margin-bottom: 12px; }
        .form-row .input-group { margin-bottom: 0; }

        .input-group { margin-bottom: 12px; }
        .input-group label { display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.85rem; color: #334155; }
        .input-group input, .input-group textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 0.95rem; box-sizing: border-box; font-family: inherit; transition: 0.2s; }
        .input-group input:focus, .input-group textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .hint { font-size: 0.7rem; color: #64748b; margin-top: 4px; font-style: italic; }

        .btn-submit-inline { background: #2563eb; color: white; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; }
        .btn-submit-inline:hover:not(:disabled) { background: #1d4ed8; }
        .btn-submit-inline:disabled { background: #cbd5e1; cursor: not-allowed; }

        .btn-submit { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; transition: 0.2s; font-size: 0.95rem; }
        .btn-submit:hover:not(:disabled) { background: #1d4ed8; }
        .btn-submit:disabled { background: #cbd5e1; cursor: not-allowed; }
        
        .result-card { border-left: 5px solid #2563eb; animation: slideIn 0.3s ease-out; margin-top: 12px; padding: 16px; }
        .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .result-header h3 { margin: 0; font-size: 0.95rem; }
        .final-score { display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .final-score strong { font-size: 1.3rem; color: #2563eb; }
        
        .violation-details { list-style: none; padding: 0; margin: 0; }
        .violation-details li { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px dotted #e2e8f0; font-size: 0.85rem; }
        .violation-details li:last-child { border-bottom: none; }
        .violation-details .desc { flex: 1; font-size: 0.85rem; }
        .points { color: #dc2626; font-weight: 700; min-width: 50px; text-align: right; }
        
        .success-msg { color: #16a34a; font-size: 0.8rem; margin-top: 10px; display: flex; gap: 5px; font-weight: 600; align-items: center; }

        /* Bảng lịch sử chấm gần đây */
        .grading-history-table { max-height: 500px; overflow-y: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
        .history-data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .history-data-table thead { background: #f1f5f9; position: sticky; top: 0; z-index: 10; }
        .history-data-table th { padding: 12px; text-align: left; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; }
        .history-data-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .history-row:hover { background: #f8fafc; }
        .row-index { text-align: center; color: #64748b; font-weight: 600; width: 40px; }
        .room-name { font-weight: 600; color: #1e293b; }
        .score { text-align: center; }
        .badge-score { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-weight: 700; min-width: 50px; text-align: center; }
        .note { color: #64748b; font-size: 0.85rem; }
        .date { font-size: 0.85rem; color: #64748b; white-space: nowrap; }
        .actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn-action { padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; white-space: nowrap; }
        .btn-view-errors { color: #1e40af; border-color: #1e40af; }
        .btn-view-errors:hover:not(:disabled) { background: #dbeafe; }
        .btn-view-errors:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-view-students { color: #16a34a; border-color: #16a34a; }
        .btn-view-students:hover:not(:disabled) { background: #dcfce7; }
        .btn-view-students:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-delete { color: #dc2626; border-color: #dc2626; }
        .btn-delete:hover:not(:disabled) { background: #fee2e2; }
        .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Chi tiết lỗi modal */
        .violations-detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 20px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-item .label { font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 5px; }
        .detail-item strong { color: #1e293b; font-size: 1rem; }
        .detail-item .final-score { color: #2563eb; font-size: 1.3rem; }
        
        .violations-detail-list { display: flex; flex-direction: column; gap: 12px; }
        .violation-detail-item { background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #f59e0b; }
        .violation-type { font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .violation-count, .violation-penalty, .violation-note { font-size: 0.9rem; color: #475569; margin-bottom: 4px; }
        .violation-penalty { color: #dc2626; font-weight: 600; }

        /* Danh sách học sinh modal */
        .students-table-wrapper { max-height: 400px; overflow-y: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
        .students-data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .students-data-table thead { background: #f1f5f9; position: sticky; top: 0; z-index: 10; }
        .students-data-table th { padding: 12px; text-align: left; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; }
        .students-data-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .student-row:hover { background: #f8fafc; }
        .student-name { font-weight: 600; color: #1e293b; }
        .student-id { font-family: 'Courier New', monospace; color: #64748b; }

        .history-list { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
        .history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #2563eb; transition: 0.2s; }
        .history-item:hover { background: #f1f5f9; }
        .history-info { flex: 1; }
        .history-info strong { display: block; color: #1e293b; font-weight: 700; }
        .history-info .history-date { font-size: 0.75rem; color: #94a3b8; }
        .history-info span:last-child { font-size: 0.8rem; color: #64748b; display: block; margin-top: 2px; }
        .history-score { background: #fee2e2; color: #991b1b; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }
        .btn-delete-history { background: none; border: none; color: #dc2626; font-size: 1.1rem; cursor: pointer; transition: 0.2s; padding: 4px 8px; border-radius: 4px; }
        .btn-delete-history:hover { background: #fee2e2; }
        
        .empty { color: #94a3b8; text-align: center; padding: 20px 0; font-style: italic; }
        
        .week-info { margin-top: 20px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #64748b; border-top: 1px dotted #e2e8f0; padding-top: 15px; }
        .week-info span { font-weight: 600; color: #334155; }

        .icon-blue { color: #2563eb; }
        .icon-green { color: #16a34a; }
        .icon-red { color: #dc2626; }
        
        .spinner { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 768px) {
          .grid-layout { grid-template-columns: 1fr; }
          .header-content { flex-direction: column; gap: 15px; }
          .logo-section { flex: none; }
          .header-right { flex: none; width: 100%; justify-content: flex-start; }
          .user-info-section { flex-direction: column; width: 100%; }
          .btn-group { flex-direction: column; width: 100%; }
          .date-picker-group { width: 100%; justify-content: space-between; }
          .date-picker-group .ant-picker { flex: 1; width: 100%; }
          .date-input { flex: 1; }
          .btn-export { justify-content: center; width: 100%; }
          .logo-section { text-align: center; }
          .result-header { flex-direction: column; align-items: flex-start; }
          .form-row { grid-template-columns: 1fr; gap: 8px; }
          .history-controls { grid-template-columns: 1fr; }
          .history-controls .ant-picker { width: 100%; }
          .date-input-small { width: 100%; }
          .date-input-small-custom { width: 100%; }
          
          /* Bảng responsive */
          .history-data-table { font-size: 0.8rem; }
          .history-data-table th, .history-data-table td { padding: 8px; }
          .actions { gap: 4px; }
          .btn-action { padding: 4px 8px; font-size: 0.7rem; }
          .grading-history-table { max-height: 300px; }
          
          .students-data-table { font-size: 0.8rem; }
          .students-data-table th, .students-data-table td { padding: 8px; }
          
          .violations-detail-grid { grid-template-columns: 1fr; }
          
          /* Modal responsive */
          .modal-content { width: 95%; max-height: 95vh; }
          .grade-summary { grid-template-columns: repeat(2, 1fr); }
          .violation-item { grid-template-columns: 1fr; gap: 8px; }
          .violation-info.full-width { grid-column: span 1; }
          .modal-footer { flex-direction: column; }
          .btn-cancel, .btn-confirm { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default KTXGradingPage;
