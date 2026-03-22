require('dotenv').config();
const Router = require('express');
const notesRouter = Router();
const { notesModel: noteModel } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const z = require("zod");

notesRouter.post("/", authMiddleware, async function(req, res) {
    const requiredBody = z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        isPublic: z.boolean().optional().default(false),
        tags: z.array(z.string()).optional().default([])
    });

    const parsedData = requiredBody.safeParse(req.body);
    
    if(!parsedData.success){
        return res.status(400).json({
            message: "Invalid input format",
            error: parsedData.error
        });
    }

    const { title, content, isPublic, tags } = req.body;

    try{
        const note = await noteModel.create({
            title,
            content,
            userId: req.userId,
            isPublic: isPublic || false,
            tags: tags || [],
            shareLink: isPublic ? uuidv4() : null
        });

        res.json({
            message: "Note created successfully",
            note: {
                id: note._id,
                title: note.title,
                content: note.content,
                isPublic: note.isPublic,
                tags: note.tags,
                shareLink: note.shareLink,
                createdAt: note.createdAt
            }
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error creating note",
            error: e.message
        });
    }
});

notesRouter.get("/", authMiddleware, async function(req, res) {
    try{
        const notes = await noteModel.find({
            userId: req.userId
        }).sort({ createdAt: -1 });

        res.json({
            notes: notes.map(note => ({
                id: note._id,
                title: note.title,
                content: note.content.substring(0, 100) + "...",
                isPublic: note.isPublic,
                tags: note.tags,
                shareLink: note.shareLink,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt
            }))
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error fetching notes",
            error: e.message
        });
    }
});

notesRouter.get("/public/:shareLink", async function(req, res) {
    const { shareLink } = req.params;

    try{
        const note = await noteModel.findOne({
            shareLink: shareLink,
            isPublic: true
        });

        if(!note){
            return res.status(404).json({
                message: "Note not found or not public"
            });
        }

        res.json({
            note: {
                title: note.title,
                content: note.content,
                tags: note.tags,
                createdAt: note.createdAt
            }
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error fetching note",
            error: e.message
        });
    }
});

notesRouter.get("/tags/all", authMiddleware, async function(req, res) {
    try{
        const notes = await noteModel.find({
            userId: req.userId
        });

        const allTags = [...new Set(notes.flatMap(note => note.tags))];

        res.json({
            tags: allTags
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error fetching tags",
            error: e.message
        });
    }
});

notesRouter.get("/:id", authMiddleware, async function(req, res) {
    const { id } = req.params;

    try{
        const note = await noteModel.findOne({
            _id: id,
            userId: req.userId
        });

        if(!note){
            return res.status(404).json({
                message: "Note not found"
            });
        }

        res.json({
            note: {
                id: note._id,
                title: note.title,
                content: note.content,
                isPublic: note.isPublic,
                tags: note.tags,
                shareLink: note.shareLink,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt
            }
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error fetching note",
            error: e.message
        });
    }
});

notesRouter.put("/:id", authMiddleware, async function(req, res) {
    const { id } = req.params;

    const updateBody = z.object({
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        isPublic: z.boolean().optional(),
        tags: z.array(z.string()).optional()
    });

    const parsedData = updateBody.safeParse(req.body);
    
    if(!parsedData.success){
        return res.status(400).json({
            message: "Invalid input format",
            error: parsedData.error
        });
    }

    try{
        let updateData = { ...req.body };
        if(req.body.isPublic === true){
            const existingNote = await noteModel.findOne({
                _id: id,
                userId: req.userId
            });
            
            if(existingNote && !existingNote.shareLink){
                updateData.shareLink = uuidv4();
            }
        }

        const note = await noteModel.findOneAndUpdate(
            {
                _id: id,
                userId: req.userId 
            },
            updateData,
            { new: true } 
        );

        if(!note){
            return res.status(404).json({
                message: "Note not found"
            });
        }

        res.json({
            message: "Note updated successfully",
            note: {
                id: note._id,
                title: note.title,
                content: note.content,
                isPublic: note.isPublic,
                tags: note.tags,
                shareLink: note.shareLink,
                updatedAt: note.updatedAt
            }
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error updating note",
            error: e.message
        });
    }
});

notesRouter.delete("/:id", authMiddleware, async function(req, res) {
    const { id } = req.params;

    try{
        const note = await noteModel.findOneAndDelete({
            _id: id,
            userId: req.userId 
        });

        if(!note){
            return res.status(404).json({
                message: "Note not found"
            });
        }

        res.json({
            message: "Note deleted successfully"
        });
    } 
    catch(e){
        res.status(500).json({
            message: "Error deleting note",
            error: e.message
        });
    }
});

module.exports = {
    notesRouter
};