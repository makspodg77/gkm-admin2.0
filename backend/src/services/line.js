const {
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../utils/sqlHelper");
const {
  ValidationError,
  NotFoundError,
  DatabaseError,
} = require("../utils/errorHandler");

/**
 * Przetwarza dane linii z formatu frontendu do formatu API
 * @param {Object} lineData - Dane linii z frontendu
 * @returns {Object} - Dane linii w formacie API
 */
const preprocessLineData = (lineData) => {
  console.log("Przetwarzanie danych linii...", JSON.stringify(lineData.name));

  // Sprawdź, czy dane są już w prawidłowym formacie API
  if (
    lineData.routes &&
    Array.isArray(lineData.routes) &&
    lineData.routes.length > 0 &&
    lineData.routes[0].fullRoutes &&
    lineData.routes[0].fullRoutes.length > 0
  ) {
    console.log("Dane już w formacie API, pomijam konwersję");
    return lineData;
  }

  console.log("Konwertuję format UI do API...");

  // Przygotuj podstawowy obiekt API
  const apiData = {
    name: lineData.name,
    lineTypeId: parseInt(lineData.lineTypeId) || lineData.lineTypeId,
    routes: [],
  };

  // Pobieramy podstawowe flagi
  const isCircular =
    lineData.isCircular || lineData._ui?.routeType === "circular";
  const isNight = lineData.isNight || false;

  // Dodaj trasę pierwszą (jeśli istnieje)
  if (lineData.route1Stops && lineData.route1Stops.length > 0) {
    console.log(
      `Przetwarzam trasę pierwszą, ${lineData.route1Stops.length} przystanków`
    );

    const route1 = {
      isCircular: isCircular,
      isNight: isNight,
      fullRoutes: [
        {
          fullRoute: lineData.route1Stops.map((stop) => {
            // Upewnij się, że stopId jest prawidłowo ustawiony
            const stopId = stop.id || stop.stopId || stop.stop_id;
            return {
              stopId: stopId,
              travelTime: Number(stop.travel_time) || 0,
              isOnRequest: Boolean(stop.on_request),
              stopNumber: Number(stop.stop_number) || 0,
              isFirst: Boolean(stop.is_first),
              isLast: Boolean(stop.is_last),
              isOptional: Boolean(stop.is_optional),
            };
          }),
          departureRoutes: prepareVariantsFromUI(
            lineData.additionalInfo1 || lineData._ui?.additionalInfo1,
            lineData.schedules1 || lineData._ui?.schedules1
          ),
        },
      ],
    };
    apiData.routes.push(route1);
  } else {
    console.log("Brak danych dla trasy pierwszej");
  }

  // Dodaj trasę drugą (jeśli istnieje i linia nie jest okrężna)
  if (
    !isCircular &&
    (lineData.routeType === "bidirectional" ||
      lineData._ui?.routeType === "bidirectional") &&
    lineData.route2Stops &&
    lineData.route2Stops.length > 0
  ) {
    console.log(
      `Przetwarzam trasę drugą, ${lineData.route2Stops.length} przystanków`
    );

    const route2 = {
      isCircular: false,
      isNight: isNight,
      fullRoutes: [
        {
          fullRoute: lineData.route2Stops.map((stop) => {
            // Upewnij się, że stopId jest prawidłowo ustawiony
            const stopId = stop.id || stop.stopId || stop.stop_id;
            return {
              stopId: stopId,
              travelTime: Number(stop.travel_time) || 0,
              isOnRequest: Boolean(stop.on_request),
              stopNumber: Number(stop.stop_number) || 0,
              isFirst: Boolean(stop.is_first),
              isLast: Boolean(stop.is_last),
              isOptional: Boolean(stop.is_optional),
            };
          }),
          departureRoutes: prepareVariantsFromUI(
            lineData.additionalInfo2 || lineData._ui?.additionalInfo2,
            lineData.schedules2 || lineData._ui?.schedules2
          ),
        },
      ],
    };
    apiData.routes.push(route2);
  } else {
    console.log("Brak danych dla trasy drugiej lub linia jest okrężna");
  }

  console.log(`Po konwersji: ${apiData.routes.length} tras`);
  return apiData;
};

/**
 * Przygotowuje dane wariantów z formatu UI
 * @param {Object} additionalInfo - Informacje o wariantach
 * @param {Array} schedules - Rozkłady jazdy
 * @returns {Array} - Warianty w formacie API
 */
const prepareVariantsFromUI = (additionalInfo, schedules) => {
  if (!additionalInfo || !additionalInfo.variants) {
    return [
      {
        signature: "Podstawowy",
        color: "#3498db",
        additionalStops: [],
        departures: [],
      },
    ];
  }

  return additionalInfo.variants.map((variant, index) => {
    const departureRoute = {
      signature: variant.signature || "Podstawowy",
      color: variant.color || "#3498db",
      additionalStops: (variant.additionalStops || []).map((stop) => ({
        stopNumber: stop.stop_number || stop.stopNumber || 1,
        stopId: stop.id || stop.stopId,
      })),
      departures: [],
    };

    // Dodaj odjazdy z rozkładów
    if (schedules && Array.isArray(schedules)) {
      schedules.forEach((schedule) => {
        if (schedule.departures && Array.isArray(schedule.departures)) {
          const filteredDepartures = schedule.departures
            .filter((d) => d.variantIndex === index)
            .map((d) => ({
              departureTime: d.time,
              dayType: schedule.type || "all",
            }));

          departureRoute.departures.push(...filteredDepartures);
        }
      });
    }

    return departureRoute;
  });
};

/**
 * Creates a new line record
 * @param {string} name - The name of the line
 * @param {number} lineTypeId - The ID of the line type
 * @param {Object} [transaction] - Optional SQL transaction
 * @returns {Promise<Object>} The created line
 */
const addLine = async (name, lineTypeId, transaction = null) => {
  if (!name) {
    throw new ValidationError("Line name is required");
  }

  if (!lineTypeId) {
    throw new ValidationError("Line type ID is required");
  }

  const query = `
    INSERT INTO line(name, line_type_id) 
    OUTPUT INSERTED.* 
    VALUES(@name, @lineTypeId);
  `;

  const result = await executeQuery(query, { name, lineTypeId }, transaction);

  if (!result || result.length === 0) {
    throw new DatabaseError("Failed to create line: No record returned");
  }

  return result[0];
};

/**
 * Gets a stop type by its properties
 * @param {Object} stopType - The stop type properties
 * @param {boolean} stopType.isFirst - Whether this is the first stop
 * @param {boolean} stopType.isLast - Whether this is the last stop
 * @param {boolean} stopType.isOptional - Whether this is an optional stop
 * @returns {Promise<Object>} The stop type
 */
const getStopType = async (stopType) => {
  if (!stopType) {
    throw new ValidationError("Stop type is required");
  }

  const query = `
    SELECT id FROM stop_type 
    WHERE is_first = @isFirst 
    AND is_last = @isLast 
    AND is_optional = @isOptional;
  `;

  const result = await executeQuery(query, {
    isFirst: stopType.isFirst,
    isLast: stopType.isLast,
    isOptional: stopType.isOptional,
  });

  if (!result || result.length === 0) {
    throw new NotFoundError("Stop type not found");
  }

  return result[0];
};

/**
 * Creates a new route record
 * @param {number} lineId - The ID of the line this route belongs to
 * @param {boolean} isCircular - Whether the route is circular
 * @param {boolean} isNight - Whether the route is a night route
 * @param {Object} transaction - The SQL transaction
 * @returns {Promise<Object>} The created route
 */
const addRoute = async (lineId, isCircular, isNight, transaction) => {
  if (!lineId) {
    throw new ValidationError("Line ID is required");
  }

  if (typeof isCircular !== "boolean") {
    throw new ValidationError("is_circular must be a boolean");
  }

  if (typeof isNight !== "boolean") {
    throw new ValidationError("is_night must be a boolean");
  }

  const query = `
    INSERT INTO route(line_id, is_circular, is_night)
    OUTPUT INSERTED.*
    VALUES(@lineId, @isCircular, @isNight);
  `;

  const result = await executeQuery(
    query,
    {
      lineId,
      isCircular,
      isNight,
    },
    transaction
  );

  return result[0];
};

/**
 * Adds multiple full route entries in a batch
 * @param {Array<Object>} fullRoute - Array of route stops
 * @param {number} routeId - The ID of the route these stops belong to
 * @param {Object} transaction - The SQL transaction
 * @returns {Promise<Array<Object>>} The created full route entries
 */
const addFullRouteBatch = async (fullRoute, routeId, transaction) => {
  if (!fullRoute || !fullRoute.length) {
    throw new ValidationError("No route stops provided");
  }

  // Generate sequential stopNumber values regardless of what's provided
  const valuePlaceholders = fullRoute
    .map(
      (_, index) =>
        `(@routeId, @stopId${index}, @travelTime${index}, @isOnRequest${index}, @stopNumber${index}, @isFirst${index}, @isLast${index}, @isOptional${index})`
    )
    .join(", ");

  const query = `
    INSERT INTO full_route(route_id, stop_id, travel_time, is_on_request, stop_number, is_first, is_last, is_optional)
    OUTPUT INSERTED.*
    VALUES ${valuePlaceholders}
  `;

  const params = {};

  fullRoute.forEach((stop, index) => {
    params[`stopId${index}`] = stop.stopId;
    params[`travelTime${index}`] = stop.travelTime;
    params[`isOnRequest${index}`] = stop.isOnRequest;
    params[`stopNumber${index}`] = index + 1;
    params[`isFirst${index}`] = index === 0 ? true : stop.isFirst || false;
    params[`isLast${index}`] =
      index === fullRoute.length - 1 ? true : stop.isLast || false;
    params[`isOptional${index}`] = stop.isOptional || false;
    params[`routeId`] = routeId;
  });

  const result = await executeQuery(query, params, transaction);

  return result;
};

/**
 * Adds multiple departure routes in a batch
 * @param {Array<Object>} departureRoutes - Array of departure routes
 * @param {string} departureRoutes[].signature - Signature/name of the departure route
 * @param {string} departureRoutes[].color - Color code for the departure route
 * @param {number} routeId - The ID of the route these departure routes belong to
 * @param {Object} transaction - The SQL transaction
 * @returns {Promise<Array<Object>>} The created departure routes
 */
const addDepartureRouteBatch = async (
  departureRoutes,
  routeId,
  transaction
) => {
  if (!departureRoutes || !departureRoutes.length) {
    throw new ValidationError("No departure routes provided");
  }

  const valuePlaceholders = departureRoutes
    .map((_, index) => `(@signature${index}, @color${index}, @routeId)`)
    .join(", ");

  const params = {};

  departureRoutes.forEach((route, index) => {
    params[`signature${index}`] = route.signature;
    params[`color${index}`] = route.color;
    params[`routeId`] = routeId;
  });

  const query = `
    INSERT INTO departure_route(signature, color, route_id) 
    OUTPUT INSERTED.*
    VALUES ${valuePlaceholders}
  `;

  const result = await executeQuery(query, params, transaction);

  return result;
};

/**
 * Adds multiple additional stops in a batch
 * @param {Array<Object>} additionalStops - Array of additional stops
 * @param {number} additionalStops[].stopNumber - Stop number reference
 * @param {number} departureRouteId - The ID of the departure route these stops belong to
 * @param {Object} transaction - The SQL transaction
 * @returns {Promise<Array<Object>>} The created additional stops
 */
const addAdditionalStopBatch = async (
  additionalStops,
  departureRouteId,
  transaction
) => {
  if (!additionalStops || !additionalStops.length) {
    return [];
  }

  const valuePlaceholders = additionalStops
    .map((_, index) => `(@routeId, @stopNumber${index})`)
    .join(", ");

  const query = `
    INSERT INTO additional_stop(route_id, stop_number)
    OUTPUT INSERTED.*
    VALUES ${valuePlaceholders}
  `;

  const params = {};
  additionalStops.forEach((stop, index) => {
    params[`stopNumber${index}`] = stop.stopNumber;
    params[`routeId`] = departureRouteId;
  });

  const result = await executeQuery(query, params, transaction);

  return result;
};

/**
 * Adds multiple timetable departures in a batch
 * @param {Array<Object>} departures - Array of timetable departures
 * @param {string} departures[].departureTime - Departure time in HH:MM:SS format
 * @param {number} routeId - The ID of the route these departures belong to
 * @param {Object} transaction - The SQL transaction
 * @returns {Promise<Array<Object>>} The created timetable entries
 */
const addTimetableDeparturesBatch = async (
  departures,
  routeId,
  transaction
) => {
  if (!departures || !departures.length) {
    return [];
  }

  const valuePlaceholders = departures
    .map((_, index) => `(@routeId, @departureTime${index})`)
    .join(", ");

  const query = `
    INSERT INTO timetable(route_id, departure_time)
    OUTPUT INSERTED.*
    VALUES ${valuePlaceholders}
  `;
  const params = {};
  departures.forEach((departure, index) => {
    params[`departureTime${index}`] = departure.departureTime;
    params[`routeId`] = routeId;
  });

  const result = await executeQuery(query, params, transaction);

  return result;
};

/**
 * Processes route data by adding full routes, departure routes, additional stops, and timetable departures
 * @param {Array<Object>} fullRoutes - Array of route configuration objects
 * @param {Array<Object>} fullRoutes[].fullRoute - Array of stops for this route
 * @param {Array<Object>} fullRoutes[].departureRoutes - Array of departure routes with additionalStops and departures
 * @param {number} routeId - The ID of the route
 * @param {Object} transaction - The database transaction
 * @returns {Array} Array of processed route data results
 */
const processRouteData = async (fullRoutes, routeId, transaction) => {
  if (!fullRoutes || !Array.isArray(fullRoutes) || fullRoutes.length === 0) {
    throw new ValidationError("Full routes data is required");
  }

  if (!routeId) {
    throw new ValidationError("Route ID is required");
  }

  let results = [];

  for (const fullRouteToAdd of fullRoutes) {
    const fullRoute = await addFullRouteBatch(
      fullRouteToAdd.fullRoute,
      routeId,
      transaction
    );

    const departureRoutes = await addDepartureRouteBatch(
      fullRouteToAdd.departureRoutes,
      routeId,
      transaction
    );

    // Przetwarzanie dodatkowch przystanków i odjazdów dla każdego wariantu (departureRoutes)
    for (let i = 0; i < departureRoutes.length; i++) {
      const departureRoute = departureRoutes[i];
      const departureRouteData = fullRouteToAdd.departureRoutes[i]; // Odpowiadający obiekt z przychodzących danych

      // Dodanie additionalStops dla konkretnego departure route
      if (
        departureRouteData.additionalStops &&
        departureRouteData.additionalStops.length > 0
      ) {
        console.log(
          `Dodawanie ${departureRouteData.additionalStops.length} dodatkowych przystanków dla wariantu ${departureRoute.signature}`
        );
        const additionalStops = await addAdditionalStopBatch(
          departureRouteData.additionalStops,
          departureRoute.id,
          transaction
        );
        departureRoute.additionalStops = additionalStops;
      } else {
        departureRoute.additionalStops = [];
      }

      if (
        departureRouteData.departures &&
        departureRouteData.departures.length > 0
      ) {
        console.log(
          `Dodawanie ${departureRouteData.departures.length} odjazdów dla wariantu ${departureRoute.signature}`
        );
        const departures = await addTimetableDeparturesBatch(
          departureRouteData.departures,
          departureRoute.id,
          transaction
        );
        departureRoute.departures = departures;
      } else {
        departureRoute.departures = [];
      }
    }

    results.push({
      fullRoute,
      departureRoutes,
    });
  }

  return results;
};

/**
 * Creates a new line with multiple routes
 * @param {Object} lineToAdd - The complete line data object
 * @param {string} lineToAdd.name - Name of the line
 * @param {number} lineToAdd.lineTypeId - ID of the line type
 * @param {Array<Object>} lineToAdd.routes - Array of route objects (max 2)
 * @param {boolean} lineToAdd.routes[].isCircular - Whether the route is circular
 * @param {boolean} lineToAdd.routes[].isNight - Whether the route is a night route
 * @param {Array<Object>} lineToAdd.routes[].fullRoutes - Array of full route configurations
 * @param {Array<Object>} lineToAdd.routes[].fullRoutes[].fullRoute - Array of stops for this route
 * @param {Array<Object>} lineToAdd.routes[].fullRoutes[].departureRoutes - Array of departure routes
 * @param {Array<Object>} [lineToAdd.routes[].fullRoutes[].additionalStops] - Optional array of additional stops
 * @param {Array<Object>} [lineToAdd.routes[].fullRoutes[].departures] - Optional array of departure times
 * @returns {Object} The created line with all related data
 */
const addFullLine = async (lineToAdd) => {
  if (!lineToAdd) {
    throw new ValidationError("Line data is required");
  }

  // Przetwórz dane wejściowe do prawidłowego formatu API
  lineToAdd = preprocessLineData(lineToAdd);

  if (!lineToAdd.name) {
    throw new ValidationError("Line name is required");
  }

  if (!lineToAdd.lineTypeId) {
    throw new ValidationError("Line type ID is required");
  }

  if (!lineToAdd.routes || !lineToAdd.routes.length) {
    throw new ValidationError("At least one route is required");
  }

  if (lineToAdd.routes.length > 2) {
    throw new ValidationError("A line can have at most two routes");
  }

  const transaction = await beginTransaction();

  try {
    const line = await addLine(
      lineToAdd.name,
      lineToAdd.lineTypeId,
      transaction
    );

    const routes = [];
    const routeResults = [];

    for (const routeData of lineToAdd.routes) {
      const route = await addRoute(
        line.id,
        routeData.isCircular,
        routeData.isNight,
        transaction
      );
      routes.push(route);

      if (routeData.fullRoutes && routeData.fullRoutes.length) {
        const results = await processRouteData(
          routeData.fullRoutes,
          route.id,
          transaction
        );
        routeResults.push({ routeId: route.id, results });
      }
    }

    await commitTransaction(transaction);

    return {
      line,
      routes,
      routeResults,
    };
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
};

/**
 * Helper function to clean up related records for a route
 * @param {number} routeId - The route ID
 * @param {Object} transaction - The database transaction
 */
const cleanupRouteRecords = async (routeId, transaction) => {
  if (!routeId) {
    throw new ValidationError("Route ID is required for cleanup");
  }

  const getDepartureRoutesQuery = `SELECT id FROM departure_route WHERE route_id = @routeId`;
  const departureRoutes = await executeQuery(
    getDepartureRoutesQuery,
    { routeId },
    transaction
  );

  if (departureRoutes && departureRoutes.length > 0) {
    const departureRouteIds = departureRoutes.map((dr) => dr.id).join(",");
    const deleteTimetableQuery = `DELETE FROM timetable WHERE route_id IN (${departureRouteIds})`;
    await executeQuery(deleteTimetableQuery, {}, transaction);
  }

  if (departureRoutes && departureRoutes.length > 0) {
    const departureRouteIds = departureRoutes.map((dr) => dr.id).join(",");
    const deleteAdditionalStopsQuery = `DELETE FROM additional_stop WHERE route_id IN (${departureRouteIds})`;
    await executeQuery(deleteAdditionalStopsQuery, {}, transaction);
  }

  const deleteFullRoutesQuery = `DELETE FROM full_route WHERE route_id = @routeId`;
  await executeQuery(deleteFullRoutesQuery, { routeId }, transaction);

  const deleteDepartureRoutesQuery = `DELETE FROM departure_route WHERE route_id = @routeId`;
  await executeQuery(deleteDepartureRoutesQuery, { routeId }, transaction);
};

/**
 * Updates a line and all its related data
 * @param {number} lineId - The ID of the line to update
 * @param {Object} lineToUpdate - The updated line data object
 * @param {string} [lineToUpdate.name] - Updated name of the line
 * @param {number} [lineToUpdate.lineTypeId] - Updated ID of the line type
 * @param {Array<Object>} lineToUpdate.routes - Array of route objects (max 2)
 * @param {boolean} lineToUpdate.routes[].isCircular - Whether the route is circular
 * @param {boolean} lineToUpdate.routes[].isNight - Whether the route is a night route
 * @param {Array<Object>} lineToUpdate.routes[].fullRoutes - Array of full route configurations
 * @returns {Object} The updated line with all related data
 */
const updateFullLine = async (lineId, lineToUpdate) => {
  if (!lineId) {
    throw new ValidationError("Line ID is required");
  }

  lineToUpdate = preprocessLineData(lineToUpdate);

  if (!lineToUpdate) {
    throw new ValidationError("Line update data is required");
  }

  if (!lineToUpdate.routes || !lineToUpdate.routes.length) {
    throw new ValidationError("At least one route is required");
  }

  if (lineToUpdate.routes.length > 2) {
    throw new ValidationError("A line can have at most two routes");
  }

  const transaction = await beginTransaction();

  try {
    const checkLineQuery = `SELECT id FROM line WHERE id = @lineId`;
    const existingLine = await executeQuery(
      checkLineQuery,
      { lineId },
      transaction
    );

    if (!existingLine || existingLine.length === 0) {
      throw new NotFoundError(`Line with ID ${lineId} not found`);
    }

    const getRoutesQuery = `SELECT id FROM route WHERE line_id = @lineId`;
    const existingRoutes = await executeQuery(
      getRoutesQuery,
      { lineId },
      transaction
    );

    for (const route of existingRoutes) {
      await cleanupRouteRecords(route.id, transaction);
    }

    const deleteRoutesQuery = `DELETE FROM route WHERE line_id = @lineId`;
    await executeQuery(deleteRoutesQuery, { lineId }, transaction);

    if (lineToUpdate.name || lineToUpdate.lineTypeId) {
      const updateFields = [];
      const updateParams = { lineId };

      if (lineToUpdate.name) {
        updateFields.push("name = @name");
        updateParams.name = lineToUpdate.name;
      }

      if (lineToUpdate.lineTypeId) {
        updateFields.push("line_type_id = @lineTypeId");
        updateParams.lineTypeId = lineToUpdate.lineTypeId;
      }

      if (updateFields.length > 0) {
        const updateLineQuery = `
          UPDATE line 
          SET ${updateFields.join(", ")}
          OUTPUT INSERTED.*
          WHERE id = @lineId
        `;
        const updatedLine = await executeQuery(
          updateLineQuery,
          updateParams,
          transaction
        );
        if (!updatedLine || updatedLine.length === 0) {
          throw new DatabaseError("Failed to update line");
        }
      }
    }

    const routes = [];
    const routeResults = [];

    for (const routeData of lineToUpdate.routes) {
      const route = await addRoute(
        lineId,
        routeData.isCircular,
        routeData.isNight,
        transaction
      );
      routes.push(route);

      if (routeData.fullRoutes && routeData.fullRoutes.length) {
        const results = await processRouteData(
          routeData.fullRoutes,
          route.id,
          transaction
        );
        routeResults.push({ routeId: route.id, results });
      }
    }

    const getUpdatedLineQuery = `SELECT * FROM line WHERE id = @lineId`;
    const updatedLine = await executeQuery(
      getUpdatedLineQuery,
      { lineId },
      transaction
    );

    await commitTransaction(transaction);

    return {
      line: updatedLine[0],
      routes,
      routeResults,
    };
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
};

/**
 * Gets a line by ID with all its associated routes
 * @param {number} lineId - The ID of the line to retrieve
 * @returns {Promise<Object>} The line with its routes
 */
const getLineById = async (lineId) => {
  if (!lineId) {
    throw new ValidationError("Line ID is required");
  }

  const getLineQuery = `SELECT * FROM line WHERE id = @lineId`;
  const line = await executeQuery(getLineQuery, { lineId });

  if (!line || line.length === 0) {
    throw new NotFoundError(`Line with ID ${lineId} not found`);
  }

  const getRoutesQuery = `SELECT * FROM route WHERE line_id = @lineId`;
  const routes = await executeQuery(getRoutesQuery, { lineId });

  const routesWithDetails = [];

  for (const route of routes) {
    const fullRouteQuery = `
      SELECT fr.*, s.map, s.street, s.stop_group_id 
      FROM full_route fr
      JOIN stop s ON fr.stop_id = s.id
      WHERE fr.route_id = @routeId
      ORDER BY fr.stop_number
    `;
    const fullRoute = await executeQuery(fullRouteQuery, { routeId: route.id });

    const departureRoutesQuery = `
      SELECT * FROM departure_route
      WHERE route_id = @routeId
    `;
    const departureRoutes = await executeQuery(departureRoutesQuery, {
      routeId: route.id,
    });

    const departureRoutesWithDetails = [];

    for (const dr of departureRoutes) {
      const additionalStopsQuery = `
        SELECT * FROM additional_stop
        WHERE route_id = @drId
      `;
      const additionalStops = await executeQuery(additionalStopsQuery, {
        drId: dr.id,
      });

      const timetableQuery = `
        SELECT * FROM timetable
        WHERE route_id = @drId
        ORDER BY departure_time
      `;
      const timetable = await executeQuery(timetableQuery, { drId: dr.id });

      departureRoutesWithDetails.push({
        ...dr,
        additionalStops,
        timetable,
      });
    }

    routesWithDetails.push({
      ...route,
      fullRoute,
      departureRoutes: departureRoutesWithDetails,
    });
  }

  return {
    ...line[0],
    routes: routesWithDetails,
  };
};

/**
 * Gets all lines with basic information
 * @returns {Promise<Array>} Array of all lines
 */
const getAllLines = async () => {
  const query = `
    SELECT l.*, lt.name_singular, lt.name_plural, lt.color 
    FROM line l
    JOIN line_type lt ON l.line_type_id = lt.id
    ORDER BY l.name
  `;

  const lines = await executeQuery(query);
  return lines;
};

/**
 * Gets all routes for a specific line
 * @param {number} lineId - The ID of the line
 * @returns {Promise<Array>} Array of routes for the line
 */
const getRoutesByLineId = async (lineId) => {
  if (!lineId) {
    throw new ValidationError("Line ID is required");
  }

  const checkLineQuery = `SELECT * FROM line l JOIN line_type lt ON l.line_type_id = lt.id WHERE l.id = @lineId`;
  const line = await executeQuery(checkLineQuery, { lineId });

  if (!line || line.length === 0) {
    throw new NotFoundError(`Line with ID ${lineId} not found`);
  }

  const getRoutesQuery = `
    SELECT 
      r.id as route_id, 
      r.is_circular,
      r.is_night,
      l.id as line_id,
      l.name as line_name,
      lt.color as line_color
    FROM route r
    JOIN line l ON r.line_id = l.id
    JOIN line_type lt ON l.line_type_id = lt.id
    WHERE l.id = @lineId
  `;

  const routes = await executeQuery(getRoutesQuery, { lineId });

  const routesWithStops = [];

  for (const route of routes) {
    const fullRouteQuery = `
      SELECT 
        fr.id as full_route_id,
        fr.stop_number,
        fr.travel_time,
        fr.is_on_request,
        fr.is_first,
        fr.is_last,
        fr.is_optional,
        s.id as stop_id,
        s.map,
        s.street,
        sg.name as stop_group_name
      FROM full_route fr
      JOIN stop s ON fr.stop_id = s.id
      JOIN stop_group sg ON s.stop_group_id = sg.id
      WHERE fr.route_id = @routeId
      ORDER BY fr.stop_number
    `;

    const stops = await executeQuery(fullRouteQuery, {
      routeId: route.route_id,
    });

    routesWithStops.push({
      ...route,
      stops,
    });
  }

  return routesWithStops;
};

/**
 * Deletes a line and all associated data
 * @param {number} lineId - The ID of the line to delete
 * @returns {Promise<void>}
 */
const deleteLine = async (lineId) => {
  if (!lineId) {
    throw new ValidationError("Line ID is required");
  }

  const checkLineQuery = `SELECT id FROM line WHERE id = @lineId`;
  const existingLine = await executeQuery(checkLineQuery, { lineId });

  if (!existingLine || existingLine.length === 0) {
    throw new NotFoundError(`Line with ID ${lineId} not found`);
  }

  const transaction = await beginTransaction();

  try {
    const getRoutesQuery = `SELECT id FROM route WHERE line_id = @lineId`;
    const routes = await executeQuery(getRoutesQuery, { lineId }, transaction);

    for (const route of routes) {
      await cleanupRouteRecords(route.id, transaction);
    }

    const deleteRoutesQuery = `DELETE FROM route WHERE line_id = @lineId`;
    await executeQuery(deleteRoutesQuery, { lineId }, transaction);

    const deleteLineQuery = `DELETE FROM line WHERE id = @lineId`;
    await executeQuery(deleteLineQuery, { lineId }, transaction);

    await commitTransaction(transaction);
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
};

module.exports = {
  addLine,
  addRoute,
  addFullRouteBatch,
  addDepartureRouteBatch,
  addAdditionalStopBatch,
  addTimetableDeparturesBatch,
  getStopType,
  processRouteData,
  cleanupRouteRecords,
  addFullLine,
  updateFullLine,
  getLineById,
  getAllLines,
  getRoutesByLineId,
  deleteLine,
  preprocessLineData,
  prepareVariantsFromUI,
};
