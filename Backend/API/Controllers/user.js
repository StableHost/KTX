import Room from '../Models/Room.js';
import User from '../Models/User.js';

//Create
export const createUser = async (req, res, next) => {
  const newUser = new User(req.body);
  try {
    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (err) {
    next(err);
  }
};
//Update
export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json(error);
  }
};

//Delete
export const deleteUser = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const roomsToUpdate = await Room.find({ 'roomMembers.userId': userId });

    await User.findByIdAndDelete(userId);

    await Promise.all(
      roomsToUpdate.map(async (room) => {
        room.roomMembers = room.roomMembers.filter((member) => member.userId.toString() !== userId);
        room.availableSlot = room.Slot - room.roomMembers.length;

        await room.save();
      })
    );

    res.status(200).json('Delete Success');
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};
//Get
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ Matk: req.params.id });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};
//Getall
export const getallUser = async (req, res, next) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } });

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * Tìm thông tin học sinh theo Họ tên, Ngày sinh, Giới tính, Dân tộc
 * Route: GET /users/search?hoTen=...&dateOfBirth=...&gioiTinh=...&danToc=...
 */
export const searchUserByInfo = async (req, res, next) => {
  try {
    const { hoTen, dateOfBirth, gioiTinh, danToc } = req.query;

    console.log('🔍 [DEBUG] Search criteria:', { hoTen, dateOfBirth, gioiTinh, danToc });

    // Xây dựng filter object động
    const filter = { isAdmin: { $ne: true } };

    // Filter: Họ tên (tìm kiếm không phân biệt chữ hoa/thường)
    if (hoTen) {
      filter.HoTen = { $regex: hoTen, $options: 'i' };
      console.log(`✓ Filter by HoTen: ${hoTen}`);
    }

    // Filter: Giới tính (exact match)
    if (gioiTinh) {
      filter.GioiTinh = gioiTinh;
      console.log(`✓ Filter by GioiTinh: ${gioiTinh}`);
    }

    // Filter: Ngày sinh (exact match hoặc range)
    if (dateOfBirth) {
      try {
        const birthDate = new Date(dateOfBirth);
        const startOfDay = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const endOfDay = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate() + 1);

        filter.DateOfBirth = {
          $gte: startOfDay,
          $lt: endOfDay
        };
        console.log(`✓ Filter by DateOfBirth: ${dateOfBirth}`);
      } catch (err) {
        console.log(`⚠️ Invalid dateOfBirth format: ${dateOfBirth}`);
      }
    }

    // Filter: Dân tộc (nếu có trong database)
    if (danToc) {
      // Nếu field DanToc tồn tại
      filter.DanToc = danToc;
      console.log(`✓ Filter by DanToc: ${danToc}`);
    }

    console.log(`📋 [DEBUG] Final filter:`, JSON.stringify(filter, null, 2));

    // Thực hiện tìm kiếm
    const users = await User.find(filter).select(
      'HoTen Mssv Email Phone DateOfBirth GioiTinh Address Truong room'
    );

    console.log(`✅ [DEBUG] Found ${users.length} user(s)`);

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'Không tìm thấy học sinh phù hợp với tiêu chí tìm kiếm'
      });
    }

    // Format Response
    const formattedUsers = users.map(user => ({
      id: user._id,
      hoTen: user.HoTen,
      mssv: user.Mssv,
      email: user.Email,
      phone: user.Phone,
      dateOfBirth: user.DateOfBirth ? new Date(user.DateOfBirth).toLocaleDateString('vi-VN') : 'N/A',
      gioiTinh: user.GioiTinh,
      address: user.Address,
      truong: user.Truong,
      room: user.room?.roomTitle || 'Chưa được phân phòng'
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
      total: formattedUsers.length,
      message: `Tìm thấy ${formattedUsers.length} học sinh`
    });

  } catch (error) {
    console.error('❌ [ERROR] searchUserByInfo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi tìm kiếm học sinh'
    });
  }
};
