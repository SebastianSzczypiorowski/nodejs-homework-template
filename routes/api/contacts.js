const express = require("express");
const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateContactStatus,
} = require("../../models/contacts");

const joi = require("joi");
const router = express.Router();

const contactModel = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  phone: joi
    .string()
    .pattern(/^\d{10}$/)
    .required(),
  favorite: joi.boolean().required(),
});

router.get("/", async (req, res, next) => {
  try {
    const contacts = await listContacts();
    res.json({
      status: "success",
      code: 200,
      contacts,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const id = req.params.contactId;
    const contact = await getContactById(id);
    if (contact) {
      res.json({
        status: "success",
        code: 200,
        contact,
      });
    } else {
      res.status(404).json({ message: "Contact not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!contactModel.validate(req.body)) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const contactAdded = await addContact(req.body);
    if (contactAdded) {
      res.json({
        status: "success",
        code: 200,
        message: "Contact added!",
      });
    } else {
      res
        .status(500)
        .json({ message: "An error occurred while adding a contact" });
    }
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const id = req.params.contactId;
    const removedContact = await removeContact(id);
    if (removedContact) {
      res.json({
        status: "success",
        code: 200,
        message: "Contact removed!",
      });
    } else {
      res.status(404).json({ message: "Contact not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const { favorite } = req.body;
    if (favorite === undefined) {
      res.status(400).json({ message: "Missing field 'favorite'" });
      return;
    }
    const updatedContact = await updateContactStatus(contactId, favorite);
    if (updatedContact) {
      res.json({
        status: "success",
        code: 200,
        contact: updatedContact,
      });
    } else {
      res.status(404).json({ message: "Contact not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const body = req.body;

    const updatedContact = await updateContact(contactId, body);

    if (updatedContact) {
      res.json({
        status: "success",
        code: 200,
        message: "Contact updated!",
        contact: updatedContact,
      });
    } else {
      res.status(404).json({ message: "Contact not found" });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
