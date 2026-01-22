import type { Express } from "express";
import { storage } from "../storage";
import { insertPrescriptionSchema, insertCertificateSchema, insertExamRequestSchema, insertExamProtocolSchema } from "@shared/schema";
import { z } from "zod";

function ensureAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
}

export function registerDocumentRoutes(app: Express) {
    // Prescriptions
    app.post("/api/prescriptions", ensureAuthenticated, async (req, res) => {
        try {
            const data = insertPrescriptionSchema.parse(req.body);
            const prescription = await storage.createPrescription(data);
            res.json(prescription);
        } catch (error) {
            console.error('Error creating prescription:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    app.get("/api/prescriptions/patient/:profileId", ensureAuthenticated, async (req, res) => {
        const profileId = parseInt(req.params.profileId);
        if (isNaN(profileId)) return res.status(400).send("Invalid profile ID");

        const list = await storage.getPrescriptionsByProfileId(profileId);
        res.json(list);
    });

    app.put("/api/prescriptions/:id", ensureAuthenticated, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).send("Invalid prescription ID");

            const data = insertPrescriptionSchema.parse(req.body);
            const prescription = await storage.updatePrescription(id, data);
            if (!prescription) return res.status(404).json({ message: "Prescription not found" });
            res.json(prescription);
        } catch (error) {
            console.error('Error updating prescription:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    app.patch("/api/prescriptions/:id/status", ensureAuthenticated, async (_req, res) => {
        res.status(403).json({ message: "Receitas não podem ser alteradas após serem salvas (LGPD)." });
    });


    // Certificates
    app.post("/api/certificates", ensureAuthenticated, async (req, res) => {
        try {
            const data = insertCertificateSchema.parse(req.body);
            const certificate = await storage.createCertificate(data);
            res.json(certificate);
        } catch (error) {
            console.error('Error creating certificate:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    app.get("/api/certificates/patient/:profileId", ensureAuthenticated, async (req, res) => {
        const profileId = parseInt(req.params.profileId);
        if (isNaN(profileId)) return res.status(400).send("Invalid profile ID");

        const list = await storage.getCertificatesByProfileId(profileId);
        res.json(list);
    });

    app.patch("/api/certificates/:id/status", ensureAuthenticated, async (_req, res) => {
        res.status(403).json({ message: "Atestados/laudos não podem ser alterados após serem salvos (LGPD)." });
    });

    // Exam Requests - Solicitação de exames
    app.post("/api/exam-requests", ensureAuthenticated, async (req, res) => {
        try {
            const data = insertExamRequestSchema.parse(req.body);
            const examRequest = await storage.createExamRequest(data);
            res.json(examRequest);
        } catch (error) {
            console.error('Error creating exam request:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    app.get("/api/exam-requests/patient/:profileId", ensureAuthenticated, async (req, res) => {
        const profileId = parseInt(req.params.profileId);
        if (isNaN(profileId)) return res.status(400).send("Invalid profile ID");

        const list = await storage.getExamRequestsByProfileId(profileId);
        res.json(list);
    });

    app.put("/api/exam-requests/:id", ensureAuthenticated, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).send("Invalid exam request ID");

            const data = insertExamRequestSchema.parse(req.body);
            const examRequest = await storage.updateExamRequest(id, data);
            if (!examRequest) return res.status(404).json({ message: "Exam request not found" });
            res.json(examRequest);
        } catch (error) {
            console.error('Error updating exam request:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    app.patch("/api/exam-requests/:id/status", ensureAuthenticated, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).send("Invalid exam request ID");

            const { status } = req.body;
            if (!['pending', 'completed', 'cancelled'].includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }

            const examRequest = await storage.updateExamRequestStatus(id, status);
            if (!examRequest) return res.status(404).json({ message: "Exam request not found" });
            res.json(examRequest);
        } catch (error) {
            console.error('Error updating exam request status:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    // ===== Exam Protocols Routes =====

    // Get all protocols for current user
    app.get("/api/exam-protocols", ensureAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as any).id;
            const protocols = await storage.getExamProtocolsByUserId(userId);
            res.json(protocols);
        } catch (error) {
            console.error('Error fetching exam protocols:', error);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Create new protocol
    app.post("/api/exam-protocols", ensureAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as any).id;
            const data = insertExamProtocolSchema.parse({ ...req.body, userId });
            const protocol = await storage.createExamProtocol(data);
            res.json(protocol);
        } catch (error) {
            console.error('Error creating exam protocol:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    // Update protocol
    app.put("/api/exam-protocols/:id", ensureAuthenticated, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).send("Invalid protocol ID");

            const protocol = await storage.updateExamProtocol(id, req.body);
            if (!protocol) return res.status(404).json({ message: "Protocol not found" });
            res.json(protocol);
        } catch (error) {
            console.error('Error updating exam protocol:', error);
            res.status(400).json({ message: "Invalid data or server error" });
        }
    });

    // Delete protocol
    app.delete("/api/exam-protocols/:id", ensureAuthenticated, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).send("Invalid protocol ID");

            const success = await storage.deleteExamProtocol(id);
            if (!success) return res.status(404).json({ message: "Protocol not found" });
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting exam protocol:', error);
            res.status(400).json({ message: "Server error" });
        }
    });
}
