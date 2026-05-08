const express = require("express");
const router = express.Router();

const requestController = require("../controllers/requestController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Request
 *   description: Project Request API
 */


/**
 * @swagger
 * /api/request:
 *   post:
 *     summary: Create project request
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               freelancerId:
 *                 type: string
 *               projectTitle:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Request created successfully
 */
router.post(
  "/",
  authMiddleware,
  requestController.createRequest
);


/**
 * @swagger
 * /api/request:
 *   get:
 *     summary: Get all requests
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success get requests
 */
router.get(
  "/",
  authMiddleware,
  requestController.getRequests
);


/**
 * @swagger
 * /api/request/{id}:
 *   put:
 *     summary: Update request status
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Request updated successfully
 */
router.put(
  "/:id",
  authMiddleware,
  requestController.updateRequest
);

/**
 * @swagger
 * /api/request/client:
 *   get:
 *     summary: Get client requests
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success get client requests
 */
router.get(
  "/client",
  authMiddleware,
  requestController.getClientRequests
);

/**
 * @swagger
 * /api/request/freelancer:
 *   get:
 *     summary: Get freelancer requests
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success get freelancer requests
 */
router.get(
  "/freelancer",
  authMiddleware,
  requestController.getFreelancerRequests
);

module.exports = router;