const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../utils/errorHandler");
const {
  addStops,
  updateStopGroupWithStops,
  getStopsByGroupId,
  getAllStopGroups,
  getAllStopsWithGroups, // Add this new import
} = require("../services/stop");

/**
 * @swagger
 * /api/stops:
 *   post:
 *     tags: [Stops]
 *     summary: Create a new stop group with multiple stops
 *     description: Creates a new stop group and associated stops
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the stop group
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     map:
 *                       type: string
 *                       description: Map coordinates of the stop
 *                     street:
 *                       type: string
 *                       description: Street name where the stop is located
 *             required:
 *               - name
 *               - stops
 *     responses:
 *       201:
 *         description: Successfully created stop group and stops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID of the created stop
 *                   stop_group_id:
 *                     type: integer
 *                     description: ID of the stop group
 *                   map:
 *                     type: string
 *                     description: Map coordinates of the stop
 *                   street:
 *                     type: string
 *                     description: Street name where the stop is located
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const stopGroupData = req.body;
    const createdStops = await addStops(stopGroupData);
    res.status(201).json(createdStops);
  })
);

/**
 * @swagger
 * /api/stops/group/{id}:
 *   put:
 *     tags: [Stops]
 *     summary: Update a stop group name
 *     description: Updates the name of a stop group
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the stop group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the stop group
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     map:
 *                       type: string
 *                       description: Map coordinates of the stop
 *                     street:
 *                       type: string
 *                       description: Street name where the stop is located
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Successfully updated the stop group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID of the stop group
 *                 name:
 *                   type: string
 *                   description: Updated name of the stop group
 *                 stops:
 *                   type: array
 *                   description: List of updated stops
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID of the stop
 *                       stop_group_id:
 *                         type: integer
 *                         description: ID of the stop group
 *                       map:
 *                         type: string
 *                         description: Map coordinates of the stop
 *                       street:
 *                         type: string
 *                         description: Street name where the stop is located
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stop group not found
 *       500:
 *         description: Server error
 */
router.put(
  "/group/:id",
  asyncHandler(async (req, res) => {
    const groupId = parseInt(req.params.id);

    // Use the new combined function
    const result = await updateStopGroupWithStops({
      id: groupId,
      name: req.body.name,
      stops: req.body.stops,
    });

    res.json(result);
  })
);

/**
 * @swagger
 * /api/stops/group/{groupId}:
 *   get:
 *     tags: [Stops]
 *     summary: Get a stop group with all its stops
 *     description: Returns a stop group with its name and all associated stops
 *     parameters:
 *       - in: path
 *         name: groupId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the stop group
 *     responses:
 *       200:
 *         description: Successfully retrieved stop group and its stops
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID of the stop group
 *                 name:
 *                   type: string
 *                   description: Name of the stop group
 *                 stops:
 *                   type: array
 *                   description: List of stops in this group
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID of the stop
 *                       stop_group_id:
 *                         type: integer
 *                         description: ID of the stop group
 *                       map:
 *                         type: string
 *                         description: Map coordinates of the stop
 *                       street:
 *                         type: string
 *                         description: Street name where the stop is located
 *       400:
 *         description: Invalid stop group ID
 *       404:
 *         description: Stop group not found
 *       500:
 *         description: Server error
 */
router.get(
  "/group/:groupId",
  asyncHandler(async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const stops = await getStopsByGroupId(groupId);
    res.json(stops);
  })
);

/**
 * @swagger
 * /api/stops/groups:
 *   get:
 *     tags: [Stops]
 *     summary: Get all stop groups
 *     description: Returns all stop groups with their IDs and names
 *     responses:
 *       200:
 *         description: Successfully retrieved stop groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID of the stop group
 *                   name:
 *                     type: string
 *                     description: Name of the stop group
 *       500:
 *         description: Server error
 */
router.get(
  "/groups",
  asyncHandler(async (req, res) => {
    const stopGroups = await getAllStopGroups();
    res.json(stopGroups);
  })
);

/**
 * @swagger
 * /api/stops/all:
 *   get:
 *     tags: [Stops]
 *     summary: Get all stops with their stop groups
 *     description: Returns all stops with their IDs, names, and associated stop group information
 *     responses:
 *       200:
 *         description: Successfully retrieved all stops with their groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID of the stop
 *                   stop_group_id:
 *                     type: integer
 *                     description: ID of the stop group
 *                   map:
 *                     type: string
 *                     description: Map coordinates of the stop
 *                   street:
 *                     type: string
 *                     description: Street name where the stop is located
 *                   stopGroup:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID of the stop group
 *                       name:
 *                         type: string
 *                         description: Name of the stop group
 *       500:
 *         description: Server error
 */
router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const allStops = await getAllStopsWithGroups();
    res.json(allStops);
  })
);

module.exports = router;
