import type { Express } from "express";
import { storage } from "../storage";
import { insertPrescriptionSchema, insertCertificateSchema } from "@shared/schema";
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
}
