import { AuditLog } from '../types/business';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './storageUtils';

export const createAuditLog = (
  action: AuditLog['action'],
  entityType: AuditLog['entityType'],
  entityId: string,
  entityName: string,
  userId: string,
  changes: AuditLog['changes'],
  description: string,
  metadata?: AuditLog['metadata']
): AuditLog => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    action,
    entityType,
    entityId,
    entityName,
    userId,
    changes,
    description,
    metadata
  };
};

export const saveAuditLog = async (auditLog: AuditLog) => {
  const existingLogs = await loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const updatedLogs = [auditLog, ...existingLogs];
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return await loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
};

export const getEntityAuditLogs = async (entityId: string): Promise<AuditLog[]> => {
  const allLogs = await getAuditLogs();
  return allLogs.filter(log => log.entityId === entityId);
};

export const compareObjects = (oldObj: any, newObj: any): AuditLog['changes'] => {
  const changes: AuditLog['changes'] = [];
  
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  allKeys.forEach(key => {
    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue
      });
    }
  });
  
  return changes;
};

export const formatAuditLogDescription = (log: AuditLog, t: any): string => {
  switch (log.action) {
    case 'CREATE':
      return `${t.created} ${t[log.entityType.toLowerCase()]} "${log.entityName}"`;
    case 'UPDATE':
      return `${t.updated} ${t[log.entityType.toLowerCase()]} "${log.entityName}"`;
    case 'DELETE':
      return `${t.deleted} ${t[log.entityType.toLowerCase()]} "${log.entityName}"`;
    case 'PAYMENT':
      return `${t.recordedPayment} ${log.metadata?.amount} pour ${log.entityName}`;
    default:
      return log.description;
  }
};