const { executeQuery } = require("../utils/sqlHelper");
const {
  ValidationError,
  NotFoundError,
  DatabaseError,
} = require("../utils/errorHandler");

/**
 * Creates a new line type
 * @param {Object} lineType - The line type to create
 * @param {string} lineType.nameSingular - Singular name of the line type (e.g., "Bus")
 * @param {string} lineType.namePlural - Plural name of the line type (e.g., "Buses")
 * @param {string} lineType.color - Color code for the line type (e.g., "#FF0000")
 * @returns {Promise<Object>} The newly created line type
 */
const addLineType = async (lineType) => {
  if (!lineType.nameSingular) {
    throw new ValidationError("Line type singular name is required");
  }

  if (!lineType.namePlural) {
    throw new ValidationError("Line type plural name is required");
  }

  if (!lineType.color) {
    throw new ValidationError("Line type color is required");
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(lineType.color)) {
    throw new ValidationError(
      "Line type color must be a valid hex color code (e.g., #FF0000)"
    );
  }

  const query = `
    INSERT INTO line_type(name_singular, name_plural, color)
    OUTPUT INSERTED.*
    VALUES (@name_singular, @name_plural, @color)
  `;

  const result = await executeQuery(query, {
    name_singular: lineType.nameSingular,
    name_plural: lineType.namePlural,
    color: lineType.color,
  });

  if (!result || result.length === 0) {
    throw new DatabaseError("Failed to create line type");
  }

  return result[0];
};

/**
 * Updates an existing line type
 * @param {Object} lineType - The line type to update
 * @param {number} lineType.id - ID of the line type to update
 * @param {string} [lineType.nameSingular] - Singular name of the line type
 * @param {string} [lineType.namePlural] - Plural name of the line type
 * @param {string} [lineType.color] - Color code for the line type
 * @returns {Promise<Object>} The updated line type
 */
const updateLineType = async (lineType) => {
  if (!lineType.id) {
    throw new ValidationError("Line type ID is required");
  }

  const updateFields = [];
  const params = { id: lineType.id };

  if (lineType.nameSingular !== undefined) {
    updateFields.push("name_singular = @name_singular");
    params.name_singular = lineType.nameSingular;
  }

  if (lineType.namePlural !== undefined) {
    updateFields.push("name_plural = @name_plural");
    params.name_plural = lineType.namePlural;
  }

  if (lineType.color !== undefined) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(lineType.color)) {
      throw new ValidationError(
        "Line type color must be a valid hex color code (e.g., #FF0000)"
      );
    }
    updateFields.push("color = @color");
    params.color = lineType.color;
  }

  if (updateFields.length === 0) {
    throw new ValidationError("No fields to update");
  }

  const query = `
    UPDATE line_type
    SET ${updateFields.join(", ")}
    OUTPUT INSERTED.*
    WHERE id = @id
  `;

  const result = await executeQuery(query, params);

  if (!result || result.length === 0) {
    throw new NotFoundError(`Line type with ID ${lineType.id} not found`);
  }

  return result[0];
};

/**
 * Gets all line types
 * @returns {Promise<Array<Object>>} All line types
 */
const getAllLineTypes = async () => {
  const query = `
    SELECT * FROM line_type
    ORDER BY id
  `;

  return await executeQuery(query);
};

/**
 * Gets a single line type by ID
 * @param {number} id - The ID of the line type to retrieve
 * @returns {Promise<Object>} The line type
 */
const getLineTypeById = async (id) => {
  if (!id) {
    throw new ValidationError("Line type ID is required");
  }

  const query = `
    SELECT * FROM line_type
    WHERE id = @id
  `;

  const result = await executeQuery(query, { id });

  if (!result || result.length === 0) {
    throw new NotFoundError(`Line type with ID ${id} not found`);
  }

  return result[0];
};

/**
 * Deletes a line type
 * @param {number} id - The ID of the line type to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
const deleteLineType = async (id) => {
  if (!id) {
    throw new ValidationError("Line type ID is required");
  }

  const checkQuery = `
    SELECT COUNT(*) AS count FROM line
    WHERE line_type_id = @id
  `;

  const checkResult = await executeQuery(checkQuery, { id });

  if (checkResult[0].count > 0) {
    throw new ValidationError(
      `Cannot delete line type ${id} because it's still in use by ${checkResult[0].count} line(s)`
    );
  }

  const query = `
    DELETE FROM line_type
    WHERE id = @id
  `;

  const result = await executeQuery(query, { id });

  if (result.rowsAffected === 0) {
    throw new NotFoundError(`Line type with ID ${id} not found`);
  }

  return true;
};

module.exports = {
  addLineType,
  updateLineType,
  getAllLineTypes,
  getLineTypeById,
  deleteLineType,
};
