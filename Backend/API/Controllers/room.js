import Room from '../Models/Room.js';
import Dormitory from '../Models/Dormitory.js';
import checkOutRequest from '../Models/requests/checkOutRequest.js';
import changeRoomRequest from '../Models/requests/changeRoomRequest.js';
import User from '../Models/User.js';
import extendRequest from '../Models/requests/extendRequest.js';
import fixRequest from '../Models/requests/fixRequest.js';
import GradingLog from '../Models/GradingLog.js';
import { ObjectId } from 'mongodb';

export const createRoom = async (req, res, next) => {
  const dormitoryId = req.query.dormitoryId;

  if (!dormitoryId) {
    return res.status(404).json('Không tìm thấy tầng này');
  }
  const newRoom = new Room({
    ...req.body,
    dormId: dormitoryId,
    availableSlot: req.body.Slot
  });

  try {
    const savedRoom = await newRoom.save();
    try {
      await Dormitory.findByIdAndUpdate(dormitoryId, {
        $push: { Room: savedRoom._id }
      });
    } catch (err) {
      next(err);
    }
    res.status(200).json(savedRoom);
  } catch (err) {
    next(err);
  }
};

//Update
export const updateRoom = async (req, res, next) => {
  const { roomMembers, Slot } = req.body;

  try {
    const roomId = req.params.id;
    const currentRoom = await Room.findById(roomId);

    if (!currentRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    let availableSlot, status;

    if (Slot) {
      availableSlot = Slot - (roomMembers ? roomMembers.length : 0);
    } else {
      availableSlot = currentRoom.Slot - (roomMembers ? roomMembers.length : 0);
    }

    if (availableSlot < 0) {
      return res.status(300).json('Phòng đã đầy');
    }

    if (availableSlot === 0) {
      status = 1;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $set: { ...req.body, availableSlot, status } },
      { new: true }
    );

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json(error);
  }
};

//update ngày cho cái phòng ý là ngày book hoặc ngày hết hạn tùy
export const updateRoomavAilability = async (req, res, next) => {
  try {
    await Room.updateOne(
      { 'RoomNumbers._id': req.params.id },
      {
        $push: {
          'RoomNumbers.$.unavailableDates': req.body.dates
        }
      }
    );
    res.status(200).json('Update success!');
  } catch (error) {
    res.status(500).json(error);
  }
};

//Delete
export const deleteRoom = async (req, res, next) => {
  const dormitoryId = req.params.dormitoryId;
  try {
    await Room.findByIdAndDelete(req.params.id);
    try {
      await Dormitory.findByIdAndUpdate(dormitoryId, {
        $pull: { Room: req.params.id }
      });
    } catch (err) {
      next(err);
    }
    res.status(200).json('Delete Success');
  } catch (error) {
    res.status(500).json(error);
  }
};

//Get
export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json(error);
  }
};

//Getall
export const getallRoom = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};

