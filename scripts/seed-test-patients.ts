/**
 * Seed script to create 5 test patients with appointments for today
 * and complete medical history (comorbidities, allergies, medications, surgeries)
 */

import 'dotenv/config';
import { db, pool } from '../server/db';
import { profiles, appointments, allergies, medications, surgeries, diagnoses } from '../shared/schema';

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

async function seedTestPatients() {
    console.log('🌱 Starting seed of test patients...');

    // Get the first user (doctor) to associate patients with
    const userResult = await pool.query('SELECT id, full_name, crm, specialty FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
        console.error('❌ No users found. Please register a user first.');
        process.exit(1);
    }

    const user = userResult.rows[0];
    const userId = user.id;
    console.log(`📋 Using user: ${user.full_name || 'User'} (ID: ${userId})`);

    // Test patients data
    const patientsData = [
        {
            name: 'Maria Silva Santos',
            birthDate: '1965-03-15',
            gender: 'feminino',
            bloodType: 'A+',
            cpf: '123.456.789-00',
            phone: '(11) 98765-4321',
            email: 'maria.silva@email.com',
            city: 'São Paulo',
            state: 'SP',
            profession: 'Professora',
            insuranceName: 'Unimed',
            // Appointment for today
            appointmentTime: '09:00',
            appointmentType: 'consulta',
            appointmentDuration: 30,
            appointmentPrice: 25000, // R$ 250.00
            // Medical history
            comorbidities: [
                { cidCode: 'E11', status: 'cronico', notes: 'Diabetes Mellitus Tipo 2 - Diagnóstico em 2015' },
                { cidCode: 'I10', status: 'cronico', notes: 'Hipertensão Arterial Sistêmica' },
            ],
            allergyList: [
                { allergen: 'Dipirona', allergenType: 'medication', reaction: 'Urticária', severity: 'moderada' },
                { allergen: 'Camarão', allergenType: 'food', reaction: 'Angioedema', severity: 'grave' },
            ],
            medicationList: [
                { name: 'Metformina', format: 'comprimido', dosage: '850', dosageUnit: 'mg', frequency: '2x ao dia', startDate: '2015-06-01' },
                { name: 'Losartana', format: 'comprimido', dosage: '50', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2018-03-15' },
                { name: 'AAS', format: 'comprimido', dosage: '100', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2019-01-10' },
            ],
            surgeryList: [
                { procedureName: 'Colecistectomia Laparoscópica', hospitalName: 'Hospital Sírio-Libanês', surgeryDate: '2010-08-20', notes: 'Sem complicações' },
            ],
        },
        {
            name: 'João Pedro Oliveira',
            birthDate: '1978-07-22',
            gender: 'masculino',
            bloodType: 'O+',
            cpf: '234.567.890-11',
            phone: '(11) 97654-3210',
            email: 'joao.oliveira@email.com',
            city: 'São Paulo',
            state: 'SP',
            profession: 'Engenheiro',
            insuranceName: 'Bradesco Saúde',
            // Appointment for today
            appointmentTime: '10:00',
            appointmentType: 'retorno',
            appointmentDuration: 20,
            appointmentPrice: 15000, // R$ 150.00
            // Medical history
            comorbidities: [
                { cidCode: 'J45', status: 'cronico', notes: 'Asma brônquica - desde a infância' },
                { cidCode: 'E78.0', status: 'em_tratamento', notes: 'Hipercolesterolemia' },
            ],
            allergyList: [
                { allergen: 'Penicilina', allergenType: 'medication', reaction: 'Anafilaxia', severity: 'grave' },
                { allergen: 'Gatos', allergenType: 'environment', reaction: 'Rinite', severity: 'leve' },
            ],
            medicationList: [
                { name: 'Symbicort', format: 'spray', dosage: '160/4.5', dosageUnit: 'mcg', frequency: '2x ao dia', startDate: '2010-05-01' },
                { name: 'Rosuvastatina', format: 'comprimido', dosage: '10', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2022-09-15' },
            ],
            surgeryList: [
                { procedureName: 'Apendicectomia', hospitalName: 'Hospital Albert Einstein', surgeryDate: '1995-03-10', notes: 'Cirurgia de emergência na infância' },
                { procedureName: 'Septoplastia', hospitalName: 'Hospital São Luiz', surgeryDate: '2015-06-18', notes: 'Correção de desvio de septo' },
            ],
        },
        {
            name: 'Ana Clara Ferreira',
            birthDate: '1990-11-08',
            gender: 'feminino',
            bloodType: 'B-',
            cpf: '345.678.901-22',
            phone: '(11) 96543-2109',
            email: 'ana.ferreira@email.com',
            city: 'Campinas',
            state: 'SP',
            profession: 'Advogada',
            insuranceName: 'SulAmérica',
            // Appointment for today
            appointmentTime: '11:30',
            appointmentType: 'consulta',
            appointmentDuration: 30,
            appointmentPrice: 25000,
            // Medical history
            comorbidities: [
                { cidCode: 'F41.1', status: 'em_tratamento', notes: 'Transtorno de Ansiedade Generalizada' },
                { cidCode: 'G43', status: 'cronico', notes: 'Enxaqueca com aura' },
            ],
            allergyList: [
                { allergen: 'Ibuprofeno', allergenType: 'medication', reaction: 'Broncoespasmo', severity: 'moderada' },
            ],
            medicationList: [
                { name: 'Escitalopram', format: 'comprimido', dosage: '10', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2023-01-15' },
                { name: 'Topiramato', format: 'comprimido', dosage: '50', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2022-08-01' },
            ],
            surgeryList: [],
        },
        {
            name: 'Carlos Eduardo Lima',
            birthDate: '1955-02-28',
            gender: 'masculino',
            bloodType: 'AB+',
            cpf: '456.789.012-33',
            phone: '(11) 95432-1098',
            email: 'carlos.lima@email.com',
            city: 'Santo André',
            state: 'SP',
            profession: 'Aposentado',
            insuranceName: 'Particular',
            // Appointment for today
            appointmentTime: '14:00',
            appointmentType: 'consulta',
            appointmentDuration: 45,
            appointmentPrice: 35000, // R$ 350.00
            // Medical history
            comorbidities: [
                { cidCode: 'I25', status: 'cronico', notes: 'Doença Isquêmica do Coração - IAM em 2018' },
                { cidCode: 'E11', status: 'cronico', notes: 'Diabetes Mellitus Tipo 2' },
                { cidCode: 'I10', status: 'cronico', notes: 'Hipertensão Arterial' },
                { cidCode: 'N18', status: 'cronico', notes: 'Doença Renal Crônica estágio 3' },
            ],
            allergyList: [
                { allergen: 'Contraste Iodado', allergenType: 'medication', reaction: 'Reação anafilactoide', severity: 'grave' },
                { allergen: 'Sulfas', allergenType: 'medication', reaction: 'Rash cutâneo', severity: 'moderada' },
            ],
            medicationList: [
                { name: 'Carvedilol', format: 'comprimido', dosage: '25', dosageUnit: 'mg', frequency: '2x ao dia', startDate: '2018-12-01' },
                { name: 'Enalapril', format: 'comprimido', dosage: '20', dosageUnit: 'mg', frequency: '2x ao dia', startDate: '2018-12-01' },
                { name: 'Furosemida', format: 'comprimido', dosage: '40', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2019-06-15' },
                { name: 'Insulina NPH', format: 'injetável', dosage: '30', dosageUnit: 'UI', frequency: '2x ao dia', startDate: '2020-03-01' },
                { name: 'AAS', format: 'comprimido', dosage: '100', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2018-12-01' },
                { name: 'Clopidogrel', format: 'comprimido', dosage: '75', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2018-12-01' },
            ],
            surgeryList: [
                { procedureName: 'Angioplastia Coronariana com Stent', hospitalName: 'InCor', surgeryDate: '2018-11-15', notes: '2 stents em DA e CX' },
                { procedureName: 'Prostatectomia Transuretral', hospitalName: 'Hospital Beneficência Portuguesa', surgeryDate: '2021-04-20', notes: 'HPB' },
            ],
        },
        {
            name: 'Beatriz Souza Mendes',
            birthDate: '1988-09-12',
            gender: 'feminino',
            bloodType: 'O-',
            cpf: '567.890.123-44',
            phone: '(11) 94321-0987',
            email: 'beatriz.mendes@email.com',
            city: 'São Paulo',
            state: 'SP',
            profession: 'Nutricionista',
            insuranceName: 'Amil',
            // Appointment for today
            appointmentTime: '15:30',
            appointmentType: 'procedimento',
            appointmentDuration: 60,
            appointmentPrice: 50000, // R$ 500.00
            // Medical history
            comorbidities: [
                { cidCode: 'D50', status: 'em_tratamento', notes: 'Anemia Ferropriva' },
                { cidCode: 'E06.3', status: 'cronico', notes: 'Tireoidite de Hashimoto' },
            ],
            allergyList: [
                { allergen: 'Látex', allergenType: 'environment', reaction: 'Dermatite de contato', severity: 'moderada' },
                { allergen: 'Frutos do mar', allergenType: 'food', reaction: 'Urticária', severity: 'leve' },
            ],
            medicationList: [
                { name: 'Levotiroxina', format: 'comprimido', dosage: '75', dosageUnit: 'mcg', frequency: '1x ao dia (jejum)', startDate: '2019-02-10' },
                { name: 'Sulfato Ferroso', format: 'comprimido', dosage: '300', dosageUnit: 'mg', frequency: '1x ao dia', startDate: '2024-01-05' },
                { name: 'Vitamina D3', format: 'cápsula', dosage: '2000', dosageUnit: 'UI', frequency: '1x ao dia', startDate: '2023-06-01' },
            ],
            surgeryList: [
                { procedureName: 'Cesariana', hospitalName: 'Hospital Pro Matre', surgeryDate: '2020-05-18', notes: 'Nascimento do primeiro filho' },
            ],
        },
    ];

    let createdProfiles = 0;
    let createdAppointments = 0;
    let createdAllergies = 0;
    let createdMedications = 0;
    let createdSurgeries = 0;
    let createdDiagnoses = 0;

    for (const patient of patientsData) {
        try {
            // Create patient profile
            const [profile] = await db.insert(profiles).values({
                userId,
                name: patient.name,
                birthDate: patient.birthDate,
                gender: patient.gender,
                bloodType: patient.bloodType,
                cpf: patient.cpf,
                phone: patient.phone,
                email: patient.email,
                city: patient.city,
                state: patient.state,
                profession: patient.profession,
                insuranceName: patient.insuranceName,
                isDefault: false,
            }).returning();

            createdProfiles++;
            console.log(`✅ Created profile: ${patient.name} (ID: ${profile.id})`);

            // Create appointment for today
            await db.insert(appointments).values({
                userId,
                profileId: profile.id,
                patientName: patient.name,
                date: today,
                time: patient.appointmentTime,
                type: patient.appointmentType,
                status: 'scheduled',
                price: patient.appointmentPrice,
                duration: patient.appointmentDuration,
                notes: `Consulta agendada para teste`,
            });
            createdAppointments++;

            // Create diagnoses (comorbidities)
            for (const diag of patient.comorbidities) {
                await db.insert(diagnoses).values({
                    userId,
                    cidCode: diag.cidCode,
                    diagnosisDate: today,
                    status: diag.status,
                    notes: diag.notes,
                });
                createdDiagnoses++;
            }

            // Create allergies
            for (const allergy of patient.allergyList) {
                await db.insert(allergies).values({
                    userId,
                    profileId: profile.id,
                    allergen: allergy.allergen,
                    allergenType: allergy.allergenType,
                    reaction: allergy.reaction,
                    severity: allergy.severity,
                });
                createdAllergies++;
            }

            // Create medications
            for (const med of patient.medicationList) {
                await db.insert(medications).values({
                    userId,
                    name: med.name,
                    format: med.format,
                    dosage: med.dosage,
                    dosageUnit: med.dosageUnit,
                    frequency: med.frequency,
                    startDate: med.startDate,
                    isActive: true,
                });
                createdMedications++;
            }

            // Create surgeries
            for (const surgery of patient.surgeryList) {
                await db.insert(surgeries).values({
                    userId,
                    procedureName: surgery.procedureName,
                    hospitalName: surgery.hospitalName,
                    surgeryDate: surgery.surgeryDate,
                    notes: surgery.notes,
                });
                createdSurgeries++;
            }

        } catch (error) {
            console.error(`❌ Error creating patient ${patient.name}:`, error);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Profiles created: ${createdProfiles}`);
    console.log(`   Appointments created: ${createdAppointments}`);
    console.log(`   Diagnoses created: ${createdDiagnoses}`);
    console.log(`   Allergies created: ${createdAllergies}`);
    console.log(`   Medications created: ${createdMedications}`);
    console.log(`   Surgeries created: ${createdSurgeries}`);
    console.log('\n✅ Seed completed successfully!');
}

// Run the seed
seedTestPatients()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    });
