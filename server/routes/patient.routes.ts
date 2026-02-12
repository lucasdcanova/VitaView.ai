import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { pool } from "../db";
import { ensureAuthenticated } from "../middleware/auth.middleware";
import { generateChronologicalReport, callOpenAIApi } from "../services/openai";
import logger from "../logger";
import { createHash } from "crypto";

export function registerPatientRoutes(app: Express) {

    // --- Diagnoses ---
    app.get("/api/diagnoses", ensureAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as any).id;
            const diagnoses = await storage.getDiagnosesByUserId(userId);

            // LGPD Audit Log
            await storage.createAuditLog({
                userId: userId,
                action: "READ",
                resourceType: "patient_diagnoses",
                resourceId: null, // List view
                ipAddress: req.ip || null,
                userAgent: req.get('User-Agent') || null,
                requestMethod: "GET",
                requestPath: "/api/diagnoses",
                statusCode: 200,
                accessReason: "clinical_history_view",
                severity: "INFO",
                complianceFlags: { lgpd: true }
            });

            res.json(diagnoses || []);
        } catch (error) {
            res.status(500).json({ message: "Erro ao buscar diagnósticos" });
        }
    });

    app.post("/api/diagnoses", ensureAuthenticated, async (req, res) => {
        try {
            const diagnosisData = {
                userId: (req.user as any).id,
                profileId: req.body.profileId || null,
                cidCode: req.body.cidCode,
                diagnosisDate: req.body.diagnosisDate,
                status: req.body.status,
                notes: req.body.notes || null,
            };

            const newDiagnosis = await storage.createDiagnosis(diagnosisData);
            res.status(201).json(newDiagnosis);
        } catch (error) {
            res.status(500).json({ message: "Erro ao criar diagnóstico" });
        }
    });

    app.put("/api/diagnoses/:id", ensureAuthenticated, async (req, res) => {
        try {
            const diagnosisId = parseInt(req.params.id);
            const diagnosis = await storage.getDiagnosis(diagnosisId);

            if (!diagnosis) {
                return res.status(404).json({ message: "Diagnóstico não encontrado" });
            }

            if (diagnosis.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            const updatedDiagnosis = await storage.updateDiagnosis(diagnosisId, req.body);
            res.json(updatedDiagnosis);
        } catch (error) {
            res.status(500).json({ message: "Erro ao atualizar diagnóstico" });
        }
    });

    app.delete("/api/diagnoses/:id", ensureAuthenticated, async (req, res) => {
        try {
            const diagnosisId = parseInt(req.params.id);
            const diagnosis = await storage.getDiagnosis(diagnosisId);

            if (!diagnosis) {
                return res.status(404).json({ message: "Diagnóstico não encontrado" });
            }

            if (diagnosis.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            await storage.deleteDiagnosis(diagnosisId);
            res.json({ message: "Diagnóstico excluído com sucesso" });
        } catch (error) {
            res.status(500).json({ message: "Erro ao excluir diagnóstico" });
        }
    });

    // --- Surgeries ---
    app.get("/api/surgeries", ensureAuthenticated, async (req, res) => {
        try {
            const surgeries = await storage.getSurgeriesByUserId((req.user as any).id);
            res.json(surgeries || []);
        } catch (error) {
            res.status(500).json({ message: "Erro ao buscar cirurgias" });
        }
    });

    app.post("/api/surgeries", ensureAuthenticated, async (req, res) => {
        try {
            const surgeryData = {
                userId: (req.user as any).id,
                procedureName: req.body.procedureName,
                hospitalName: req.body.hospitalName,
                surgeonName: req.body.surgeonName,
                surgeryDate: req.body.surgeryDate,
                notes: req.body.notes || null,
            };

            const newSurgery = await storage.createSurgery(surgeryData);
            res.status(201).json(newSurgery);
        } catch (error) {
            res.status(500).json({ message: "Erro ao criar cirurgia" });
        }
    });

    app.put("/api/surgeries/:id", ensureAuthenticated, async (req, res) => {
        try {
            const surgeryId = parseInt(req.params.id);
            const surgery = await storage.getSurgery(surgeryId);

            if (!surgery) {
                return res.status(404).json({ message: "Cirurgia não encontrada" });
            }

            if (surgery.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            const updatedSurgery = await storage.updateSurgery(surgeryId, req.body);
            res.json(updatedSurgery);
        } catch (error) {
            res.status(500).json({ message: "Erro ao atualizar cirurgia" });
        }
    });

    app.delete("/api/surgeries/:id", ensureAuthenticated, async (req, res) => {
        try {
            const surgeryId = parseInt(req.params.id);
            const surgery = await storage.getSurgery(surgeryId);

            if (!surgery) {
                return res.status(404).json({ message: "Cirurgia não encontrada" });
            }

            if (surgery.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            await storage.deleteSurgery(surgeryId);
            res.json({ message: "Cirurgia excluída com sucesso" });
        } catch (error) {
            res.status(500).json({ message: "Erro ao excluir cirurgia" });
        }
    });

    // --- Evolutions ---
    app.get("/api/evolutions", ensureAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as any).id;
            let profileId: number | undefined;

            if (req.query.profileId) {
                profileId = parseInt(req.query.profileId as string);
            } else {
                const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>) || {};

                if (cookies['active_profile_id']) {
                    profileId = parseInt(cookies['active_profile_id']);
                }
            }

            if (!profileId) {
                return res.json([]);
            }

            const evolutions = await storage.getEvolutionsByProfileId(userId, profileId);
            res.json(evolutions || []);
        } catch (error) {
            console.error("Erro ao buscar evoluções:", error);
            res.status(500).json({ message: "Erro ao buscar evoluções" });
        }
    });

    app.post("/api/evolutions", ensureAuthenticated, async (req, res) => {
        try {
            const { text, date, profileId } = req.body;

            if (!profileId) {
                return res.status(400).json({ message: "profileId é obrigatório" });
            }

            const loggedInUser = req.user as any;
            const preferences = loggedInUser.preferences && typeof loggedInUser.preferences === 'object'
                ? loggedInUser.preferences as Record<string, any>
                : (typeof loggedInUser.preferences === 'string' ? JSON.parse(loggedInUser.preferences) : null);

            const isSecretary = preferences?.delegateType === "secretary" && preferences?.delegateForUserId;
            const professionalName = isSecretary
                ? (loggedInUser.fullName || loggedInUser.username)
                : (loggedInUser.fullName || loggedInUser.username || "Profissional");

            const evolutionData = {
                userId: loggedInUser.id,
                profileId: profileId,
                text: text,
                professionalName: professionalName,
                date: date ? new Date(date) : new Date(),
            };

            const newEvolution = await storage.createEvolution(evolutionData);
            res.status(201).json(newEvolution);
        } catch (error) {
            console.error("Erro ao criar evolução:", error);
            res.status(500).json({ message: "Erro ao criar evolução" });
        }
    });

    app.post("/api/evolutions/:id/finalize", ensureAuthenticated, async (req, res) => {
        try {
            const evolutionId = parseInt(req.params.id);
            const evolution = await storage.getEvolution(evolutionId);

            if (!evolution) {
                return res.status(404).json({ message: "Evolução não encontrada" });
            }

            if (evolution.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            if (evolution.isSigned) {
                return res.status(400).json({ message: "Evolução já está finalizada e assinada." });
            }

            // Create signature hash (Simulating digital signature for CFM NGS-1/2)
            // In a real NGS-2 scenario, this would involve a client-side certificate token.
            const contentToSign = `${evolution.id}:${evolution.userId}:${evolution.date.toISOString()}:${evolution.text}`;
            const signatureHash = createHash('sha256').update(contentToSign).digest('hex');

            const updatedEvolution = await storage.updateEvolution(evolutionId, {
                isSigned: true,
                signatureHash: signatureHash,
                signedAt: new Date(),
            });

            // Log for Audit
            await storage.createAuditLog({
                userId: (req.user as any).id,
                action: "SIGN",
                resourceType: "patient_evolution",
                resourceId: evolutionId,
                ipAddress: req.ip || null,
                userAgent: req.get('User-Agent') || null,
                requestMethod: "POST",
                requestPath: `/api/evolutions/${evolutionId}/finalize`,
                statusCode: 200,
                accessReason: "document_finalization",
                severity: "INFO",
                complianceFlags: { cfm: true, lgpd: true }
            });

            res.json(updatedEvolution);
        } catch (error) {
            console.error("Erro ao finalizar evolução:", error);
            res.status(500).json({ message: "Erro ao finalizar evolução" });
        }
    });

    app.delete("/api/evolutions/:id", ensureAuthenticated, async (req, res) => {
        try {
            const evolutionId = parseInt(req.params.id);
            const evolution = await storage.getEvolution(evolutionId);

            if (!evolution) {
                return res.status(404).json({ message: "Evolução não encontrada" });
            }

            if (evolution.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            res.status(403).json({ message: "Evoluções não podem ser excluídas após serem salvas (LGPD)." });
        } catch (error) {
            res.status(500).json({ message: "Erro ao excluir evolução" });
        }
    });

    // --- Habits ---
    app.get("/api/habits", ensureAuthenticated, async (req, res) => {
        try {
            const habits = await storage.getHabitsByUserId((req.user as any).id);
            res.json(habits || []);
        } catch (error) {
            res.status(500).json({ message: "Erro ao buscar hábitos" });
        }
    });

    app.post("/api/habits", ensureAuthenticated, async (req, res) => {
        try {
            const habitData = {
                userId: (req.user as any).id,
                profileId: req.body.profileId || null,
                habitType: req.body.habitType,
                status: req.body.status,
                frequency: req.body.frequency || null,
                quantity: req.body.quantity || null,
                startDate: req.body.startDate || null,
                endDate: req.body.endDate || null,
                notes: req.body.notes || null,
            };

            const newHabit = await storage.createHabit(habitData);
            res.status(201).json(newHabit);
        } catch (error) {
            res.status(500).json({ message: "Erro ao criar hábito" });
        }
    });

    app.put("/api/habits/:id", ensureAuthenticated, async (req, res) => {
        try {
            const habitId = parseInt(req.params.id);
            const habit = await storage.getHabit(habitId);

            if (!habit) {
                return res.status(404).json({ message: "Hábito não encontrado" });
            }

            if (habit.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            const updatedHabit = await storage.updateHabit(habitId, req.body);
            res.json(updatedHabit);
        } catch (error) {
            res.status(500).json({ message: "Erro ao atualizar hábito" });
        }
    });

    app.delete("/api/habits/:id", ensureAuthenticated, async (req, res) => {
        try {
            const habitId = parseInt(req.params.id);
            const habit = await storage.getHabit(habitId);

            if (!habit) {
                return res.status(404).json({ message: "Hábito não encontrado" });
            }

            if (habit.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado" });
            }

            await storage.deleteHabit(habitId);
            res.json({ message: "Hábito excluído com sucesso" });
        } catch (error) {
            res.status(500).json({ message: "Erro ao excluir hábito" });
        }
    });


    // --- Chronological Report ---
    app.get("/api/reports/chronological", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            // Buscar todos os resultados de exames do usuário
            const exams = await storage.getExamsByUserId(user.id);

            if (!exams || exams.length === 0) {
                return res.status(404).json({ message: "Nenhum exame encontrado para análise" });
            }

            // Buscar resultados de exames
            const examResults = [];
            for (const exam of exams) {
                const result = await storage.getExamResultByExamId(exam.id);
                if (result) {
                    // Adicionamos a data do exame ao resultado para ordenação cronológica
                    examResults.push({
                        ...result,
                        createdAt: exam.uploadDate
                    });
                }
            }

            if (examResults.length === 0) {
                return res.status(404).json({ message: "Nenhum resultado de exame encontrado para análise" });
            }

            // Ordenar resultados por data (do mais antigo para o mais recente)
            examResults.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            // Gerar relatório cronológico
            const report = await generateChronologicalReport(examResults, user);

            res.json(report);
        } catch (error) {
            res.status(500).json({ message: "Erro ao gerar relatório cronológico" });
        }
    });

    // --- Profiles ---
    app.get("/api/profiles", ensureAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as any).id;
            const profiles = await storage.getProfilesByUserId(userId);

            // LGPD Audit Log
            await storage.createAuditLog({
                userId: userId,
                action: "READ",
                resourceType: "user_profiles",
                resourceId: null,
                ipAddress: req.ip || null,
                userAgent: req.get('User-Agent') || null,
                requestMethod: "GET",
                requestPath: "/api/profiles",
                statusCode: 200,
                accessReason: "profile_list_view",
                severity: "INFO",
                complianceFlags: { lgpd: true }
            });

            res.json(profiles);
        } catch (error) {
            res.status(500).json({ message: "Erro ao buscar perfis do usuário" });
        }
    });

    app.post("/api/profiles", ensureAuthenticated, async (req, res) => {
        try {
            const profileData = {
                ...req.body,
                userId: (req.user as any).id,
                createdAt: new Date()
            };

            const newProfile = await storage.createProfile(profileData);
            res.status(201).json(newProfile);
        } catch (error) {
            res.status(500).json({ message: "Erro ao criar perfil" });
        }
    });

    app.put("/api/profiles/:id", ensureAuthenticated, async (req, res) => {
        try {
            const profileId = parseInt(req.params.id);

            // Verificar se o perfil existe e pertence ao usuário
            const profile = await storage.getProfile(profileId);
            if (!profile) {
                return res.status(404).json({ message: "Perfil não encontrado" });
            }

            if (profile.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
            }

            const updatedProfile = await storage.updateProfile(profileId, req.body);
            res.json(updatedProfile);
        } catch (error) {
            res.status(500).json({ message: "Erro ao atualizar perfil" });
        }
    });

    app.delete("/api/profiles/:id", ensureAuthenticated, async (req, res) => {
        try {
            const profileId = parseInt(req.params.id);

            // Verificar se o perfil existe e pertence ao usuário
            const profile = await storage.getProfile(profileId);
            if (!profile) {
                return res.status(404).json({ message: "Perfil não encontrado" });
            }

            if (profile.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
            }

            // Não permitir a exclusão do perfil principal
            if (profile.isDefault) {
                return res.status(400).json({ message: "Não é possível excluir o perfil principal" });
            }

            const success = await storage.deleteProfile(profileId);
            if (success) {
                res.status(200).json({ message: "Perfil excluído com sucesso" });
            } else {
                res.status(500).json({ message: "Erro ao excluir perfil" });
            }
        } catch (error) {
            res.status(500).json({ message: "Erro ao excluir perfil" });
        }
    });

    // API routes for active profile switch
    app.put("/api/users/active-profile", ensureAuthenticated, async (req, res) => {
        try {
            const { profileId } = req.body;
            if (!profileId) {
                return res.status(400).json({ message: "ID do perfil é obrigatório" });
            }

            // Verificar se o perfil existe e pertence ao usuário
            const profile = await storage.getProfile(profileId);
            if (!profile) {
                return res.status(404).json({ message: "Perfil não encontrado" });
            }

            if (profile.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Acesso negado: este perfil não pertence ao usuário" });
            }

            res.cookie('active_profile_id', profileId.toString(), {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: false,
                secure: false,
                sameSite: 'lax',
                path: '/'
            });

            // Responder com o perfil selecionado
            res.json(profile);
        } catch (error) {
            res.status(500).json({ message: "Erro ao alterar perfil ativo" });
        }
    });

    // --- Medications (using pool directly to preserve legacy logic) ---
    app.post("/api/medications", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const { name, format, dosage, dosageUnit, frequency, doseAmount, prescriptionType, quantity, administrationRoute, notes, startDate, isActive } = req.body;

            if (!name) {
                return res.status(400).json({ message: "Nome do medicamento é obrigatório" });
            }

            // Insert into database
            const result = await pool.query(
                `INSERT INTO medications (
          user_id, name, format, dosage, dosage_unit, frequency, dose_amount, 
          prescription_type, quantity, administration_route, notes, start_date, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *`,
                [
                    user.id,
                    name,
                    format || 'comprimido',
                    dosage,
                    dosageUnit || 'mg',
                    frequency,
                    doseAmount || 1,
                    prescriptionType || 'padrao',
                    quantity || null,
                    administrationRoute || 'oral',
                    notes || null,
                    startDate,
                    isActive !== false
                ]
            );

            const newMedication = result.rows[0];

            // Convert to camelCase for frontend
            const responseData = {
                id: newMedication.id,
                userId: newMedication.user_id,
                name: newMedication.name,
                format: newMedication.format,
                dosage: newMedication.dosage,
                dosageUnit: newMedication.dosage_unit,
                frequency: newMedication.frequency,
                doseAmount: newMedication.dose_amount,
                prescriptionType: newMedication.prescription_type,
                quantity: newMedication.quantity,
                administrationRoute: newMedication.administration_route,
                notes: newMedication.notes,
                startDate: newMedication.start_date,
                isActive: newMedication.is_active,
                createdAt: newMedication.created_at
            };

            console.log("✅ Medicamento criado com sucesso (PostgreSQL):", responseData);
            res.status(201).json(responseData);
        } catch (error) {
            console.error("Erro ao criar medicamento:", error);
            res.status(500).json({ message: "Erro ao criar medicamento", error: String(error) });
        }
    });

    app.get("/api/medications", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;

            const result = await pool.query(
                `SELECT * FROM medications 
         WHERE user_id = $1 AND is_active = true
         ORDER BY created_at DESC`,
                [user.id]
            );

            // Convert to camelCase for frontend
            const medications = result.rows.map(m => ({
                id: m.id,
                userId: m.user_id,
                name: m.name,
                format: m.format,
                dosage: m.dosage,
                dosageUnit: m.dosage_unit,
                frequency: m.frequency,
                doseAmount: m.dose_amount,
                prescriptionType: m.prescription_type,
                quantity: m.quantity,
                administrationRoute: m.administration_route,
                notes: m.notes,
                startDate: m.start_date,
                isActive: m.is_active,
                createdAt: m.created_at
            }));

            res.json(medications);
        } catch (error) {
            console.error("Erro ao buscar medicamentos:", error);
            res.status(500).json({ message: "Erro ao buscar medicamentos" });
        }
    });

    app.put("/api/medications/:id", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const id = parseInt(req.params.id);
            const { name, format, dosage, dosageUnit, frequency, doseAmount, prescriptionType, quantity, administrationRoute, notes, startDate } = req.body;


            if (!name) {
                return res.status(400).json({ message: "Nome do medicamento é obrigatório" });
            }

            // Update in database
            const result = await pool.query(
                `UPDATE medications 
         SET name = $1, format = $2, dosage = $3, dosage_unit = $4, frequency = $5, 
             quantity = $6, administration_route = $7, notes = $8, start_date = $9,
             dose_amount = $10, prescription_type = $11
         WHERE id = $12 AND user_id = $13
         RETURNING *`,
                [
                    name,
                    format || 'comprimido',
                    dosage,
                    dosageUnit || 'mg',
                    frequency,
                    quantity || null,
                    administrationRoute || 'oral',
                    notes || null,
                    startDate,
                    doseAmount || 1,
                    prescriptionType || 'padrao',
                    id,
                    user.id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Medicamento não encontrado" });
            }

            const updatedMedication = result.rows[0];

            // Convert to camelCase for frontend
            const responseData = {
                id: updatedMedication.id,
                userId: updatedMedication.user_id,
                name: updatedMedication.name,
                format: updatedMedication.format,
                dosage: updatedMedication.dosage,
                dosageUnit: updatedMedication.dosage_unit,
                frequency: updatedMedication.frequency,
                doseAmount: updatedMedication.dose_amount,
                prescriptionType: updatedMedication.prescription_type,
                quantity: updatedMedication.quantity,
                administrationRoute: updatedMedication.administration_route,
                notes: updatedMedication.notes,
                startDate: updatedMedication.start_date,
                isActive: updatedMedication.is_active,
                createdAt: updatedMedication.created_at
            };

            console.log("✅ Medicamento atualizado com sucesso (PostgreSQL):", responseData);
            res.json(responseData);
        } catch (error) {
            console.error("Erro ao atualizar medicamento:", error);
            res.status(500).json({ message: "Erro ao atualizar medicamento" });
        }
    });

    app.delete("/api/medications/:id", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const id = parseInt(req.params.id);

            // Soft delete - mark as inactive
            const result = await pool.query(
                `UPDATE medications 
         SET is_active = false
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
                [id, user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Medicamento não encontrado" });
            }

            console.log("✅ Medicamento marcado como inativo (PostgreSQL)");
            res.json({ message: "Medicamento excluído com sucesso" });
        } catch (error) {
            console.error("Erro ao excluir medicamento:", error);
            res.status(500).json({ message: "Erro ao excluir medicamento" });
        }
    });

    // --- Drug Interactions (AI) ---
    app.post("/api/medications/interactions", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;

            // Get subscription and plan details to check permissions
            const subscription = await storage.getUserSubscription(user.id);
            let planName = 'Gratuito';

            if (subscription && subscription.planId) {
                const plan = await storage.getSubscriptionPlan(subscription.planId);
                if (plan) {
                    planName = plan.name;
                }
            }

            // Allow if plan is NOT 'Gratuito' and subscription is active
            const isPremium = subscription?.status === 'active' && planName !== 'Gratuito';

            // If not premium, deny access
            if (!isPremium) {
                return res.status(403).json({
                    message: "Recurso exclusivo para planos Premium.",
                    isPremiumFeature: true
                });
            }

            const { medications } = req.body;

            if (!medications || !Array.isArray(medications) || medications.length < 2) {
                return res.status(400).json({ message: "É necessário fornecer pelo menos 2 medicamentos para verificar interações." });
            }

            // Construct prompt for AI
            const prompt = `
            Atue como um farmacologista clínico especialista.
            Analise as possíveis interações medicamentosas entre os seguintes medicamentos: ${medications.join(", ")}.
            Use como referência bases de dados confiáveis (ex: Drugs.com, Medscape).

            Retorne APENAS um JSON no seguinte formato, sem markdown ou texto adicional:
            {
                "interactions": [
                    {
                        "medications": ["Med1", "Med2"],
                        "severity": "Alta" | "Moderada" | "Baixa" | "Nenhuma",
                        "description": "Explicação concisa e clínica do mecanismo e risco.",
                        "management": "Sugestão de manejo clínico (ex: monitorar potássio, espaçar horários)."
                    }
                ],
                "summary": "Resumo geral da análise."
            }
            Se não houver interações conhecidas, retorne o array "interactions" vazio.
            `;

            const response = await callOpenAIApi(prompt, undefined, "drug_interaction_check", "medium", (req.user as any).id);
            res.json(response);

        } catch (error) {
            console.error("Erro ao verificar interações:", error);
            res.status(500).json({ message: "Erro ao verificar interações com IA" });
        }
    });

    // --- Allergies ---
    app.post("/api/allergies", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const { allergen, allergenType, reaction, severity, notes, profileId } = req.body;

            if (!allergen) {
                return res.status(400).json({ message: "Nome do alérgeno é obrigatório" });
            }

            const allergyData = {
                userId: user.id,
                profileId: profileId || null,
                allergen,
                allergenType: allergenType || 'medication',
                reaction,
                severity,
                notes
            };

            const newAllergy = await storage.createAllergy(allergyData);

            console.log("✅ Alergia criada com sucesso:", newAllergy);
            res.status(201).json(newAllergy);
        } catch (error) {
            console.error("Erro ao criar alergia:", error);
            res.status(500).json({ message: "Erro ao registrar alergia" });
        }
    });

    app.get("/api/allergies", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const userAllergies = await storage.getAllergiesByUserId(user.id);

            // Sort by created_at DESC
            const sorted = userAllergies.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            res.json(sorted);
        } catch (error) {
            console.error("Erro ao buscar alergias:", error);
            res.status(500).json({ message: "Erro ao buscar alergias" });
        }
    });

    app.get("/api/allergies/patient/:profileId", ensureAuthenticated, async (req, res) => {
        try {
            const profileId = parseInt(req.params.profileId);
            const user = req.user as any;

            // Verify if profile belongs to user
            const profile = await storage.getProfile(profileId);
            if (!profile || profile.userId !== user.id) {
                // Strict ownership check
            }

            const allergies = await storage.getAllergiesByProfileId(profileId);

            const sorted = allergies.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            res.json(sorted);
        } catch (error) {
            console.error("Erro ao buscar alergias do paciente:", error);
            res.status(500).json({ message: "Erro ao buscar alergias do paciente" });
        }
    });

    app.put("/api/allergies/:id", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const id = parseInt(req.params.id);
            const { allergen, allergenType, reaction, severity, notes } = req.body;

            if (!allergen) {
                return res.status(400).json({ message: "Nome do alérgeno é obrigatório" });
            }

            const existing = await storage.getAllergy(id);
            if (!existing || existing.userId !== user.id) {
                return res.status(404).json({ message: "Alergia não encontrada" });
            }

            const updated = await storage.updateAllergy(id, {
                allergen,
                allergenType,
                reaction,
                severity,
                notes
            });

            console.log("✅ Alergia atualizada com sucesso:", updated);
            res.json(updated);
        } catch (error) {
            console.error("Erro ao atualizar alergia:", error);
            res.status(500).json({ message: "Erro ao atualizar alergia" });
        }
    });

    app.delete("/api/allergies/:id", ensureAuthenticated, async (req, res) => {
        try {
            const user = req.user as any;
            const id = parseInt(req.params.id);

            const existing = await storage.getAllergy(id);
            if (!existing || existing.userId !== user.id) {
                return res.status(404).json({ message: "Alergia não encontrada" });
            }

            await storage.deleteAllergy(id);

            console.log("✅ Alergia removida com sucesso");
            res.json({ message: "Alergia removida com sucesso" });
        } catch (error) {
            console.error("Erro ao excluir alergia:", error);
            res.status(500).json({ message: "Erro ao excluir alergia" });
        }
    });
}
