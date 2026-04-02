import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPickupRequests,
  approvePickupRequest,
  rejectPickupRequest,
  updateDropoffTime,
  deletePickupRequest
} from 'API/pickupDropoff';
import CustomTable from 'components/CustomTable';
import { PrimaryButton } from 'components/Button/PrimaryButton';
import { DeleteButton } from 'components/Button/DeleteButton';
import CreatePickupRequest from 'components/PickupDropoff/CreatePickupRequest';
import { toast } from 'react-toastify';
import SectionHeaderWithSearch from 'components/SectionHeader/SectionHeaderWithSearch';

const PickupDropoffManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  // Fetch data
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['pickupDropoffRequests'],
    queryFn: getAllPickupRequests
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: approvePickupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['pickupDropoffRequests']);
      toast.success('Đã phê duyệt yêu cầu đón học sinh');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra, xin thử lại');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: rejectPickupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['pickupDropoffRequests']);
      toast.success('Đã từ chối yêu cầu');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra, xin thử lại');
    }
  });

  // Dropoff mutation
  const dropoffMutation = useMutation({
    mutationFn: updateDropoffTime,
    onSuccess: () => {
      queryClient.invalidateQueries(['pickupDropoffRequests']);
      toast.success('Đã cập nhật thời gian trả học sinh');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra, xin thử lại');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePickupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['pickupDropoffRequests']);
      toast.success('Đã xóa yêu cầu');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra, xin thử lại');
    }
  });

  const handleApprove = (id) => {
    if (window.confirm('Xác nhận phê duyệt yêu cầu đón học sinh?')) {
      approveMutation.mutate({
        id,
        data: {
          approvedBy: currentUser?.details?.CMND || 'Admin',
          pickupSignature: currentUser?.details?.CMND || ''
        }
      });
    }
  };

  const handleReject = (id) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason) {
      rejectMutation.mutate({
        id,
        data: {
          approvedBy: currentUser?.details?.CMND || 'Admin',
          rejectedReason: reason
        }
      });
    }
  };

  const handleDropoff = (id) => {
    if (window.confirm('Xác nhận học sinh đã được trả về?')) {
      dropoffMutation.mutate({
        id,
        data: {
          dropoffTime: new Date().toISOString(),
          dropoffSignature: currentUser?.details?.CMND || '',
          updatedBy: currentUser?.details?.CMND || 'Admin'
        }
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return <span className="text-yellow-600 font-semibold">Chờ phê duyệt</span>;
      case 1:
        return <span className="text-blue-600 font-semibold">Đã đón</span>;
      case 2:
        return <span className="text-green-600 font-semibold">Đã trả</span>;
      case 3:
        return <span className="text-red-600 font-semibold">Từ chối</span>;
      default:
        return <span>Không xác định</span>;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const columns = [
    {
      title: 'STT',
      width: 50,
      align: 'center',
      render: (value, record, index) => index + 1
    },
    {
      title: 'Họ tên HS',
      render: (_, record) => record.studentInfo?.HoTen || '-'
    },
    {
      title: 'Phòng (Lớp)',
      width: 120,
      render: (_, record) => record.studentInfo?.roomTitle || '-'
    },
    {
      title: 'Quan hệ với HS',
      width: 140,
      render: (_, record) => record.pickupPerson?.relationship || '-'
    },
    {
      title: 'Số căn cước CD',
      width: 140,
      render: (_, record) => record.pickupPerson?.idCard || '-'
    },
    {
      title: 'Thời gian đón',
      width: 170,
      render: (_, record) => formatDateTime(record.pickupTime)
    },
    {
      title: 'Lý do HS nghỉ',
      width: 220,
      render: (_, record) => record.reason || '-'
    },
    {
      title: 'Ký nhận',
      width: 120,
      render: (_, record) => record.pickupSignature || '-'
    },
    {
      title: 'Thời gian trả',
      width: 170,
      render: (_, record) => formatDateTime(record.dropoffTime)
    },
    {
      title: 'Ký trả',
      width: 120,
      render: (_, record) => record.dropoffSignature || '-'
    },
    {
      title: 'Trạng thái',
      width: 130,
      render: (_, record) => getStatusText(record.status)
    },
    {
      title: 'Thao tác',
      width: 220,
      render: (_, record) => (
        <div className="flex gap-2">
          {record.status === 0 && (
            <>
              <PrimaryButton
                    text={'Phê duyệt'}
                    onClick={() => handleApprove(record._id)}
                    className="text-xs px-2 py-1"
                />
              <button
                onClick={() => handleReject(record._id)}
                className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
              >
                Từ chối
              </button>
            </>
          )}
          {record.status === 1 && (
            <PrimaryButton
                text={'Đã trả'}
                onClick={() => handleDropoff(record._id)}
                className="text-xs px-2 py-1"
            />
          )}
          <DeleteButton onClick={() => handleDelete(record._id)} className="text-xs px-2 py-1" />
        </div>
      )
    }
  ];

  const filteredRequests = requests.filter((request) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      request.studentInfo?.HoTen?.toLowerCase().includes(searchLower) ||
      request.studentInfo?.MHV?.toLowerCase().includes(searchLower) ||
      request.pickupPerson?.fullName?.toLowerCase().includes(searchLower) ||
      request.pickupPerson?.idCard?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="px-16 py-8">
      <SectionHeaderWithSearch
        title="Theo dõi đón, trả học sinh (Đột xuất)"
        setQuery={setSearchQuery}
        placeholder="Tìm theo tên HS, mã HS, người đón..."
      />

      <div className="mb-4">
        <PrimaryButton
            text={'+ Tạo yêu cầu đón học sinh'}
            onClick={() => setShowCreateModal(true)}
            className="!bg-green-500 !hover:bg-green-400 disabled:!bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      ) : (
        <CustomTable columns={columns} dataSource={filteredRequests} isPagination={false} />
      )}

      {showCreateModal && <CreatePickupRequest onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};

export default PickupDropoffManagement;