export const getAllCheckoutRequest = async (req, res, next) => {
  try {
    const requests = await checkOutRequest.find();
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const getCheckoutRequest = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const requests = await checkOutRequest.find({ userId });
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const requestCheckout = async (req, res, next) => {
  try {
    const { CMND, userId, userDetail, room, requestStatus } = req.body;

    const request = new checkOutRequest({
      CMND,
      userId,
      userDetail,
      room,
      requestStatus
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process the check-out request.' });
  }
};

export const updateCheckoutRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { requestStatus, userId, rejectReason, updatedBy } = req.body;

    // Kiểm tra nếu requestStatus là 1 (duyệt)
    if (requestStatus === 2) {
      const request = await checkOutRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
      }

      request.requestStatus = requestStatus;
      request.rejectReason = rejectReason;
      request.updatedBy = updatedBy;

      await request.save();

      return res.status(200).json({ message: 'Yêu cầu trả phòng đã được từ chối.' });
    }
    if (requestStatus === 1) {
      const request = await checkOutRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
      }

      const room = await Room.findById(request.room.roomId);
      const user = await User.findById(userId);

      if (room) {
        room.roomMembers = room.roomMembers.filter((member) => member.userId.toString() !== userId);
        room.availableSlot = room.Slot - room.roomMembers.length;

        await room.save();

        user.room.status = 1;
        await user.save();

        request.requestStatus = 1;
        await request.save();

        return res.status(200).json(room);
      } else {
        return res.status(404).json({ error: 'Không tìm thấy thông tin phòng cho người dùng này.' });
      }
    } else {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the check-out update.' });
  }
};

// Change room

export const getAllChangeRoomRequest = async (req, res, next) => {
  try {
    const requests = await changeRoomRequest.find();
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const getChangeRoomRequest = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const requests = await changeRoomRequest.find({ userId });
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const requestChangeRoom = async (req, res, next) => {
  try {
    const { CMND, userId, userDetail, originRoom, toRoom, requestStatus } = req.body;

    const request = new changeRoomRequest({
      CMND,
      userId,
      userDetail,
      originRoom,
      toRoom,
      requestStatus
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process the check-out request.' });
  }
};

export const updateChangeRoomRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { requestStatus, userId, rejectReason, updatedBy } = req.body;

    // Kiểm tra nếu requestStatus là 1 (duyệt)
    if (requestStatus === 2) {
      const request = await changeRoomRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
      }

      request.requestStatus = requestStatus;
      request.rejectReason = rejectReason;
      request.updatedBy = updatedBy;

      await request.save();

      return res.status(200).json({ message: 'Yêu cầu trả phòng đã được từ chối.' });
    }

    if (requestStatus === 1) {
      const request = await changeRoomRequest.findById(requestId);
      const user = await User.findById(userId);

      if (!request || !user) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin.' });
      }

      const originRoom = await Room.findById(request.originRoom?.roomId);
      const toRoom = await Room.findById(request.toRoom.roomId);

      if (!originRoom || !toRoom) {
        return res.status(404).json({ error: 'Không tìm thấy phòng.' });
      }

      if (toRoom.availableSlot < 0) {
        return res.status(300).json('Phòng đã đầy');
      }

      if (originRoom && toRoom) {
        originRoom.roomMembers = originRoom.roomMembers.filter((member) => member.userId.toString() !== userId);
        originRoom.availableSlot = originRoom.Slot - originRoom.roomMembers.length;

        const { _id, CMND, HoTen, Mssv, Truong, Phone, Email, room } = user;

        toRoom.roomMembers = {
          userId: _id,
          CMND,
          HoTen,
          Mssv,
          Truong,
          Phone,
          Email,
          dateIn: Date.now(),
          dateOut: room.dateOut
        };
        toRoom.availableSlot = toRoom.Slot - toRoom.roomMembers.length;

        user.room = {
          ...user.room,
          roomId: toRoom._id,
          roomTitle: toRoom.Title,
          dateIn: Date.now(),
          dateOut: request.toRoom.dateOut
        };

        await originRoom.save();
        await toRoom.save();
        await user.save();

        request.requestStatus = 1;
        await request.save();

        return res.status(200).json(toRoom);
      } else {
        return res.status(404).json({ error: 'Không tìm thấy thông tin phòng cho người dùng này.' });
      }
    } else {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the check-out update.' });
  }
};

// Extend
export const getAllExtendRoomRequest = async (req, res, next) => {
  try {
    const requests = await extendRequest.find();
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const getExtendRoomRequest = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const requests = await extendRequest.find({ userId });
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const requestExtend = async (req, res, next) => {
  try {
    const { userId, userDetail, roomId, roomTitle, dateOut, newDateOut } = req.body;

    const request = new extendRequest({
      userId,
      userDetail,
      roomId,
      roomTitle,
      dateOut,
      newDateOut
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process the extend request.' });
  }
};

export const updateExtendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { requestStatus, userId, rejectReason } = req.body;

    // Kiểm tra nếu requestStatus là 1 (duyệt)
    if (requestStatus === 2) {
      const request = await extendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
      }

      request.requestStatus = 2;
      request.rejectReason = rejectReason;
      await request.save();

      return res.status(200).json({ message: 'Yêu cầu trả phòng đã được từ chối.' });
    }

    if (requestStatus === 1) {
      const request = await extendRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
      }

      const room = await Room.findById(request.roomId);
      const user = await User.findById(userId);

      if (room && user) {
        const roomMemberUpdate = room.roomMembers.find((member) => member.userId.toString() === userId);

        if (roomMemberUpdate) {
          roomMemberUpdate.dateOut = request.newDateOut;
          user.room.dateOut = request.newDateOut;
          request.requestStatus = 1;

          await room.save();
          await user.save();
          await request.save();
          return res.status(200).json({ message: 'DateOut updated successfully.' });
        }
      } else {
        return res.status(404).json({ error: 'Không tìm thấy thông tin phòng cho người dùng này.' });
      }
    } else {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the check-out update.' });
  }
};

// fix
export const getAllFixRoomRequest = async (req, res, next) => {
  try {
    const requests = await fixRequest.find();
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const getFixRoomRequest = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const requests = await fixRequest.find({ userId });
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve change room requests.' });
  }
};

export const requestFixRoom = async (req, res, next) => {
  try {
    const { userId, userDetail, room, note, newDateOut } = req.body;

    const request = new fixRequest({
      userId,
      userDetail,
      room,
      note,
      newDateOut
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process the extend request.' });
  }
};

export const updateFixRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { requestStatus } = req.body;

    const request = await fixRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
    }

    if (requestStatus === 2) {
      const request = await extendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu trả phòng chờ duyệt cho người dùng này.' });
      }

      request.requestStatus = 2;
      request.rejectReason = rejectReason;
      await request.save();

      return res.status(200).json({ message: 'Yêu cầu trả phòng đã được từ chối.' });
    }

    request.requestStatus = requestStatus;
    await request.save();

    return res.status(200).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the check-out update.' });
  }
};

/**
 * Lấy danh sách tất cả các phòng với điểm chấm gần đây
 * Sử dụng MongoDB aggregation pipeline để optimize join
 */
export const getRoomsWithGrades = async (req, res, next) => {
  try {
    // Stage 1: Lookup join với GradingLog
    const stage1_lookup = {
      $lookup: {
        from: 'gradinglogs',
        localField: '_id',
        foreignField: 'roomId',
        as: 'gradings'
      }
    };
    console.log('✓ Stage 1 (Lookup):', JSON.stringify(stage1_lookup, null, 2));

    // Stage 2: Filter gradings có status = 1 (đã duyệt)
    const stage2_filter = {
      $addFields: {
        gradings: {
          $filter: {
            input: '$gradings',
            as: 'grading',
            cond: {  }
          }
        }
      }
    };
    console.log('✓ Stage 2 (Filter status=1):', JSON.stringify(stage2_filter, null, 2));

    // Stage 3: Tính toán totalGradings, latestGrade, averageScore
    const stage3_calculate = {
      $addFields: {
        totalGradings: { $size: '$gradings' },
        latestGrade: {
          $cond: [
            { $gt: [{ $size: '$gradings' }, 0] },
            {
              $arrayElemAt: [
                { $sortArray: { input: '$gradings', sortBy: { date: -1 } } },
                0
              ]
            },
            null
          ]
        },
        averageScore: {
          $cond: [
            { $gt: [{ $size: '$gradings' }, 0] },
            {
              $round: [
                {
                  $divide: [
                    { $sum: '$gradings.finalScore' },
                    { $size: '$gradings' }
                  ]
                },
                0
              ]
            },
            'N/A'
          ]
        }
      }
    };
    console.log('✓ Stage 3 (Calculate):', JSON.stringify(stage3_calculate, null, 2));

    // Stage 4: Format response structure
    const stage4_project = {
      $project: {
        _id: 1,
        Title: 1,
        status: 1,
        Price: 1,
        Slot: 1,
        availableSlot: 1,
        gradings: {
          total: '$totalGradings',
          latestScore: {
            $cond: [
              { $eq: ['$latestGrade', null] },
              'N/A',
              '$latestGrade.finalScore'
            ]
          },
          averageScore: '$averageScore',
          latestDate: {
            $cond: [
              { $eq: ['$latestGrade', null] },
              null,
              '$latestGrade.date'
            ]
          },
          latestGrade: '$latestGrade',
          allGradings: '$gradings'
        }
      }
    };
    console.log('✓ Stage 4 (Project):', JSON.stringify(stage4_project, null, 2));

    // Stage 5: Sort theo Title
    const stage5_sort = { $sort: { Title: 1 } };
    console.log('✓ Stage 5 (Sort):', JSON.stringify(stage5_sort, null, 2));

    // Chạy aggregation với tất cả stages
    const pipeline = [
      stage1_lookup,
      stage2_filter,
      stage3_calculate,
      stage4_project,
      stage5_sort
    ];

    console.log('\n📊 [DEBUG] Bắt đầu aggregation...');
    const roomsData = await Room.aggregate(pipeline);
    console.log(`✅ [DEBUG] Aggregation thành công. Tổng phòng: ${roomsData.length}`);

    if (!roomsData || roomsData.length === 0) {
      console.log('⚠️ [DEBUG] Không có phòng nào trong hệ thống');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Không có phòng nào'
      });
    }

    // Populate user details cho roomMembers và format students
    console.log('\n👥 [DEBUG] Populating student details từ User model...');
    const roomsWithGrades = await Promise.all(roomsData.map(async (room) => {
      try {
        // Sử dụng aggregation pipeline để join vì roomMembers lưu userId trực tiếp (không nested)
        const pipeline = [
          {
            $match: { _id: new ObjectId(room._id) }
          },
          {
            $unwind: {
              path: '$roomMembers',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'roomMembers.userId',  // Nếu không có, thử từng field khác
              foreignField: '_id',
              as: 'userInfo'
            }
          },
          {
            $unwind: {
              path: '$userInfo',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 0,
              id: '$userInfo._id',
              name: '$userInfo.HoTen',
              code: '$userInfo.Mssv',
              class: '$userInfo.Lop',
              phone: '$userInfo.Phone',
              email: '$userInfo.Email',
              address: '$userInfo.Address',
              truong: '$userInfo.Truong'
            }
          }
        ];

        console.log(`\n🔄 Room ${room.Title} - using aggregation pipeline...`);
        const students = await Room.aggregate(pipeline);
        
        console.log(`✓ Room ${room.Title}: ${students.length} students from aggregation`);
        
        // Format lại students với fallback 'N/A' cho missing fields
        const formattedStudents = students.map(student => ({
          id: student.id || 'N/A',
          name: student.name || 'N/A',
          code: student.code || 'N/A',
          class: student.class || 'N/A',
          phone: student.phone || 'N/A',
          email: student.email || 'N/A',
          address: student.address || 'N/A',
          truong: student.truong || 'N/A'
        }));
        
        // Return room data KHÔNG include roomMembers, chỉ students array
        return {
          _id: room._id,
          Title: room.Title,
          status: room.status,
          Price: room.Price,
          Slot: room.Slot,
          availableSlot: room.availableSlot,
          gradings: room.gradings,
          students: formattedStudents,
          totalStudents: formattedStudents.length
        };
      } catch (err) {
        console.error(`❌ Error processing room ${room.Title}:`, err.message);
        return {
          _id: room._id,
          Title: room.Title,
          status: room.status,
          Price: room.Price,
          Slot: room.Slot,
          availableSlot: room.availableSlot,
          gradings: room.gradings,
          students: [],
          totalStudents: 0
        };
      }
    }));
    console.log(`✅ [DEBUG] Successfully formatted ${roomsWithGrades.length} rooms with student data`);

    // Debug: In ra sample data
    console.log('\n📋 [DEBUG] Sample room data with students:');
    if (roomsWithGrades[0]?.students && roomsWithGrades[0].students.length > 0) {
      console.log(`Room: ${roomsWithGrades[0].Title}, Students: ${roomsWithGrades[0].totalStudents}`);
      console.log(JSON.stringify(roomsWithGrades[0].students.slice(0, 2), null, 2));
    }

    res.status(200).json({
      success: true,
      data: roomsWithGrades,
      total: roomsWithGrades.length,
      message: 'Lấy danh sách phòng với điểm chấm và danh sách học sinh thành công'
    });

  } catch (error) {
    console.error('❌ [ERROR] getRoomsWithGrades:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách phòng với điểm chấm'
    });
  }
};

