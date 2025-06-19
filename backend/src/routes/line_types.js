const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../utils/errorHandler");
const {
  addLineType,
  updateLineType,
  getAllLineTypes,
  getLineTypeById,
  deleteLineType,
} = require("../services/line_type");

/**
 * @swagger
 * /api/line-types:
 *   get:
 *     tags: [Line Types]
 *     summary: Get all line types
 *     description: Retrieves a list of all available line types
 *     responses:
 *       200:
 *         description: Successfully retrieved line types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The line type ID
 *                   name_singular:
 *                     type: string
 *                     description: Singular name of the line type (e.g., "Bus")
 *                   name_plural:
 *                     type: string
 *                     description: Plural name of the line type (e.g., "Buses")
 *                   color:
 *                     type: string
 *                     description: Color hex code for the line type
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const lineTypes = await getAllLineTypes();
    res.json(lineTypes);
  })
);

/**
 * @swagger
 * /api/line-types/{id}:
 *   get:
 *     tags: [Line Types]
 *     summary: Get a specific line type
 *     description: Retrieves a line type by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line type to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the line type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The line type ID
 *                 name_singular:
 *                   type: string
 *                   description: Singular name of the line type (e.g., "Bus")
 *                 name_plural:
 *                   type: string
 *                   description: Plural name of the line type (e.g., "Buses")
 *                 color:
 *                   type: string
 *                   description: Color hex code for the line type
 *       404:
 *         description: Line type not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const lineType = await getLineTypeById(id);
    res.json(lineType);
  })
);

/**
 * @swagger
 * /api/line-types:
 *   post:
 *     tags: [Line Types]
 *     summary: Create a new line type
 *     description: Creates a new line type with the provided data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name_singular
 *               - name_plural
 *               - color
 *             properties:
 *               name_singular:
 *                 type: string
 *                 description: Singular name of the line type (e.g., "Bus")
 *               name_plural:
 *                 type: string
 *                 description: Plural name of the line type (e.g., "Buses")
 *               color:
 *                 type: string
 *                 description: Color hex code for the line type (e.g., "#FF0000")
 *     responses:
 *       201:
 *         description: Successfully created a new line type
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const lineTypeData = req.body;
    const createdLineType = await addLineType(lineTypeData);
    res.status(201).json(createdLineType);
  })
);

/**
 * @swagger
 * /api/line-types/{id}:
 *   put:
 *     tags: [Line Types]
 *     summary: Update a line type
 *     description: Updates an existing line type with the provided data
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line type to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name_singular:
 *                 type: string
 *                 description: Singular name of the line type (e.g., "Bus")
 *               name_plural:
 *                 type: string
 *                 description: Plural name of the line type (e.g., "Buses")
 *               color:
 *                 type: string
 *                 description: Color hex code for the line type (e.g., "#FF0000")
 *     responses:
 *       200:
 *         description: Successfully updated the line type
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Line type not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const lineTypeData = {
      id,
      ...req.body,
    };
    const updatedLineType = await updateLineType(lineTypeData);
    res.json(updatedLineType);
  })
);

/**
 * @swagger
 * /api/line-types/{id}:
 *   delete:
 *     tags: [Line Types]
 *     summary: Delete a line type
 *     description: Deletes a line type if it's not in use by any lines
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line type to delete
 *     responses:
 *       200:
 *         description: Successfully deleted the line type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Line type deleted successfully"
 *                 id:
 *                   type: integer
 *                   description: ID of the deleted line type
 *       400:
 *         description: Cannot delete because the line type is in use
 *       404:
 *         description: Line type not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await deleteLineType(id);
    res.json({ message: "Line type deleted successfully", id });
  })
);

module.exports = router;
