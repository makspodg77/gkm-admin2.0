const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../utils/errorHandler");
const {
  addFullLine,
  updateFullLine,
  deleteLine,
  getLineById,
  getAllLines,
  getRoutesByLineId,
} = require("../services/line");

/**
 * @swagger
 * /api/lines:
 *   post:
 *     tags: [Lines]
 *     summary: Create a new line with routes
 *     description: Creates a new transit line with associated routes and stops
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the line
 *               lineTypeId:
 *                 type: integer
 *                 description: ID of the line type
 *               routes:
 *                 type: array
 *                 description: Array of routes (max 2)
 *                 items:
 *                   type: object
 *                   properties:
 *                     isCircular:
 *                       type: boolean
 *                       description: Whether the route is circular
 *                     isNight:
 *                       type: boolean
 *                       description: Whether this is a night route
 *                     fullRoutes:
 *                       type: array
 *                       description: Array of route configurations
 *                       items:
 *                         type: object
 *                         properties:
 *                           fullRoute:
 *                             type: array
 *                             description: Stops on this route
 *                           departureRoutes:
 *                             type: array
 *                             description: Departure routes for this configuration
 *                           additionalStops:
 *                             type: array
 *                             description: Additional stops for this route
 *                           departures:
 *                             type: array
 *                             description: Departure times for this route
 *     responses:
 *       201:
 *         description: Successfully created line with routes
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const lineData = req.body;
    const result = await addFullLine(lineData);
    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/lines/{id}:
 *   put:
 *     tags: [Lines]
 *     summary: Update an existing line
 *     description: Updates an existing transit line with associated routes and stops
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the line
 *               lineTypeId:
 *                 type: integer
 *                 description: Updated ID of the line type
 *               routes:
 *                 type: array
 *                 description: Updated array of routes (max 2)
 *                 items:
 *                   type: object
 *                   properties:
 *                     isCircular:
 *                       type: boolean
 *                       description: Whether the route is circular
 *                     isNight:
 *                       type: boolean
 *                       description: Whether this is a night route
 *                     fullRoutes:
 *                       type: array
 *                       description: Array of route configurations
 *     responses:
 *       200:
 *         description: Successfully updated line
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Line not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const lineId = parseInt(req.params.id);
    const lineData = req.body;
    const updatedLine = await updateFullLine(lineId, lineData);
    res.json(updatedLine);
  })
);

/**
 * @swagger
 * /api/lines/{id}:
 *   get:
 *     tags: [Lines]
 *     summary: Get a specific line by ID
 *     description: Returns a line with all its routes and associated data
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the line
 *       404:
 *         description: Line not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lineId = parseInt(req.params.id);
    const line = await getLineById(lineId);
    res.json(line);
  })
);

/**
 * @swagger
 * /api/lines:
 *   get:
 *     tags: [Lines]
 *     summary: Get all lines
 *     description: Returns a list of all transit lines
 *     responses:
 *       200:
 *         description: Successfully retrieved all lines
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const lines = await getAllLines();
    res.json(lines);
  })
);

/**
 * @swagger
 * /api/lines/{id}:
 *   delete:
 *     tags: [Lines]
 *     summary: Delete a line
 *     description: Deletes a line and all associated routes, stops, and timetables
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line to delete
 *     responses:
 *       200:
 *         description: Successfully deleted the line
 *       404:
 *         description: Line not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const lineId = parseInt(req.params.id);
    await deleteLine(lineId);
    res.json({ message: "Line deleted successfully", lineId });
  })
);

/**
 * @swagger
 * /api/routes/{line_id}:
 *   get:
 *     tags: [Routes]
 *     summary: Get all routes for a line
 *     description: Returns all the routes depending on the route type
 *     parameters:
 *       - in: path
 *         name: line_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the line that routes should be returned for
 *     responses:
 *       200:
 *         description: Successfully retrieved routes for a line
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   route_id:
 *                     type: string
 *                     description: ID of the route
 *                   is_circular:
 *                     type: boolean
 *                     description: Whether the route is circular
 *                   line:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Line ID
 *                       name:
 *                         type: string
 *                         description: Line name
 *                       color:
 *                         type: string
 *                         description: Line color code
 *                   stops:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/RouteStop'
 *       500:
 *         description: Server error
 */
router.get(
  "/routes/:line_id",
  asyncHandler(async (req, res) => {
    const lineId = parseInt(req.params.line_id);
    const routes = await getRoutesByLineId(lineId);
    res.json(routes);
  })
);

module.exports = router;
