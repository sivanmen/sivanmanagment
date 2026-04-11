import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { iotService } from './iot.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  propertyId: z.string().optional(),
  type: z.enum(['SMART_LOCK', 'THERMOSTAT', 'NOISE_MONITOR', 'CAMERA', 'MOTION_SENSOR', 'SMOKE_DETECTOR', 'WATER_LEAK', 'ENERGY_METER']).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'LOW_BATTERY', 'ERROR']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'name', 'type', 'status', 'lastSeenAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createDeviceSchema = z.object({
  propertyId: z.string().min(1),
  propertyName: z.string().optional(),
  name: z.string().min(1).max(255),
  type: z.enum(['SMART_LOCK', 'THERMOSTAT', 'NOISE_MONITOR', 'CAMERA', 'MOTION_SENSOR', 'SMOKE_DETECTOR', 'WATER_LEAK', 'ENERGY_METER']),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
});

const updateDeviceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

const commandSchema = z.object({
  action: z.string().min(1),
  params: z.record(z.any()).optional(),
});

const eventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class IoTController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { devices, total, page, limit } = await iotService.getAllDevices(filters);
      sendPaginated(res, devices, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await iotService.getDeviceById(req.params.id as string);
      sendSuccess(res, device);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createDeviceSchema.parse(req.body);
      const device = await iotService.createDevice(data);
      sendSuccess(res, device, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateDeviceSchema.parse(req.body);
      const device = await iotService.updateDevice(req.params.id as string, data);
      sendSuccess(res, device);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await iotService.deleteDevice(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = eventsQuerySchema.parse(req.query);
      const { events, total, page, limit } = await iotService.getDeviceEvents(req.params.id as string, filters);
      sendPaginated(res, events, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async sendCommand(req: Request, res: Response, next: NextFunction) {
    try {
      const command = commandSchema.parse(req.body);
      const result = await iotService.sendCommand(req.params.id as string, command);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await iotService.getDashboard();
      sendSuccess(res, dashboard);
    } catch (error) {
      next(error);
    }
  }
}

export const iotController = new IoTController();
