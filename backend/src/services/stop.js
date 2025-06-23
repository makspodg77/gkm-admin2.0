const { executeQuery } = require("../utils/sqlHelper");
const { ValidationError, NotFoundError } = require("../utils/errorHandler");

/**
 * Creates a new stop group with multiple stops
 * @param {Object} stopGroupToAdd - The stop group and stops to create
 * @param {string} stopGroupToAdd.name - The name of the stop group
 * @param {Array<Object>} stopGroupToAdd.stops - Array of stops to create for this group
 * @param {string} stopGroupToAdd.stops[].map - Map reference for the stop
 * @param {string} stopGroupToAdd.stops[].street - Street name for the stop
 * @returns {Promise<Array<Object>>} The newly created stops
 */
const addStops = async (stopGroupToAdd) => {
  if (!stopGroupToAdd.name) {
    throw new ValidationError("Stop group name is required");
  }

  if (
    !stopGroupToAdd.stops ||
    !Array.isArray(stopGroupToAdd.stops) ||
    stopGroupToAdd.stops.length === 0
  ) {
    throw new ValidationError("At least one stop is required");
  }

  for (const stop of stopGroupToAdd.stops) {
    if (!stop.map) {
      throw new ValidationError("Map reference is required for all stops");
    }
    if (!stop.street) {
      throw new ValidationError("Street name is required for all stops");
    }
  }

  const stopGroup = await executeQuery(
    `INSERT INTO stop_group(name) OUTPUT INSERTED.* VALUES(@name);`,
    { name: stopGroupToAdd.name }
  );

  const valuePlaceholders = stopGroupToAdd.stops
    .map((_, index) => `(@stopGroupId, @map${index}, @street${index})`)
    .join(", ");

  const query = `
    INSERT INTO stop(stop_group_id, map, street)
    OUTPUT INSERTED.*
    VALUES ${valuePlaceholders}
  `;

  const params = {};
  stopGroupToAdd.stops.forEach((stop, index) => {
    params[`map${index}`] = stop.map;
    params[`street${index}`] = stop.street;
    params[`stopGroupId`] = stopGroup[0].id;
  });

  return await executeQuery(query, params);
};

/**
 * Updates a single stop's map and street information
 * @param {Object} stop - The stop to update
 * @param {number} stop.id - The ID of the stop
 * @param {string} [stop.map] - The map reference
 * @param {string} [stop.street] - The street name
 * @returns {Promise<Object>} The updated stop
 */
const updateStop = async (stop) => {
  if (!stop.id) {
    throw new ValidationError("Stop ID is required");
  }

  const updateFields = [];
  const params = { id: stop.id };

  if (stop.map !== undefined) {
    updateFields.push("map = @map");
    params.map = stop.map;
  }

  if (stop.street !== undefined) {
    updateFields.push("street = @street");
    params.street = stop.street;
  }

  if (updateFields.length === 0) {
    throw new ValidationError("No fields to update");
  }

  const query = `
    UPDATE stop
    SET ${updateFields.join(", ")}
    OUTPUT INSERTED.*
    WHERE id = @id
  `;

  const result = await executeQuery(query, params);

  if (!result || result.length === 0) {
    throw new NotFoundError(`Stop with ID ${stop.id} not found`);
  }

  return result[0];
};

/**
 * Updates a stop group name
 * @param {Object} stopGroup - The stop group to update
 * @param {number} stopGroup.id - The ID of the stop group
 * @param {string} stopGroup.name - The new name for the stop group
 * @returns {Promise<Object>} The updated stop group
 */
const updateStopGroup = async (stopGroup) => {
  if (!stopGroup.id) {
    throw new ValidationError("Stop group ID is required");
  }

  if (!stopGroup.name) {
    throw new ValidationError("Stop group name is required");
  }

  const query = `
    UPDATE stop_group
    SET name = @name
    OUTPUT INSERTED.*
    WHERE id = @id
  `;
  const result = await executeQuery(query, {
    id: stopGroup.id,
    name: stopGroup.name,
  });

  if (!result || result.length === 0) {
    throw new NotFoundError(`Stop group with ID ${stopGroup.id} not found`);
  }

  return result[0];
};

/**
 * Gets all stops for a stop group
 * @param {number} stopGroupId - The ID of the stop group
 * @returns {Promise<Object>} Stop group with name and all stops
 */
const getStopsByGroupId = async (stopGroupId) => {
  if (!stopGroupId) {
    throw new ValidationError("Stop group ID is required");
  }

  const stopGroupQuery = `
    SELECT id, name FROM stop_group
    WHERE id = @stopGroupId
  `;

  const stopGroupResult = await executeQuery(stopGroupQuery, { stopGroupId });

  if (!stopGroupResult || stopGroupResult.length === 0) {
    throw new NotFoundError(`Stop group with ID ${stopGroupId} not found`);
  }

  const stopsQuery = `
    SELECT * FROM stop
    WHERE stop_group_id = @stopGroupId
    ORDER BY id
  `;

  const stopsResult = await executeQuery(stopsQuery, { stopGroupId });

  return {
    id: stopGroupResult[0].id,
    name: stopGroupResult[0].name,
    stops: stopsResult || [],
  };
};

/**
 * Gets all stop groups
 * @returns {Promise<Array>} All stop groups
 */
const getAllStopGroups = async () => {
  const results = await executeQuery(
    `SELECT id, name 
       FROM stop_group 
       ORDER BY name ASC`
  );
  return results;
};

