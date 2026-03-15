import { Router } from 'express';
import { AsyncHandler } from '../../utils/async-handler';
import { HealthController } from './health.controller';

const router = Router();
const controller = new HealthController();

router.get('/summary', AsyncHandler((req, res) => controller.getSummary(req, res)));

router.get('/diseases', AsyncHandler((req, res) => controller.getDiseaseRecords(req, res)));
router.get('/diseases/:id', AsyncHandler((req, res) => controller.getDiseaseRecordById(req, res)));
router.post('/diseases', AsyncHandler((req, res) => controller.createDiseaseRecord(req, res)));
router.patch('/diseases/:id', AsyncHandler((req, res) => controller.updateDiseaseRecord(req, res)));
router.delete('/diseases/:id', AsyncHandler((req, res) => controller.deleteDiseaseRecord(req, res)));

router.get('/vaccinations', AsyncHandler((req, res) => controller.getVaccinations(req, res)));
router.get('/vaccinations/upcoming', AsyncHandler((req, res) => controller.getUpcomingVaccinations(req, res)));
router.post('/vaccinations', AsyncHandler((req, res) => controller.createVaccination(req, res)));
router.patch('/vaccinations/:id', AsyncHandler((req, res) => controller.updateVaccination(req, res)));
router.delete('/vaccinations/:id', AsyncHandler((req, res) => controller.deleteVaccination(req, res)));

router.get('/medicines', AsyncHandler((req, res) => controller.getMedicines(req, res)));
router.post('/medicines', AsyncHandler((req, res) => controller.createMedicine(req, res)));
router.patch('/medicines/:id', AsyncHandler((req, res) => controller.updateMedicine(req, res)));
router.patch('/medicines/:id/adjust-stock', AsyncHandler((req, res) => controller.adjustMedicineStock(req, res)));
router.delete('/medicines/:id', AsyncHandler((req, res) => controller.deleteMedicine(req, res)));

export default router;
