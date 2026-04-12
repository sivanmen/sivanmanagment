import type { Request, Response, NextFunction } from 'express';
import { messagingInstancesService } from './messaging-instances.service';

export async function listInstances(req: Request, res: Response, next: NextFunction) {
  try {
    const { isActive, provider } = req.query;
    const instances = await messagingInstancesService.list({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      provider: typeof provider === 'string' ? provider : undefined,
    });
    res.json({ data: instances });
  } catch (error) { next(error); }
}

export async function getInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const instance = await messagingInstancesService.getById(req.params.id as string);
    res.json({ data: instance });
  } catch (error) { next(error); }
}

export async function createInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const instance = await messagingInstancesService.create(req.body);
    res.status(201).json({ data: instance, message: 'Messaging instance created' });
  } catch (error) { next(error); }
}

export async function updateInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const instance = await messagingInstancesService.update(req.params.id as string, req.body);
    res.json({ data: instance, message: 'Messaging instance updated' });
  } catch (error) { next(error); }
}

export async function deleteInstance(req: Request, res: Response, next: NextFunction) {
  try {
    await messagingInstancesService.delete(req.params.id as string);
    res.json({ message: 'Messaging instance deleted' });
  } catch (error) { next(error); }
}

export async function testConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messagingInstancesService.testConnection(req.params.id as string);
    res.json({ data: result });
  } catch (error) { next(error); }
}

export async function getQrCode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messagingInstancesService.getQrCode(req.params.id as string);
    res.json({ data: result });
  } catch (error) { next(error); }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messagingInstancesService.sendMessage(req.body);
    res.json({ data: result });
  } catch (error) { next(error); }
}

export async function assignProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyIds } = req.body;
    const result = await messagingInstancesService.assignProperties(req.params.id as string, propertyIds);
    res.json({ data: result, message: `${result.count} properties assigned` });
  } catch (error) { next(error); }
}

export async function disconnectInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messagingInstancesService.disconnect(req.params.id as string);
    res.json({ data: result, message: 'Instance disconnected' });
  } catch (error) { next(error); }
}
