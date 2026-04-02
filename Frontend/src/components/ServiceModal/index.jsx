import React, { useEffect, useState } from 'react';

import Modal from 'antd/es/modal/Modal';
import CheckOutForm from './CheckOutForm';
import ChangeRoomForm from './ChangeRoomForm';
import ExtendForm from './Extend';
import FixForm from './FixRoom';

const ServiceModal = ({ keyService, isOpen, onCancel }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    switch (keyService) {
      case '1':
        setTitle('Trả phòng');
        break;
      case '2':
        setTitle('Chuyển phòng');
        break;
      case '3':
        setTitle('Sửa chữa phòng');
        break;
      case '4':
        setTitle('Gia hạn');
        break;
      default:
        break;
    }
  }, [keyService]);

  const getModalContent = () => {
    switch (title) {
      case 'Trả phòng':
        return <CheckOutForm title={title} onCancel={onCancel} />;
      case 'Chuyển phòng':
        return <ChangeRoomForm title={title} onCancel={onCancel} />;
      case 'Gia hạn':
        return <ExtendForm title={title} onCancel={onCancel} />;
      case 'Sửa chữa phòng':
        return <FixForm title={title} onCancel={onCancel} />;
      default:
        <div>Khong tim thay dich vu</div>;
    }
  };

  return (
    <Modal open={isOpen} onCancel={onCancel} footer={false} width={950}>
      {getModalContent()}
    </Modal>
  );
};

export default ServiceModal;
