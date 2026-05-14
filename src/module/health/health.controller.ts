import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { HealthService } from './health.service';
import { healthValidation } from './health.validation';

export class HealthController {
  private service = new HealthService();

  async getSummary(req: Request, res: Response) {
    const summary = await this.service.getSummary();
    return res.status(200).json(ApiResponse.success('Health summary fetched successfully', summary));
  }

  async getDiseaseRecords(req: Request, res: Response) {
    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      status: req.query.status as string,
      animalId: req.query.animalId as string,
      search: req.query.search as string,
    };

    const records = await this.service.getDiseaseRecords(query);
    return res.status(200).json(ApiResponse.success('Disease records fetched successfully', records));
  }

  async getDiseaseRecordById(req: Request, res: Response) {
    const record = await this.service.getDiseaseRecordById(req.params.id);
    return res.status(200).json(ApiResponse.success('Disease record fetched successfully', record));
  }

  async createDiseaseRecord(req: Request, res: Response) {
    const validated = healthValidation.diseaseCreate.parse({ body: req.body });
    const record = await this.service.createDiseaseRecord(validated.body);
    return res.status(201).json(ApiResponse.success('Disease record created successfully', record));
  }

  async updateDiseaseRecord(req: Request, res: Response) {
    const validated = healthValidation.diseaseUpdate.parse({ params: req.params, body: req.body });
    const record = await this.service.updateDiseaseRecord(validated.params.id, validated.body);
    return res.status(200).json(ApiResponse.success('Disease record updated successfully', record));
  }

  async deleteDiseaseRecord(req: Request, res: Response) {
    await this.service.deleteDiseaseRecord(req.params.id);
    return res.status(200).json(ApiResponse.success('Disease record deleted successfully'));
  }

  async getVaccinations(req: Request, res: Response) {
    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      status: req.query.status as string,
      animalId: req.query.animalId as string,
      search: req.query.search as string,
    };

    const records = await this.service.getVaccinations(query);
    return res.status(200).json(ApiResponse.success('Vaccinations fetched successfully', records));
  }

  async getUpcomingVaccinations(req: Request, res: Response) {
    const days = req.query.days ? Number(req.query.days) : 30;
    const records = await this.service.getUpcomingVaccinations(days);
    return res.status(200).json(ApiResponse.success('Upcoming vaccinations fetched successfully', records));
  }

  async createVaccination(req: Request, res: Response) {
    const validated = healthValidation.vaccinationCreate.parse({ body: req.body });
    const record = await this.service.createVaccination(validated.body);
    return res.status(201).json(ApiResponse.success('Vaccination created successfully', record));
  }

  async updateVaccination(req: Request, res: Response) {
    const validated = healthValidation.vaccinationUpdate.parse({ params: req.params, body: req.body });
    const record = await this.service.updateVaccination(validated.params.id, validated.body);
    return res.status(200).json(ApiResponse.success('Vaccination updated successfully', record));
  }

  async deleteVaccination(req: Request, res: Response) {
    await this.service.deleteVaccination(req.params.id);
    return res.status(200).json(ApiResponse.success('Vaccination deleted successfully'));
  }

  async getMedicines(req: Request, res: Response) {
    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      search: req.query.search as string,
    };

    const records = await this.service.getMedicines(query);
    return res.status(200).json(ApiResponse.success('Medicines fetched successfully', records));
  }

  async createMedicine(req: Request, res: Response) {
    const validated = healthValidation.medicineCreate.parse({ body: req.body });
    const record = await this.service.createMedicine(validated.body);
    return res.status(201).json(ApiResponse.success('Medicine created successfully', record));
  }

  async updateMedicine(req: Request, res: Response) {
    const validated = healthValidation.medicineUpdate.parse({ params: req.params, body: req.body });
    const record = await this.service.updateMedicine(validated.params.id, validated.body);
    return res.status(200).json(ApiResponse.success('Medicine updated successfully', record));
  }

  async adjustMedicineStock(req: Request, res: Response) {
    const validated = healthValidation.stockAdjustment.parse({ params: req.params, body: req.body });
    const record = await this.service.adjustMedicineStock(validated.params.id, validated.body.delta);
    return res.status(200).json(ApiResponse.success('Medicine stock adjusted successfully', record));
  }

  async deleteMedicine(req: Request, res: Response) {
    await this.service.deleteMedicine(req.params.id);
    return res.status(200).json(ApiResponse.success('Medicine deleted successfully'));
  }
}