/**
 * Delete all stops for a stop group
 * @param {number} groupId - The group ID
 * @returns {Promise<void>}
 */
const deleteStopsByGroupId = async (groupId) => {
  if (!groupId) {
    throw new ValidationError("Stop group ID is required");
  }

  const query = `
    DELETE FROM stop
    WHERE stop_group_id = @groupId
  `;

  await executeQuery(query, { groupId });
};

/**
 * Add multiple stops to a stop group
 * @param {number} groupId - The stop group ID
 * @param {Array<Object>} stops - Array of stops to add
 * @returns {Promise<Array>} The created stops
 */
const addStopsToGroup = async (groupId, stops) => {
  if (!groupId) {
    throw new ValidationError("Stop group ID is required");
  }

  if (!Array.isArray(stops) || stops.length === 0) {
    throw new ValidationError("At least one stop is required");
  }

  for (const stop of stops) {
    if (!stop.map) {
      throw new ValidationError("Map reference is required for all stops");
    }
    if (!stop.street) {
      throw new ValidationError("Street name is required for all stops");
    }
  }

  const valuePlaceholders = stops
    .map((_, index) => `(@groupId, @map${index}, @street${index})`)
    .join(", ");

  const query = `
    INSERT INTO stop(stop_group_id, map, street)
    OUTPUT INSERTED.*
    VALUES ${valuePlaceholders}
  `;

  const params = { groupId };
  stops.forEach((stop, index) => {
    params[`map${index}`] = stop.map;
    params[`street${index}`] = stop.street;
  });

  return await executeQuery(query, params);
};

/**
 * Gets all stops with their associated stop groups
 * @returns {Promise<Array>} All stops with their stop group information
 */
const getAllStopsWithGroups = async () => {
  const query = `
  SELECT 
    s.id, 
    s.map, 
    s.street, 
    sg.id as group_id, 
    sg.name as group_name 
  FROM stop s
  JOIN stop_group sg ON s.stop_group_id = sg.id
  ORDER BY sg.name, s.street;`;

  const results = await executeQuery(query);

  return results.map((row) => ({
    id: row.id,
    map: row.map,
    street: row.street,
    stopGroup: {
      id: row.group_id,
      name: row.group_name,
    },
  }));
};

/**
 * Update a stop group and its stops safely (preserving referential integrity)
 * @param {Object} data - The update data
 * @param {number} data.id - The ID of the stop group
 * @param {string} data.name - The name of the stop group
 * @param {Array<Object>} data.stops - Array of stops for this group
 * @returns {Promise<Object>} The updated stop group with its stops
 */
const updateStopGroupWithStops = async (data) => {
  if (!data.id) {
    throw new ValidationError("Stop group ID is required");
  }

  if (!data.name) {
    throw new ValidationError("Stop group name is required");
  }

  if (!Array.isArray(data.stops) || data.stops.length === 0) {
    throw new ValidationError("At least one stop is required");
  }

  const updatedGroup = await updateStopGroup({ id: data.id, name: data.name });

  const existingStopsResult = await executeQuery(
    `SELECT id, map, street FROM stop WHERE stop_group_id = @groupId`,
    { groupId: data.id }
  );

  const existingStopsById = {};
  existingStopsResult.forEach((stop) => {
    existingStopsById[stop.id] = stop;
  });

  const stopsToUpdate = [];
  const stopsToAdd = [];
  const processedExistingIds = new Set();

  for (const stop of data.stops) {
    if (stop.id) {
      stopsToUpdate.push({
        id: stop.id,
        map: stop.coordinates || stop.map,
        street: stop.street,
      });
      processedExistingIds.add(stop.id);
    } else {
      stopsToAdd.push({
        map: stop.coordinates || stop.map,
        street: stop.street,
      });
    }
  }

  const stopsToRemove = existingStopsResult
    .filter((stop) => !processedExistingIds.has(stop.id))
    .map((stop) => stop.id);

  for (const stop of stopsToUpdate) {
    try {
      await updateStop(stop);
    } catch (error) {
      console.error(`Failed to update stop ${stop.id}: ${error.message}`);
    }
  }

  let newStops = [];
  if (stopsToAdd.length > 0) {
    newStops = await addStopsToGroup(data.id, stopsToAdd);
  }

  const safelyDeletedIds = [];
  for (const stopId of stopsToRemove) {
    try {
      const usageCheck = await executeQuery(
        `SELECT COUNT(*) as count FROM full_route WHERE stop_id = @stopId`,
        { stopId }
      );

      if (usageCheck[0].count === 0) {
        await executeQuery(`DELETE FROM stop WHERE id = @stopId`, { stopId });
        safelyDeletedIds.push(stopId);
      }
    } catch (error) {
      console.error(`Failed to delete stop ${stopId}: ${error.message}`);
    }
  }

  const updatedStopsResult = await executeQuery(
    `SELECT * FROM stop WHERE stop_group_id = @groupId ORDER BY id`,
    { groupId: data.id }
  );

  return {
    id: updatedGroup.id,
    name: updatedGroup.name,
    stops: updatedStopsResult || [],
  };
};

module.exports = {
  addStops,
  updateStop,
  updateStopGroup,
  getStopsByGroupId,
  getAllStopGroups,
  deleteStopsByGroupId,
  addStopsToGroup,
  updateStopGroupWithStops,
  getAllStopsWithGroups,
};