/**
 * Thêm thành viên vào phòng
 * Route: POST /rooms/add-member/:roomTitle
 */
export const addMemberToRoom = async (req, res, next) => {
  try {
    const { roomTitle } = req.params;
    const memberData = req.body; // Dữ liệu thành viên: { id, name, code, class, phone, email, ... }

    console.log(`📝 [DEBUG] Adding member to room: ${roomTitle}`);
    console.log(`Member data:`, JSON.stringify(memberData, null, 2));

    // Validate input
    if (!roomTitle) {
      return res.status(400).json({
        success: false,
        message: 'Tên phòng là bắt buộc'
      });
    }

    if (!memberData || Object.keys(memberData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu thành viên không hợp lệ'
      });
    }

    // Tìm phòng theo tên và thêm thành viên
    const updatedRoom = await Room.findOneAndUpdate(
      { Title: roomTitle },
      { $push: { roomMembers: memberData } },
      { new: true }
    ).populate('roomMembers.userId', 'HoTen Mssv');

    if (!updatedRoom) {
      console.log(`❌ [ERROR] Không tìm thấy phòng: ${roomTitle}`);
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy phòng ${roomTitle}`
      });
    }

    console.log(`✅ [DEBUG] Successfully added member to room ${roomTitle}. Total members: ${updatedRoom.roomMembers.length}`);

    res.status(200).json({
      success: true,
      data: updatedRoom,
      message: `Đã thêm thành viên vào phòng ${roomTitle} thành công`
    });

  } catch (error) {
    console.error('❌ [ERROR] addMemberToRoom:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi thêm thành viên vào phòng'
    });
  }
};

/**
 * Lấy danh sách học sinh trong một phòng
 * Sử dụng aggregation pipeline để join với User model
 */
export const getRoomStudents = async (req, res, next) => {
  try {
    const roomId = req.params.roomId;
    
    console.log(`\n📍 [DEBUG] getRoomStudents - roomId: ${roomId}`);
    
    // Aggregation pipeline để join Room với User
    const pipeline = [
      {
        $match: { _id: new ObjectId(roomId) }
      },
      {
        $unwind: {
          path: '$roomMembers',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'roomMembers.userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          id: '$userInfo._id',
          name: '$userInfo.HoTen',
          code: '$userInfo.Mssv',
          class: '$userInfo.Lop',
          phone: '$userInfo.Phone',
          email: '$userInfo.Email',
          address: '$userInfo.Address',
          truong: '$userInfo.Truong'
        }
      }
    ];

    console.log(`🔄 [DEBUG] Bắt đầu aggregation...`);
    const students = await Room.aggregate(pipeline);
    
    console.log(`✓ Aggregation result: ${students.length} records`);
    
    if (!students || students.length === 0) {
      console.log(`⚠️ Không có dữ liệu học sinh`);
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'Phòng này chưa có học sinh'
      });
    }

    // Format lại students với fallback 'N/A' cho missing fields
    const formattedStudents = students.map(student => ({
      id: student.id || 'N/A',
      name: student.name || 'N/A',
      code: student.code || 'N/A',
      class: student.class || 'N/A',
      phone: student.phone || 'N/A',
      email: student.email || 'N/A',
      address: student.address || 'N/A',
      truong: student.truong || 'N/A'
    }));

    console.log(`✅ Format xong: ${formattedStudents.length} students`);

    res.status(200).json({
      success: true,
      data: formattedStudents,
      total: formattedStudents.length,
      message: 'Lấy danh sách học sinh thành công'
    });

  } catch (error) {
    console.error('❌ Error in getRoomStudents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi lấy danh sách học sinh'
    });
  }
};
