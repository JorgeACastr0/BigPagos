const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/validation');

class AuthController {
  // POST /api/auth/register
  register = asyncHandler(async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    const newAdmin = await authService.registerAdmin({
      nombre,
      email,
      password,
      rol,
    });

    res.status(201).json(
      successResponse(
        newAdmin,
        'Usuario admin registrado exitosamente'
      )
    );
  });

  // POST /api/auth/login
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.loginAdmin(email, password);

    res.json(
      successResponse(
        result,
        'Login exitoso'
      )
    );
  });

  // GET /api/auth/profile
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.idUsuario;

    const profile = await authService.getProfile(userId);

    res.json(
      successResponse(
        profile,
        'Perfil obtenido exitosamente'
      )
    );
  });

  // PUT /api/auth/change-password
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.idUsuario;
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    res.json(
      successResponse(
        result,
        'Contraseña actualizada exitosamente'
      )
    );
  });
}

module.exports = new AuthController();
